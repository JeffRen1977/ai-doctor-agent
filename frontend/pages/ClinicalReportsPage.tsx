import React, { useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Typography,
  Space,
  Tag,
  Table,
  Alert,
  Statistic,
  Divider,
  Select,
  DatePicker,
  List,
  Avatar,
  Badge,
  Modal,
  Descriptions
} from 'antd';
import { 
  FileTextOutlined, 
  DownloadOutlined,
  ShareAltOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useLanguageStore } from '@/stores/languageStore';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface ClinicalReport {
  id: string;
  period: string;
  generatedDate: string;
  status: 'draft' | 'final' | 'shared';
  summary: {
    totalMetrics: number;
    anomalies: number;
    improvements: number;
    concerns: number;
  };
  keyMetrics: {
    name: string;
    current: number;
    previous: number;
    trend: 'up' | 'down' | 'stable';
    unit: string;
    status: 'normal' | 'warning' | 'critical';
  }[];
  anomalies: {
    metric: string;
    value: number;
    normalRange: string;
    description: string;
    recommendation: string;
  }[];
  doctorNotes?: string;
}

const ClinicalReportsPage: React.FC = () => {
  const { language } = useLanguageStore();
  
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedReport, setSelectedReport] = useState<ClinicalReport | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  // Mock data - 在实际应用中这些数据会从后端API获取
  const [reports] = useState<ClinicalReport[]>([
    {
      id: '1',
      period: language === 'zh' ? '2024年1月' : 'January 2024',
      generatedDate: '2024-01-15',
      status: 'final',
      summary: {
        totalMetrics: 12,
        anomalies: 2,
        improvements: 5,
        concerns: 1
      },
      keyMetrics: [
        {
          name: language === 'zh' ? 'HbA1c' : 'HbA1c',
          current: 6.8,
          previous: 7.2,
          trend: 'down',
          unit: '%',
          status: 'normal'
        },
        {
          name: language === 'zh' ? '收缩压' : 'Systolic BP',
          current: 128,
          previous: 135,
          trend: 'down',
          unit: 'mmHg',
          status: 'normal'
        },
        {
          name: language === 'zh' ? 'LDL-C' : 'LDL-C',
          current: 3.2,
          previous: 3.5,
          trend: 'down',
          unit: 'mmol/L',
          status: 'warning'
        },
        {
          name: language === 'zh' ? '体重' : 'Weight',
          current: 72,
          previous: 75,
          trend: 'down',
          unit: 'kg',
          status: 'normal'
        }
      ],
      anomalies: [
        {
          metric: language === 'zh' ? '静息心率' : 'Resting Heart Rate',
          value: 95,
          normalRange: '60-100 bpm',
          description: language === 'zh' 
            ? '静息心率持续偏高，可能与压力或睡眠质量有关' 
            : 'Resting heart rate consistently elevated, possibly related to stress or sleep quality',
          recommendation: language === 'zh' 
            ? '建议增加有氧运动，改善睡眠质量，必要时咨询心血管科医生' 
            : 'Recommend increasing aerobic exercise, improving sleep quality, and consulting a cardiologist if necessary'
        }
      ],
      doctorNotes: language === 'zh' 
        ? '患者整体健康状况良好，血糖控制有明显改善。建议继续保持当前治疗方案，并关注静息心率的变化。' 
        : 'Patient\'s overall health is good, with significant improvement in blood glucose control. Recommend maintaining current treatment plan and monitoring resting heart rate changes.'
    },
    {
      id: '2',
      period: language === 'zh' ? '2023年12月' : 'December 2023',
      generatedDate: '2023-12-15',
      status: 'shared',
      summary: {
        totalMetrics: 12,
        anomalies: 3,
        improvements: 4,
        concerns: 2
      },
      keyMetrics: [
        {
          name: language === 'zh' ? 'HbA1c' : 'HbA1c',
          current: 7.2,
          previous: 7.5,
          trend: 'down',
          unit: '%',
          status: 'warning'
        },
        {
          name: language === 'zh' ? '收缩压' : 'Systolic BP',
          current: 135,
          previous: 140,
          trend: 'down',
          unit: 'mmHg',
          status: 'warning'
        }
      ],
      anomalies: []
    }
  ]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUpOutlined style={{ color: '#52c41a' }} />;
      case 'down': return <ArrowDownOutlined style={{ color: '#1890ff' }} />;
      default: return <MinusOutlined style={{ color: '#999' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getReportStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'final': return 'processing';
      case 'shared': return 'success';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: language === 'zh' ? '报告周期' : 'Period',
      dataIndex: 'period',
      key: 'period',
      render: (text: string) => (
        <Space>
          <FileTextOutlined />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: language === 'zh' ? '生成日期' : 'Generated Date',
      dataIndex: 'generatedDate',
      key: 'generatedDate',
    },
    {
      title: language === 'zh' ? '状态' : 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getReportStatusColor(status)}>
          {status === 'draft' ? (language === 'zh' ? '草稿' : 'Draft') :
           status === 'final' ? (language === 'zh' ? '已完成' : 'Final') :
           (language === 'zh' ? '已分享' : 'Shared')}
        </Tag>
      ),
    },
    {
      title: language === 'zh' ? '关键指标' : 'Key Metrics',
      key: 'metrics',
      render: (_: any, record: ClinicalReport) => (
        <Space>
          <Badge count={record.summary.totalMetrics} showZero color="#1890ff" />
          <Text type="secondary">
            {language === 'zh' ? '异常' : 'Anomalies'}: {record.summary.anomalies}
          </Text>
        </Space>
      ),
    },
    {
      title: language === 'zh' ? '操作' : 'Actions',
      key: 'action',
      render: (_: any, record: ClinicalReport) => (
        <Space>
          <Button 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedReport(record);
              setPreviewVisible(true);
            }}
          >
            {language === 'zh' ? '预览' : 'Preview'}
          </Button>
          <Button size="small" icon={<DownloadOutlined />}>
            {language === 'zh' ? '下载' : 'Download'}
          </Button>
          <Button size="small" icon={<ShareAltOutlined />}>
            {language === 'zh' ? '分享' : 'Share'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>
        <FileTextOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
        {language === 'zh' ? '临床报告' : 'Clinical Reports'}
      </Title>
      
      <Paragraph style={{ marginBottom: '24px', fontSize: '16px', color: '#666' }}>
        {language === 'zh' 
          ? '自动生成月度健康摘要，突出显示异常波动和关键指标趋势，缩短医生面诊时的判读时间。'
          : 'Automatically generate monthly health summaries, highlighting abnormal fluctuations and key metric trends to reduce doctor consultation time.'}
      </Paragraph>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={language === 'zh' ? '总报告数' : 'Total Reports'}
              value={reports.length}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={language === 'zh' ? '已分享' : 'Shared'}
              value={reports.filter(r => r.status === 'shared').length}
              prefix={<ShareAltOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={language === 'zh' ? '异常指标' : 'Anomalies'}
              value={reports.reduce((sum, r) => sum + r.summary.anomalies, 0)}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={language === 'zh' ? '改善指标' : 'Improvements'}
              value={reports.reduce((sum, r) => sum + r.summary.improvements, 0)}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Row gutter={16} justify="space-between" align="middle">
            <Col>
              <Space>
                <Text strong>{language === 'zh' ? '筛选' : 'Filter'}:</Text>
                <Select 
                  value={selectedPeriod} 
                  onChange={setSelectedPeriod}
                  style={{ width: 150 }}
                >
                  <Option value="month">{language === 'zh' ? '本月' : 'This Month'}</Option>
                  <Option value="quarter">{language === 'zh' ? '本季度' : 'This Quarter'}</Option>
                  <Option value="year">{language === 'zh' ? '本年' : 'This Year'}</Option>
                  <Option value="all">{language === 'zh' ? '全部' : 'All'}</Option>
                </Select>
                <RangePicker />
              </Space>
            </Col>
            <Col>
              <Space>
                <Button type="primary" icon={<FileTextOutlined />}>
                  {language === 'zh' ? '生成新报告' : 'Generate New Report'}
                </Button>
                <Button icon={<PrinterOutlined />}>
                  {language === 'zh' ? '批量打印' : 'Batch Print'}
                </Button>
              </Space>
            </Col>
          </Row>

          <Divider />

          <Table
            dataSource={reports}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Space>
      </Card>

      {/* 报告预览模态框 */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            <Text strong>
              {selectedReport ? `${language === 'zh' ? '报告预览' : 'Report Preview'}: ${selectedReport.period}` : ''}
            </Text>
          </Space>
        }
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width={900}
        footer={[
          <Button key="download" icon={<DownloadOutlined />}>
            {language === 'zh' ? '下载PDF' : 'Download PDF'}
          </Button>,
          <Button key="share" type="primary" icon={<ShareAltOutlined />}>
            {language === 'zh' ? '分享给医生' : 'Share with Doctor'}
          </Button>,
          <Button key="print" icon={<PrinterOutlined />}>
            {language === 'zh' ? '打印' : 'Print'}
          </Button>
        ]}
      >
        {selectedReport && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Descriptions bordered column={2}>
              <Descriptions.Item label={language === 'zh' ? '报告周期' : 'Period'} span={2}>
                {selectedReport.period}
              </Descriptions.Item>
              <Descriptions.Item label={language === 'zh' ? '生成日期' : 'Generated Date'}>
                {selectedReport.generatedDate}
              </Descriptions.Item>
              <Descriptions.Item label={language === 'zh' ? '状态' : 'Status'}>
                <Tag color={getReportStatusColor(selectedReport.status)}>
                  {selectedReport.status === 'draft' ? (language === 'zh' ? '草稿' : 'Draft') :
                   selectedReport.status === 'final' ? (language === 'zh' ? '已完成' : 'Final') :
                   (language === 'zh' ? '已分享' : 'Shared')}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Divider>{language === 'zh' ? '报告摘要' : 'Report Summary'}</Divider>

            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title={language === 'zh' ? '总指标数' : 'Total Metrics'}
                  value={selectedReport.summary.totalMetrics}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title={language === 'zh' ? '异常指标' : 'Anomalies'}
                  value={selectedReport.summary.anomalies}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title={language === 'zh' ? '改善指标' : 'Improvements'}
                  value={selectedReport.summary.improvements}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title={language === 'zh' ? '关注指标' : 'Concerns'}
                  value={selectedReport.summary.concerns}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Col>
            </Row>

            <Divider>{language === 'zh' ? '关键指标趋势' : 'Key Metrics Trends'}</Divider>

            <List
              dataSource={selectedReport.keyMetrics}
              renderItem={(metric) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        icon={getTrendIcon(metric.trend)} 
                        style={{ backgroundColor: metric.status === 'normal' ? '#52c41a' : 
                                 metric.status === 'warning' ? '#faad14' : '#ff4d4f' }}
                      />
                    }
                    title={
                      <Space>
                        <Text strong>{metric.name}</Text>
                        <Tag color={getStatusColor(metric.status)}>
                          {metric.status === 'normal' ? (language === 'zh' ? '正常' : 'Normal') :
                           metric.status === 'warning' ? (language === 'zh' ? '警告' : 'Warning') :
                           (language === 'zh' ? '严重' : 'Critical')}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Space>
                        <Text>
                          {language === 'zh' ? '当前' : 'Current'}: {metric.current} {metric.unit}
                        </Text>
                        <Text type="secondary">
                          {language === 'zh' ? '上次' : 'Previous'}: {metric.previous} {metric.unit}
                        </Text>
                        <Text type="success">
                          {metric.trend === 'down' ? (language === 'zh' ? '↓ 改善' : '↓ Improved') :
                           metric.trend === 'up' ? (language === 'zh' ? '↑ 上升' : '↑ Increased') :
                           (language === 'zh' ? '→ 稳定' : '→ Stable')}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />

            {selectedReport.anomalies.length > 0 && (
              <>
                <Divider>{language === 'zh' ? '异常指标详情' : 'Anomaly Details'}</Divider>
                <List
                  dataSource={selectedReport.anomalies}
                  renderItem={(anomaly) => (
                    <List.Item>
                      <Alert
                        message={anomaly.metric}
                        description={
                          <Space direction="vertical" size="small">
                            <Text>
                              {language === 'zh' ? '当前值' : 'Current Value'}: {anomaly.value} | 
                              {language === 'zh' ? ' 正常范围' : ' Normal Range'}: {anomaly.normalRange}
                            </Text>
                            <Text>{anomaly.description}</Text>
                            <Text strong type="warning">{anomaly.recommendation}</Text>
                          </Space>
                        }
                        type="warning"
                        showIcon
                        style={{ width: '100%' }}
                      />
                    </List.Item>
                  )}
                />
              </>
            )}

            {selectedReport.doctorNotes && (
              <>
                <Divider>{language === 'zh' ? '医生备注' : 'Doctor Notes'}</Divider>
                <Alert
                  message={selectedReport.doctorNotes}
                  type="info"
                  showIcon
                />
              </>
            )}
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default ClinicalReportsPage;
