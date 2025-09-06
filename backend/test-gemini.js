require('dotenv').config();
const geminiService = require('./src/services/geminiService');

async function testGeminiService() {
  console.log('🧪 开始测试Gemini AI服务...\n');
  
  // 测试1: 健康咨询对话
  console.log('📝 测试1: 健康咨询对话');
  try {
    const healthChatResult = await geminiService.healthChat('我最近经常感到疲劳，睡眠质量也不好，这是什么原因？');
    if (healthChatResult.success) {
      console.log('✅ 健康咨询测试成功');
      console.log('回复长度:', healthChatResult.message.length, '字符');
      console.log('回复预览:', healthChatResult.message.substring(0, 100) + '...\n');
    } else {
      console.log('❌ 健康咨询测试失败:', healthChatResult.error);
    }
  } catch (error) {
    console.log('❌ 健康咨询测试异常:', error.message);
  }

  // 测试2: 饮食分析
  console.log('🍎 测试2: 饮食分析');
  try {
    const dietResult = await geminiService.analyzeDiet(
      ['苹果', '香蕉', '白米饭', '鸡胸肉', '西兰花'],
      { age: 30, weight: 70, height: 175, diabetes: false }
    );
    if (dietResult.success) {
      console.log('✅ 饮食分析测试成功');
      console.log('分析长度:', dietResult.analysis.length, '字符');
      console.log('分析预览:', dietResult.analysis.substring(0, 100) + '...\n');
    } else {
      console.log('❌ 饮食分析测试失败:', dietResult.error);
    }
  } catch (error) {
    console.log('❌ 饮食分析测试异常:', error.message);
  }

  // 测试3: 症状分析
  console.log('🩺 测试3: 症状分析');
  try {
    const symptomsResult = await geminiService.analyzeSymptoms(
      '头痛、发热、咳嗽、乏力',
      { age: 25, gender: '男', medicalHistory: ['无重大疾病'] }
    );
    if (symptomsResult.success) {
      console.log('✅ 症状分析测试成功');
      console.log('分析长度:', symptomsResult.analysis.length, '字符');
      console.log('分析预览:', symptomsResult.analysis.substring(0, 100) + '...\n');
    } else {
      console.log('❌ 症状分析测试失败:', symptomsResult.error);
    }
  } catch (error) {
    console.log('❌ 症状分析测试异常:', error.message);
  }

  // 测试4: 健康记录分析
  console.log('📊 测试4: 健康记录分析');
  try {
    const healthRecordsResult = await geminiService.analyzeHealthRecords({
      bloodPressure: { systolic: 120, diastolic: 80 },
      heartRate: 72,
      weight: 70,
      height: 175,
      lastCheckup: '2024-01-15'
    });
    if (healthRecordsResult.success) {
      console.log('✅ 健康记录分析测试成功');
      console.log('分析长度:', healthRecordsResult.analysis.length, '字符');
      console.log('分析预览:', healthRecordsResult.analysis.substring(0, 100) + '...\n');
    } else {
      console.log('❌ 健康记录分析测试失败:', healthRecordsResult.error);
    }
  } catch (error) {
    console.log('❌ 健康记录分析测试异常:', error.message);
  }

  // 测试5: 药物相互作用检查
  console.log('💊 测试5: 药物相互作用检查');
  try {
    const drugResult = await geminiService.checkDrugInteractions([
      '阿司匹林', '布洛芬', '维生素C'
    ]);
    if (drugResult.success) {
      console.log('✅ 药物相互作用检查测试成功');
      console.log('分析长度:', drugResult.analysis.length, '字符');
      console.log('分析预览:', drugResult.analysis.substring(0, 100) + '...\n');
    } else {
      console.log('❌ 药物相互作用检查测试失败:', drugResult.error);
    }
  } catch (error) {
    console.log('❌ 药物相互作用检查测试异常:', error.message);
  }

  console.log('🎉 Gemini AI服务测试完成！');
}

// 运行测试
testGeminiService().catch(console.error);