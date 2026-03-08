const aiServiceFactory = require('./aiServiceFactory');
const userSettingsService = require('./userSettingsService');
const aiProviderConfig = require('../config/aiProviderConfig');
const contextBuilderService = require('./contextBuilderService');
const { riskAlertRepo, notificationRepo, riskMonitoringStateRepo, wearableStreamDataRepo } = require('../repositories');
const { userIdFromEmail } = require('../models/riskMonitoringState');

/**
 * 流数据推荐字段的合理范围（用于轻量校验与质量标记，不拒绝请求）
 * 与 docs/implementation/ANOMALY_ALERT_IMPLEMENTATION.md 5.2 一致
 */
const STREAM_DATA_RANGES = {
  heartRate: { min: 30, max: 250 },
  glucose: { min: 20, max: 500 },
  hrv: { min: 0, max: 500 },
  steps: { min: 0, max: null },
  sleepMinutes: { min: 0, max: 1440 },
  bloodPressure: {
    systolic: { min: 60, max: 250 },
    diastolic: { min: 40, max: 150 }
  }
};

/** 时间窗口字符串 → 毫秒，用于异常检测数据范围 */
const TIME_RANGE_MS = { '1h': 60 * 60 * 1000, '6h': 6 * 60 * 60 * 1000, '24h': 24 * 60 * 60 * 1000 };
const DEFAULT_FETCH_LIMIT_FOR_TIME_RANGE = 500;
/** 送 LLM 的数据点上限，超出则等间隔采样，控制 token 与延迟 */
const MAX_DATA_POINTS_FOR_PROMPT = 200;
/** 自动异常检测节流间隔（毫秒） */
const AUTO_DETECT_THROTTLE_MS = 5 * 60 * 1000;
/** getRecentDataPoints 单次查询条数上限，防止误传过大值 */
const MAX_RECENT_DATA_POINTS_LIMIT = 500;
/** 异常置信度低于此值不生成预警，仅保留在 analysis 中（待复核） */
const ANOMALY_CONFIDENCE_THRESHOLD = 0.6;
/** 规则引擎阈值：血糖(mg/dL)、收缩压(mmHg) */
const RULE_GLUCOSE_HYPOGLYCEMIA = 70;
const RULE_SYSTOLIC_HIGH = 180;
const RULE_SYSTOLIC_MEDIUM = 160;
/** LLM 调用超时(ms)、重试次数 */
const LLM_TIMEOUT_MS = 60000;
const LLM_RETRY_COUNT = 1;

/**
 * 对单条流数据的 data 做轻量校验，返回质量标记；不抛错、不拒绝写入。
 * @param {Object} data 请求体中的 data
 * @returns {'ok'|'out_of_range'|'invalid'}
 */
function computeStreamDataQuality(data) {
  if (!data || typeof data !== 'object') return 'ok';
  try {
    let hasOutOfRange = false;
    if (typeof data.heartRate === 'number') {
      const r = STREAM_DATA_RANGES.heartRate;
      if (data.heartRate < r.min || data.heartRate > r.max) hasOutOfRange = true;
    }
    if (typeof data.glucose === 'number') {
      const r = STREAM_DATA_RANGES.glucose;
      if (data.glucose < r.min || data.glucose > r.max) hasOutOfRange = true;
    }
    if (typeof data.hrv === 'number') {
      const r = STREAM_DATA_RANGES.hrv;
      if (data.hrv < r.min || data.hrv > r.max) hasOutOfRange = true;
    }
    if (typeof data.steps === 'number' && data.steps < STREAM_DATA_RANGES.steps.min) hasOutOfRange = true;
    if (typeof data.sleepMinutes === 'number') {
      const r = STREAM_DATA_RANGES.sleepMinutes;
      if (data.sleepMinutes < r.min || data.sleepMinutes > r.max) hasOutOfRange = true;
    }
    if (data.bloodPressure && typeof data.bloodPressure === 'object') {
      const sp = data.bloodPressure.systolic, dp = data.bloodPressure.diastolic;
      if (typeof sp === 'number' && (sp < STREAM_DATA_RANGES.bloodPressure.systolic.min || sp > STREAM_DATA_RANGES.bloodPressure.systolic.max)) hasOutOfRange = true;
      if (typeof dp === 'number' && (dp < STREAM_DATA_RANGES.bloodPressure.diastolic.min || dp > STREAM_DATA_RANGES.bloodPressure.diastolic.max)) hasOutOfRange = true;
    }
    return hasOutOfRange ? 'out_of_range' : 'ok';
  } catch (_) {
    return 'invalid';
  }
}

/**
 * 等间隔采样，保留首尾，控制送 LLM 的数据量
 * @param {Array} data 按时间正序的数据点
 * @param {number} maxPoints 目标条数
 * @returns {Array}
 */
function sampleDataPoints(data, maxPoints) {
  if (!Array.isArray(data) || data.length <= maxPoints) return data;
  const out = [];
  const step = (data.length - 1) / (maxPoints - 1);
  for (let i = 0; i < maxPoints; i++) {
    const idx = i === maxPoints - 1 ? data.length - 1 : Math.round(i * step);
    out.push(data[idx]);
  }
  return out;
}

/**
 * 从模型返回文本中提取第一个合法 JSON 对象（支持多段或前后有说明文字）
 * @param {string} text 原始响应
 * @param {string} logLabel 解析失败时日志前缀
 * @returns {Object|null} 解析出的对象，失败返回 null 并打日志
 */
function extractFirstValidJson(text, logLabel = 'AI response') {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  const startIdx = trimmed.indexOf('{');
  if (startIdx === -1) {
    console.warn(`[${logLabel}] No JSON object found, preview: ${trimmed.slice(0, 200)}`);
    return null;
  }
  let depth = 0;
  let inDouble = false;
  let escape = false;
  let endIdx = -1;
  for (let i = startIdx; i < trimmed.length; i++) {
    const c = trimmed[i];
    if (escape) { escape = false; continue; }
    if (c === '\\' && inDouble) { escape = true; continue; }
    if (c === '"') { inDouble = !inDouble; continue; }
    if (!inDouble) {
      if (c === '{') depth++;
      else if (c === '}') { depth--; if (depth === 0) { endIdx = i; break; } }
    }
  }
  if (endIdx === -1) {
    console.warn(`[${logLabel}] Unbalanced braces, preview: ${trimmed.slice(startIdx, startIdx + 300)}`);
    return null;
  }
  const jsonStr = trimmed.slice(startIdx, endIdx + 1);
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.warn(`[${logLabel}] JSON.parse failed: ${e.message}, preview: ${jsonStr.slice(0, 200)}`);
    return null;
  }
}

/**
 * 实时风险监测服务
 * 利用可穿戴设备实时流数据，通过LLM分析趋势，提前预警异常情况
 */
class RiskMonitoringService {
  constructor() {
    console.log('⚠️ Risk Monitoring Service initialized');
  }

  /**
   * 处理实时流数据
   * @param {string} userEmail 用户邮箱
   * @param {string} deviceType 设备类型
   * @param {Object} data 实时数据（推荐含 heartRate、bloodPressure、glucose、hrv、steps 等，见实现文档 5.2）
   * @returns {Promise<Object>} 处理结果
   */
  async processStreamData(userEmail, deviceType, data) {
    try {
      const dataQuality = computeStreamDataQuality(data);
      const timestamp = new Date().toISOString();
      const dataPoint = {
        userEmail,
        deviceType,
        data,
        timestamp,
        processed: false,
        ...(dataQuality !== 'ok' && { dataQuality })
      };

      await wearableStreamDataRepo.addDataPoint(dataPoint);

      this.maybeTriggerAutoDetect(userEmail).catch((err) => {
        console.error('❌ Auto anomaly detect failed:', err.message);
      });

      return {
        success: true,
        dataPoint: { ...dataPoint, dataQuality: dataQuality }
      };
    } catch (error) {
      console.error('❌ Error processing stream data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 可选自动异常检测：距上次检测超过节流间隔时异步执行一次 detectAnomalies。
   * 由 processStreamData 在写入成功后调用；通过环境变量 RISK_AUTO_DETECT_ENABLED=true 开启。
   */
  async maybeTriggerAutoDetect(userEmail) {
    if (process.env.RISK_AUTO_DETECT_ENABLED !== 'true') return;
    const userId = userIdFromEmail(userEmail);
    const state = await riskMonitoringStateRepo.getRiskMonitoringState(userId);
    const now = Date.now();
    const lastAt = state?.lastAutoDetectAt ?? null;
    const lastMs = lastAt ? new Date(lastAt).getTime() : 0;
    if (now - lastMs < AUTO_DETECT_THROTTLE_MS) return;
    await riskMonitoringStateRepo.setRiskMonitoringState(userId, { lastAutoDetectAt: new Date().toISOString(), userEmail });
    setImmediate(() => {
      this.detectAnomalies(userEmail, [], {}).catch((err) => {
        console.error('❌ Auto detectAnomalies error:', err.message);
      });
    });
  }

  /**
   * 异常检测
   * @param {string} userEmail 用户邮箱
   * @param {Array} dataStream 请求体中的可选数据流，与服务端数据合并
   * @param {Object} options 可选。{ timeRange: '1h'|'6h'|'24h', deviceType: string }
   * @returns {Promise<Object>} 检测结果（含 dataPointCount、timeRange、deviceType 供前端展示）
   */
  async detectAnomalies(userEmail, dataStream, options = {}) {
    try {
      const { timeRange, deviceType } = options;
      const limitCount = 100;
      const fetchOptions = {};
      if (timeRange && TIME_RANGE_MS[timeRange]) fetchOptions.timeRange = timeRange;
      if (deviceType && typeof deviceType === 'string') fetchOptions.deviceType = deviceType;

      const recentData = await this.getRecentDataPoints(userEmail, limitCount, fetchOptions);
      const allData = [...recentData, ...(Array.isArray(dataStream) ? dataStream : [])];

      const dataForPrompt = allData.length > MAX_DATA_POINTS_FOR_PROMPT
        ? sampleDataPoints(allData, MAX_DATA_POINTS_FOR_PROMPT)
        : allData;
      const sampledDown = dataForPrompt.length < allData.length;

      // 规则引擎优先：明确阈值先走规则，命中类型与 LLM 合并去重
      const { ruleHits } = this.runRuleBasedDetection(dataForPrompt);
      const typesFromRules = new Set(ruleHits.map((h) => h.type));
      const ruleAlerts = [];
      for (const hit of ruleHits) {
        const alert = await this.generateAlert(userEmail, hit.type, hit.severity, hit);
        ruleAlerts.push(alert);
      }

      // 获取用户AI设置并优先使用OpenAI
      const userSettings = await userSettingsService.getUserAISettings(userEmail);
      const { aiProvider, aiModel } = aiProviderConfig.getAIServiceConfig(userSettings);
      const userLanguage = (userSettings.success && userSettings.language) ? userSettings.language : 'zh';

      // 通过 Context Builder 获取档案+用药（便于换库、统一 prompt 来源）
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      let userContextText = '';
      try {
        const payload = await contextBuilderService.buildAIContext(sanitizedEmail, { medications: true, language: userLanguage });
        userContextText = contextBuilderService.formatContextForSystemPrompt(payload);
      } catch (e) {
        console.warn('⚠️ buildAIContext failed, using empty context:', e.message);
      }

      // 使用LLM分析数据趋势和异常（送 prompt 的为采样后数据）
      const prompt = this.buildAnomalyDetectionPrompt(dataForPrompt, userContextText, userLanguage);

      let aiResult;
      try {
        aiResult = await this.analyzeHealthRecordsWithRetry(
          { documents: [{ text: prompt }] },
          { provider: aiProvider, model: aiModel }
        );
      } catch (llmError) {
        if (ruleAlerts.length > 0) {
          return this._ruleOnlyResult(ruleHits, ruleAlerts, allData, sampledDown, dataForPrompt.length, timeRange, deviceType, '当前仅规则检测可用，AI 分析暂时不可用');
        }
        throw llmError;
      }

      if (!aiResult.success) {
        if (ruleAlerts.length > 0) {
          return this._ruleOnlyResult(ruleHits, ruleAlerts, allData, sampledDown, dataForPrompt.length, timeRange, deviceType, 'AI 分析失败，已根据规则生成上述预警');
        }
        throw new Error(aiResult.error || 'AI analysis failed');
      }

      const anomalyAnalysis = this.parseAnomalyAnalysis(aiResult.analysis);

      const llmAlerts = [];
      for (const anomaly of anomalyAnalysis.anomalies || []) {
        if (anomaly._skipAlert) continue;
        if (typesFromRules.has(anomaly.type)) continue;
        const alert = await this.generateAlert(userEmail, anomaly.type, anomaly.severity, anomaly);
        llmAlerts.push(alert);
      }

      const allAnomalies = [...ruleHits.map((h) => ({ type: h.type, severity: h.severity, description: h.description, recommendation: h.recommendation, fromRule: true })), ...(anomalyAnalysis.anomalies || [])];
      const hasAnyAnomaly = allAnomalies.length > 0;

      return {
        hasAnomaly: hasAnyAnomaly,
        anomalies: allAnomalies,
        alerts: [...ruleAlerts, ...llmAlerts],
        analysis: { ...anomalyAnalysis, hasAnomaly: hasAnyAnomaly, anomalies: allAnomalies },
        dataPointCount: allData.length,
        ...(sampledDown && { sampledDown: true, sampledTo: dataForPrompt.length }),
        ...(timeRange && { timeRange }),
        ...(deviceType && { deviceType })
      };
    } catch (error) {
      console.error('❌ Error detecting anomalies:', error);
      return {
        hasAnomaly: false,
        anomalies: [],
        alerts: [],
        error: error.message
      };
    }
  }

  /**
   * 血糖预测（提前15-30分钟）
   * @param {string} userEmail 用户邮箱
   * @param {Array} glucoseData 血糖数据
   * @returns {Promise<Object>} 预测结果
   */
  async predictHypoglycemia(userEmail, glucoseData) {
    try {
      const userSettings = await userSettingsService.getUserAISettings(userEmail);
      const userLanguage = (userSettings.success && userSettings.language) ? userSettings.language : 'zh';
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      let userContextText = '';
      try {
        const payload = await contextBuilderService.buildAIContext(sanitizedEmail, { medications: true, language: userLanguage });
        userContextText = contextBuilderService.formatContextForSystemPrompt(payload);
      } catch (e) {
        console.warn('⚠️ buildAIContext failed, using empty context:', e.message);
      }

      const { aiProvider, aiModel } = aiProviderConfig.getAIServiceConfig(userSettings);
      // 构建预测提示
      const prompt = this.buildHypoglycemiaPredictionPrompt(glucoseData, userContextText, userLanguage);

      const aiResult = await this.analyzeHealthRecordsWithRetry(
        { documents: [{ text: prompt }] },
        { provider: aiProvider, model: aiModel }
      );

      if (!aiResult.success) {
        throw new Error(aiResult.error || 'AI prediction failed');
      }
      
      // 解析预测结果
      const prediction = this.parseHypoglycemiaPrediction(aiResult.analysis);
      
      // 如果预测到低血糖风险，生成预警
      let alert = null;
      if (prediction.riskLevel === 'high' || prediction.predictedGlucose < 70) {
        alert = await this.generateAlert(
          userEmail,
          'hypoglycemia',
          'high',
          {
            predictedGlucose: prediction.predictedGlucose,
            timeWindow: prediction.timeWindow,
            confidence: prediction.confidence
          }
        );
      }
      
      return { success: true, prediction, alert };
    } catch (error) {
      console.error('❌ Error predicting hypoglycemia:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 心率变异性分析
   * @param {string} userEmail 用户邮箱
   * @param {Array} heartRateData 心率数据
   * @returns {Promise<Object>} 分析结果
   */
  async analyzeHRVTrend(userEmail, heartRateData) {
    try {
      const historicalData = await this.getRecentHeartRateData(userEmail, 30); // 最近30天
      const allData = [...historicalData, ...heartRateData];
      
      // 通过 Context Builder 获取档案+用药
      const userSettings = await userSettingsService.getUserAISettings(userEmail);
      const userLanguage = (userSettings.success && userSettings.language) ? userSettings.language : 'zh';
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      let userContextText = '';
      try {
        const payload = await contextBuilderService.buildAIContext(sanitizedEmail, { medications: true, language: userLanguage });
        userContextText = contextBuilderService.formatContextForSystemPrompt(payload);
      } catch (e) {
        console.warn('⚠️ buildAIContext failed, using empty context:', e.message);
      }

      const { aiProvider, aiModel } = aiProviderConfig.getAIServiceConfig(userSettings);
      // 构建HRV分析提示
      const prompt = this.buildHRVAnalysisPrompt(allData, userContextText, userLanguage);

      const aiResult = await this.analyzeHealthRecordsWithRetry(
        { documents: [{ text: prompt }] },
        { provider: aiProvider, model: aiModel }
      );

      if (!aiResult.success) {
        throw new Error(aiResult.error || 'AI analysis failed');
      }
      
      // 解析分析结果
      const hrvAnalysis = this.parseHRVAnalysis(aiResult.analysis);
      
      // 如果检测到HRV持续下降，生成预警
      let alert = null;
      if (hrvAnalysis.trend === 'declining' && hrvAnalysis.severity === 'high') {
        alert = await this.generateAlert(
          userEmail,
          'cardiacFatigue',
          'medium',
          {
            trend: hrvAnalysis.trend,
            declineRate: hrvAnalysis.declineRate,
            recommendation: hrvAnalysis.recommendation
          }
        );
      }
      
      return { success: true, analysis: hrvAnalysis, alert };
    } catch (error) {
      console.error('❌ Error analyzing HRV trend:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 生成预警
   * @param {string} userEmail 用户邮箱
   * @param {string} alertType 预警类型
   * @param {string} severity 严重程度
   * @param {Object} details 详细信息
   * @returns {Promise<Object>} 预警对象
   */
  async generateAlert(userEmail, alertType, severity, details = {}) {
    try {
      const alert = {
        userEmail,
        alertType,
        severity, // low, medium, high, critical
        details,
        timestamp: new Date().toISOString(),
        acknowledged: false,
        action: this.getAlertAction(alertType, severity)
      };
      
      const saved = await riskAlertRepo.addAlert(alert);
      await this.sendNotification(userEmail, saved);
      return saved;
    } catch (error) {
      console.error('❌ Error generating alert:', error);
      throw error;
    }
  }

  /**
   * 发送通知
   * @param {string} userEmail 用户邮箱
   * @param {Object} alert 预警对象
   */
  async sendNotification(userEmail, alert) {
    try {
      await notificationRepo.addNotification({
        userEmail,
        type: 'risk_alert',
        alertId: alert.id,
        title: this.getAlertTitle(alert.alertType, alert.severity),
        message: this.getAlertMessage(alert),
        timestamp: new Date().toISOString(),
        read: false
      });
    } catch (error) {
      console.error('❌ Error sending notification:', error);
    }
  }

  /**
   * 获取最近的预警
   * @param {string} userEmail 用户邮箱
   * @param {number} limitCount 数量限制
   * @returns {Promise<Array>} 预警列表
   */
  async getRecentAlerts(userEmail, limitCount = 20) {
    try {
      return await riskAlertRepo.getRecentAlertsByUser(userEmail, limitCount);
    } catch (error) {
      console.error('❌ Error getting recent alerts:', error);
      return [];
    }
  }

  /**
   * 获取实时监测状态
   * @param {string} userEmail 用户邮箱
   * @returns {Promise<Object>} 监测状态
   */
  async getMonitoringStatus(userEmail) {
    try {
      const [recentData, recentAlerts] = await Promise.all([
        this.getRecentDataPoints(userEmail, 50),
        this.getRecentAlerts(userEmail, 10)
      ]);
      const latest = recentData.length > 0 ? recentData[recentData.length - 1] : null;
      const lastDataPoint = latest ? { ...latest.data, timestamp: latest.timestamp } : null;
      const status = {
        isMonitoring: recentData.length > 0,
        lastDataPoint,
        lastDataPointTimestamp: latest?.timestamp || null,
        activeAlerts: recentAlerts.filter(a => !a.acknowledged && a.severity !== 'low'),
        riskLevel: this.calculateOverallRiskLevel(recentAlerts),
        metrics: this.extractCurrentMetrics(recentData)
      };
      return { success: true, status, lastDataPoint };
    } catch (error) {
      console.error('❌ Error getting monitoring status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取最近的数据点（支持按时间窗口与设备类型过滤）
   * @param {string} userEmail 用户邮箱
   * @param {number} limitCount 最多返回条数
   * @param {Object} options 可选。{ timeRange: '1h'|'6h'|'24h', deviceType: string }
   * @returns {Promise<Array>} 按时间正序的数据点数组
   */
  async getRecentDataPoints(userEmail, limitCount = 100, options = {}) {
    try {
      const cappedLimit = Math.min(Math.max(1, Number(limitCount) || 100), MAX_RECENT_DATA_POINTS_LIMIT);
      const { timeRange, deviceType } = options;
      return await wearableStreamDataRepo.getRecentByUser(userEmail, {
        limit: cappedLimit,
        timeRange: timeRange && TIME_RANGE_MS[timeRange] ? timeRange : undefined,
        deviceType: deviceType && typeof deviceType === 'string' ? deviceType : undefined
      });
    } catch (error) {
      console.error('❌ Error getting recent data points:', error);
      return [];
    }
  }

  /**
   * 获取最近的心率数据
   */
  async getRecentHeartRateData(userEmail, days = 30) {
    try {
      const dataPoints = await this.getRecentDataPoints(userEmail, days * 24); // 假设每小时一个数据点
      
      return dataPoints
        .filter(dp => dp.data?.heartRate || dp.data?.hrv)
        .map(dp => ({
          timestamp: dp.timestamp,
          heartRate: dp.data?.heartRate,
          hrv: dp.data?.hrv,
          restingHeartRate: dp.data?.restingHeartRate
        }));
    } catch (error) {
      console.error('❌ Error getting recent heart rate data:', error);
      return [];
    }
  }

  /**
   * 带超时与有限重试的 analyzeHealthRecords 封装（3.4 模型与降级）
   * @param {Object} healthData 同 aiServiceFactory.analyzeHealthRecords
   * @param {Object} options 同 aiServiceFactory.analyzeHealthRecords
   * @returns {Promise<Object>}
   */
  async analyzeHealthRecordsWithRetry(healthData, options) {
    const timeoutPromise = () => new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AI analysis timeout')), LLM_TIMEOUT_MS);
    });
    let lastError;
    for (let attempt = 0; attempt <= LLM_RETRY_COUNT; attempt++) {
      try {
        const result = await Promise.race([
          aiServiceFactory.analyzeHealthRecords(healthData, options),
          timeoutPromise()
        ]);
        return result;
      } catch (err) {
        lastError = err;
        if (attempt < LLM_RETRY_COUNT) {
          console.warn(`[analyzeHealthRecordsWithRetry] Attempt ${attempt + 1} failed, retrying: ${err.message}`);
        }
      }
    }
    return { success: false, error: lastError?.message || 'AI analysis failed' };
  }

  _ruleOnlyResult(ruleHits, ruleAlerts, allData, sampledDown, sampledTo, timeRange, deviceType, fallbackMessage) {
    return {
      hasAnomaly: true,
      anomalies: ruleHits.map((h) => ({ ...h, type: h.type, severity: h.severity })),
      alerts: ruleAlerts,
      analysis: { hasAnomaly: true, anomalies: ruleHits, trend: { direction: 'stable', rate: 0, significance: 'low' } },
      dataPointCount: allData.length,
      fallbackMessage,
      ...(sampledDown && { sampledDown: true, sampledTo }),
      ...(timeRange && { timeRange }),
      ...(deviceType && { deviceType })
    };
  }

  /**
   * 规则引擎：对明确阈值先做规则检测，命中则生成预警（与 LLM 结果合并去重）
   * @param {Array} dataPoints 数据点，每项含 data、timestamp
   * @returns {{ ruleHits: Array<{type, severity, description, recommendation, fromRule}> }}
   */
  runRuleBasedDetection(dataPoints) {
    const ruleHits = [];
    if (!Array.isArray(dataPoints)) return { ruleHits };
    for (const point of dataPoints) {
      const d = point.data || point;
      const ts = point.timestamp || d.timestamp;
      if (typeof d.glucose === 'number' && d.glucose < RULE_GLUCOSE_HYPOGLYCEMIA) {
        ruleHits.push({
          type: 'hypoglycemia',
          severity: 'high',
          description: `血糖 ${d.glucose} mg/dL 低于 ${RULE_GLUCOSE_HYPOGLYCEMIA}`,
          recommendation: '建议立即补充含糖食物并监测血糖',
          fromRule: true
        });
      }
      const sys = d.bloodPressure && typeof d.bloodPressure.systolic === 'number' ? d.bloodPressure.systolic : null;
      if (sys !== null) {
        if (sys >= RULE_SYSTOLIC_HIGH) {
          ruleHits.push({
            type: 'hypertension',
            severity: 'high',
            description: `收缩压 ${sys} mmHg 达到高危`,
            recommendation: '建议休息、复测，必要时就医',
            fromRule: true
          });
        } else if (sys >= RULE_SYSTOLIC_MEDIUM) {
          ruleHits.push({
            type: 'hypertension',
            severity: 'medium',
            description: `收缩压 ${sys} mmHg 偏高`,
            recommendation: '建议监测血压、低盐饮食',
            fromRule: true
          });
        }
      }
    }
    return { ruleHits };
  }

  /**
   * 构建异常检测提示（含结构化要求、少样本、单位与语言）
   * @param {Array} dataStream 数据点（已采样）
   * @param {string} [userContextText] 来自 formatContextForSystemPrompt 的用户上下文文本
   * @param {string} language 用户语言 'zh' | 'en'
   */
  buildAnomalyDetectionPrompt(dataStream, userContextText = '', language = 'zh') {
    const recentData = dataStream.slice(-20);
    const langNote = language === 'en' ? 'Use English for all descriptions and recommendations.' : '请用中文书写所有描述与建议。';
    const unitsNote = language === 'en'
      ? 'Units: blood glucose mg/dL, blood pressure mmHg, heart rate bpm.'
      : '数值单位：血糖 mg/dL，血压 mmHg，心率 次/分钟。';

    const userContext = userContextText
      ? (language === 'en' ? 'User health context:\n' : '用户健康档案：\n') + userContextText + '\n'
      : '';

    return `As a medical AI assistant, analyze the following wearable device data stream for anomalies.
${userContext}
Data stream (latest 20 points):
${JSON.stringify(recentData, null, 2)}

${unitsNote}
${langNote}

Important: Output only a single JSON object. Do not wrap in markdown code blocks or add any text outside the JSON.

Required JSON schema (use exactly these field names and allowed values):
- hasAnomaly: boolean
- anomalies: array of { type, severity, description, recommendation } where
  type is one of: hypoglycemia, cardiacFatigue, arrhythmia, hypertension, sleepDisorder, activityAnomaly
  severity is one of: low, medium, high, critical
- trend: { direction: "stable"|"rising"|"declining", rate: number, significance: "low"|"medium"|"high" }

Examples:
Example 1 (no anomaly): {"hasAnomaly":false,"anomalies":[],"trend":{"direction":"stable","rate":0,"significance":"low"}}
Example 2 (with anomaly): {"hasAnomaly":true,"anomalies":[{"type":"hypoglycemia","severity":"high","description":"...","recommendation":"..."}],"trend":{"direction":"declining","rate":-2,"significance":"high"}}

Output your single JSON object now:`;
  }

  /**
   * 构建低血糖预测提示（仅输出 JSON、单位 mg/dL、语言一致）
   * @param {Array} glucoseData 血糖数据
   * @param {string} [userContextText] 来自 formatContextForSystemPrompt 的用户上下文
   */
  buildHypoglycemiaPredictionPrompt(glucoseData, userContextText = '', language = 'zh') {
    const userContext = userContextText
      ? (language === 'en' ? 'User context:\n' : '用户档案（注意降糖药）：\n') + userContextText + '\n'
      : '';
    const langNote = language === 'en' ? 'Use English for recommendation.' : '建议请用中文。';
    return `Based on the following blood glucose time series (units: mg/dL), predict hypoglycemia risk in the next 15-30 minutes.
${userContext}
Glucose data:
${JSON.stringify(glucoseData, null, 2)}

Output only a single JSON object. No markdown, no extra text.
Schema: predictedGlucose (number, mg/dL), riskLevel ("low"|"medium"|"high"), timeWindow (string, e.g. "15-30分钟"), confidence (number 0-1), recommendation (string).
${langNote}
Example: {"predictedGlucose":85,"riskLevel":"low","timeWindow":"15-30分钟","confidence":0.8,"recommendation":"..."}
Output your JSON now:`;
  }

  /**
   * 构建 HRV 分析提示（仅输出 JSON、语言一致）
   * @param {Array} heartRateData 心率/HRV 数据
   * @param {string} [userContextText] 来自 formatContextForSystemPrompt 的用户上下文
   */
  buildHRVAnalysisPrompt(heartRateData, userContextText = '', language = 'zh') {
    const userContext = userContextText
      ? (language === 'en' ? 'User health context:\n' : '用户健康档案：\n') + userContextText + '\n'
      : '';
    const langNote = language === 'en' ? 'Use English for recommendation and risk factors.' : '建议与风险因素请用中文。';
    return `Analyze the following heart rate / HRV data for cardiac fatigue and trend.
${userContext}
Heart rate / HRV data:
${JSON.stringify(heartRateData, null, 2)}

Output only a single JSON object. No markdown, no extra text.
Schema: trend ("stable"|"declining"|"improving"), declineRate (number), severity ("low"|"medium"|"high"), riskFactors (array of strings), recommendation (string).
${langNote}
Example: {"trend":"stable","declineRate":0,"severity":"low","riskFactors":[],"recommendation":"..."}
Output your JSON now:`;
  }

  /**
   * 解析异常检测结果（多段 JSON 鲁棒提取、白名单与默认值、置信度过滤）
   */
  parseAnomalyAnalysis(aiAnalysis) {
    try {
      const parsed = extractFirstValidJson(aiAnalysis, 'parseAnomalyAnalysis');
      if (!parsed) {
        return {
          hasAnomaly: false,
          anomalies: [],
          trend: { direction: 'stable', rate: 0, significance: 'low' }
        };
      }

      const validTypes = ['hypoglycemia', 'cardiacFatigue', 'arrhythmia', 'hypertension', 'sleepDisorder', 'activityAnomaly'];
      const typeMapping = {
        low_glucose: 'hypoglycemia',
        heart_fatigue: 'cardiacFatigue',
        irregular_heartbeat: 'arrhythmia',
        high_blood_pressure: 'hypertension',
        sleep_abnormal: 'sleepDisorder',
        activity_abnormal: 'activityAnomaly'
      };
      const validSeverities = ['low', 'medium', 'high', 'critical'];

      if (parsed.anomalies && Array.isArray(parsed.anomalies)) {
        parsed.anomalies = parsed.anomalies.map((anomaly) => {
          const rawType = anomaly.type;
          if (!validTypes.includes(anomaly.type)) {
            anomaly.type = typeMapping[anomaly.type] || 'activityAnomaly';
            if (anomaly.type === 'activityAnomaly' && rawType) {
              console.warn(`[parseAnomalyAnalysis] Unknown anomaly type "${rawType}" mapped to activityAnomaly`);
            }
          }
          if (!validSeverities.includes(anomaly.severity)) {
            anomaly.severity = 'low';
          }
          anomaly.description = anomaly.description ?? '';
          anomaly.recommendation = anomaly.recommendation ?? '';
          const conf = anomaly.confidence != null ? Number(anomaly.confidence) : 1;
          if (conf < ANOMALY_CONFIDENCE_THRESHOLD) {
            anomaly._skipAlert = true;
          }
          return anomaly;
        });
      }

      parsed.hasAnomaly = parsed.hasAnomaly === true || (parsed.anomalies && parsed.anomalies.length > 0);
      parsed.trend = parsed.trend && typeof parsed.trend === 'object'
        ? {
            direction: ['stable', 'rising', 'declining'].includes(parsed.trend.direction) ? parsed.trend.direction : 'stable',
            rate: Number(parsed.trend.rate) || 0,
            significance: ['low', 'medium', 'high'].includes(parsed.trend.significance) ? parsed.trend.significance : 'low'
          }
        : { direction: 'stable', rate: 0, significance: 'low' };

      return parsed;
    } catch (error) {
      console.error('❌ Error parsing anomaly analysis:', error);
      return {
        hasAnomaly: false,
        anomalies: [],
        trend: { direction: 'stable', rate: 0, significance: 'low' }
      };
    }
  }

  /**
   * 解析低血糖预测结果（鲁棒提取 + 默认值）
   */
  parseHypoglycemiaPrediction(aiAnalysis) {
    try {
      const parsed = extractFirstValidJson(aiAnalysis, 'parseHypoglycemiaPrediction');
      if (!parsed) {
        return {
          predictedGlucose: 90,
          riskLevel: 'low',
          timeWindow: '15-30分钟',
          confidence: 0.7,
          recommendation: '继续监测血糖水平'
        };
      }
      return {
        predictedGlucose: Number(parsed.predictedGlucose) || 90,
        riskLevel: ['low', 'medium', 'high'].includes(parsed.riskLevel) ? parsed.riskLevel : 'low',
        timeWindow: parsed.timeWindow || '15-30分钟',
        confidence: Number(parsed.confidence) >= 0 && Number(parsed.confidence) <= 1 ? Number(parsed.confidence) : 0.7,
        recommendation: parsed.recommendation || '继续监测血糖水平'
      };
    } catch (error) {
      console.error('❌ Error parsing hypoglycemia prediction:', error);
      return {
        predictedGlucose: 90,
        riskLevel: 'low',
        timeWindow: '15-30分钟',
        confidence: 0.7,
        recommendation: '继续监测血糖水平'
      };
    }
  }

  /**
   * 解析 HRV 分析结果（鲁棒提取 + 默认值）
   */
  parseHRVAnalysis(aiAnalysis) {
    try {
      const parsed = extractFirstValidJson(aiAnalysis, 'parseHRVAnalysis');
      if (!parsed) {
        return {
          trend: 'stable',
          declineRate: 0,
          severity: 'low',
          riskFactors: [],
          recommendation: '保持当前活动水平'
        };
      }
      return {
        trend: ['stable', 'declining', 'improving'].includes(parsed.trend) ? parsed.trend : 'stable',
        declineRate: Number(parsed.declineRate) || 0,
        severity: ['low', 'medium', 'high'].includes(parsed.severity) ? parsed.severity : 'low',
        riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors : [],
        recommendation: parsed.recommendation || '保持当前活动水平'
      };
    } catch (error) {
      console.error('❌ Error parsing HRV analysis:', error);
      return {
        trend: 'stable',
        declineRate: 0,
        severity: 'low',
        riskFactors: [],
        recommendation: '保持当前活动水平'
      };
    }
  }

  /**
   * 获取预警动作
   */
  getAlertAction(alertType, severity) {
    const actions = {
      hypoglycemia: {
        low: '监测血糖，准备零食',
        medium: '立即进食，监测血糖',
        high: '立即进食含糖食物，如15分钟后仍低，寻求医疗帮助',
        critical: '紧急医疗救助，立即联系医生'
      },
      cardiacFatigue: {
        low: '建议适当休息',
        medium: '建议减少活动，增加休息时间',
        high: '建议暂停高强度活动，充分休息',
        critical: '建议立即就医检查'
      },
      arrhythmia: {
        low: '继续监测',
        medium: '建议咨询医生',
        high: '建议立即就医',
        critical: '紧急医疗救助'
      },
      hypertension: {
        low: '继续监测血压',
        medium: '监测血压，考虑咨询医生',
        high: '建议立即咨询医生，可能需要调整用药',
        critical: '紧急医疗救助，立即联系医生'
      },
      sleepDisorder: {
        low: '关注睡眠模式，保持规律作息',
        medium: '建议调整作息时间，如持续异常建议咨询医生',
        high: '建议咨询医生，评估睡眠质量',
        critical: '建议立即就医，评估睡眠障碍'
      },
      activityAnomaly: {
        low: '关注活动模式变化',
        medium: '建议恢复正常活动水平',
        high: '建议咨询医生，评估活动异常原因',
        critical: '建议立即就医，评估活动异常'
      }
    };
    
    return actions[alertType]?.[severity] || '继续监测';
  }

  /**
   * 获取预警标题
   */
  getAlertTitle(alertType, severity) {
    const titles = {
      hypoglycemia: '低血糖预警',
      cardiacFatigue: '心脏疲劳预警',
      arrhythmia: '心律失常预警',
      hypertension: '高血压预警',
      sleepDisorder: '睡眠异常预警',
      activityAnomaly: '活动异常预警'
    };
    
    const severityText = {
      low: '低',
      medium: '中',
      high: '高',
      critical: '紧急'
    };
    
    return `${titles[alertType] || '健康预警'} - ${severityText[severity] || '未知'}风险`;
  }

  /**
   * 获取预警消息
   */
  getAlertMessage(alert) {
    const { alertType, severity, details } = alert;
    
    if (alertType === 'hypoglycemia') {
      return `预测血糖可能降至 ${details.predictedGlucose || '低'} mg/dL，建议${details.timeWindow || '15-30分钟'}内进食。`;
    } else if (alertType === 'cardiacFatigue') {
      return `检测到心率变异性持续下降，建议${details.recommendation || '适当休息'}。`;
    } else if (alertType === 'arrhythmia') {
      return `检测到心律失常，建议${details.recommendation || '咨询医生'}。`;
    } else if (alertType === 'hypertension') {
      return `检测到血压持续升高，建议${details.recommendation || '监测血压，咨询医生'}。`;
    } else if (alertType === 'sleepDisorder') {
      return `检测到睡眠模式异常，建议${details.recommendation || '调整作息，咨询医生'}。`;
    } else if (alertType === 'activityAnomaly') {
      return `检测到活动量异常变化，建议${details.recommendation || '关注活动模式'}。`;
    }
    
    return '检测到健康异常，请关注。';
  }

  /**
   * 计算整体风险等级
   */
  calculateOverallRiskLevel(alerts) {
    if (alerts.length === 0) return 'low';
    
    const hasCritical = alerts.some(a => a.severity === 'critical');
    const hasHigh = alerts.some(a => a.severity === 'high');
    const hasMedium = alerts.some(a => a.severity === 'medium');
    
    if (hasCritical) return 'critical';
    if (hasHigh) return 'high';
    if (hasMedium) return 'medium';
    return 'low';
  }

  /**
   * 提取当前指标
   */
  extractCurrentMetrics(dataPoints) {
    if (dataPoints.length === 0) return {};
    
    const latest = dataPoints[dataPoints.length - 1];
    return {
      heartRate: latest.data?.heartRate || null,
      bloodPressure: latest.data?.bloodPressure || null,  // 添加血压字段
      glucose: latest.data?.glucose || null,
      hrv: latest.data?.hrv || null,
      steps: latest.data?.steps || null,
      timestamp: latest.timestamp
    };
  }
}

module.exports = new RiskMonitoringService();
