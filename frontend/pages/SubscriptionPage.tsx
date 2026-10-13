import React, { useState, useEffect } from 'react';
import { Card, Button, message, Row, Col, Typography, Tag, Space, Divider, Table, Badge } from 'antd';
import { CrownOutlined, WechatOutlined, AlipayCircleOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useLanguageStore } from '../stores/languageStore';
import api from '../services/api';

const { Title, Text, Paragraph } = Typography;

interface Plan {
  id: string;
  nameZh: string;
  nameEn: string;
  amount: number;
  durationDays: number;
}

interface Subscription {
  active: boolean;
  plan: Plan | null;
  startDate?: string;
  endDate?: string;
}

interface Order {
  orderNo: string;
  planId: string;
  amount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  paidAt?: string;
}

const SubscriptionPage: React.FC = () => {
  const { language } = useLanguageStore();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription>({ active: false, plan: null });
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, subRes, ordersRes] = await Promise.all([
        api.get('/payment/plans'),
        api.get('/payment/subscription'),
        api.get('/payment/orders')
      ]);
      if (plansRes.data.success) setPlans(plansRes.data.plans);
      if (subRes.data.success) setSubscription(subRes.data);
      if (ordersRes.data.success) setOrders(ordersRes.data.orders || []);
    } catch (error) {
      console.error('Failed to load subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handlePay = async (planId: string, paymentMethod: 'wechat_pay' | 'alipay') => {
    try {
      setPaying(`${planId}-${paymentMethod}`);
      const res = await api.post('/payment/orders', { planId, paymentMethod });
      if (res.data.success) {
        if (paymentMethod === 'alipay' && res.data.payData?.payUrl) {
          window.open(res.data.payData.payUrl, '_blank');
        } else {
          message.info(language === 'zh'
            ? '请在微信中完成支付（JSAPI 需在微信内打开）'
            : 'Please complete payment in WeChat');
        }
        fetchData();
      } else {
        message.error(res.data.error || (language === 'zh' ? '创建订单失败' : 'Failed to create order'));
      }
    } catch (error) {
      message.error(language === 'zh' ? '支付请求失败' : 'Payment request failed');
    } finally {
      setPaying('');
    }
  };

  const formatAmount = (fen: number) => `¥${(fen / 100).toFixed(2)}`;

  const statusTag = (status: string) => {
    const map: Record<string, { color: string; label: string }> = {
      pending: { color: 'orange', label: language === 'zh' ? '待支付' : 'Pending' },
      paid: { color: 'green', label: language === 'zh' ? '已支付' : 'Paid' },
      failed: { color: 'red', label: language === 'zh' ? '失败' : 'Failed' },
      expired: { color: 'default', label: language === 'zh' ? '已过期' : 'Expired' }
    };
    const m = map[status] || { color: 'default', label: status };
    return <Tag color={m.color}>{m.label}</Tag>;
  };

  const columns = [
    {
      title: language === 'zh' ? '订单号' : 'Order No',
      dataIndex: 'orderNo',
      key: 'orderNo',
      ellipsis: true,
      width: 180
    },
    {
      title: language === 'zh' ? '套餐' : 'Plan',
      dataIndex: 'planId',
      key: 'planId',
      render: (planId: string) => {
        const p = plans.find(p => p.id === planId);
        return p ? (language === 'zh' ? p.nameZh : p.nameEn) : planId;
      }
    },
    {
      title: language === 'zh' ? '金额' : 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: formatAmount
    },
    {
      title: language === 'zh' ? '支付方式' : 'Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (m: string) => m === 'wechat_pay'
        ? <Space><WechatOutlined style={{ color: '#07C160' }} />{language === 'zh' ? '微信' : 'WeChat'}</Space>
        : <Space><AlipayCircleOutlined style={{ color: '#1677FF' }} />{language === 'zh' ? '支付宝' : 'Alipay'}</Space>
    },
    {
      title: language === 'zh' ? '状态' : 'Status',
      dataIndex: 'status',
      key: 'status',
      render: statusTag
    },
    {
      title: language === 'zh' ? '时间' : 'Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (t: string) => t ? new Date(t).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US') : '-'
    }
  ];

  const planColors = ['#f0f5ff', '#f6ffed', '#fff7e6'];
  const planBorders = ['#1677FF', '#52c41a', '#fa8c16'];
  const planHighlight = [false, false, true];

  if (loading) {
    return (
      <div className="app-page-shell" style={{ textAlign: 'center', paddingTop: 60 }}>
        <Text>{language === 'zh' ? '加载中...' : 'Loading...'}</Text>
      </div>
    );
  }

  return (
    <div className="app-page-shell" style={{ maxWidth: 960 }}>
      <Card className="app-surface-card">
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CrownOutlined style={{ color: '#faad14' }} />
            {language === 'zh' ? '会员订阅' : 'Subscription'}
          </Title>
          <Text type="secondary">
            {language === 'zh' ? '解锁全部 AI 健康管理功能' : 'Unlock all AI health management features'}
          </Text>
        </div>

        {subscription.active && subscription.plan && (
          <Card size="small" style={{ marginBottom: 24, borderColor: '#52c41a' }}>
            <Space>
              <Badge status="success" />
              <Text strong>
                {language === 'zh' ? '当前套餐：' : 'Current plan: '}
                {language === 'zh' ? subscription.plan.nameZh : subscription.plan.nameEn}
              </Text>
              <Text type="secondary">
                {language === 'zh' ? '到期时间：' : 'Expires: '}
                {subscription.endDate ? new Date(subscription.endDate).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US') : '-'}
              </Text>
            </Space>
          </Card>
        )}

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {plans.map((plan, idx) => (
            <Col xs={24} sm={8} key={plan.id}>
              <Card
                size="small"
                hoverable
                style={{
                  background: planColors[idx],
                  borderColor: planBorders[idx],
                  borderWidth: planHighlight[idx] ? 2 : 1,
                  textAlign: 'center',
                  height: '100%'
                }}
              >
                {planHighlight[idx] && (
                  <Tag color="orange" style={{ position: 'absolute', top: -10, right: 8 }}>
                    {language === 'zh' ? '最划算' : 'Best Value'}
                  </Tag>
                )}
                <Title level={4} style={{ marginTop: 8 }}>
                  {language === 'zh' ? plan.nameZh : plan.nameEn}
                </Title>
                <Title level={2} style={{ margin: '8px 0', color: planBorders[idx] }}>
                  {formatAmount(plan.amount)}
                </Title>
                <Text type="secondary">
                  {plan.durationDays} {language === 'zh' ? '天' : 'days'}
                </Text>
                <Divider style={{ margin: '12px 0' }} />

                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    icon={<WechatOutlined />}
                    block
                    loading={paying === `${plan.id}-wechat_pay`}
                    onClick={() => handlePay(plan.id, 'wechat_pay')}
                    style={{ backgroundColor: '#07C160', borderColor: '#07C160' }}
                  >
                    {language === 'zh' ? '微信支付' : 'WeChat Pay'}
                  </Button>
                  <Button
                    icon={<AlipayCircleOutlined />}
                    block
                    loading={paying === `${plan.id}-alipay`}
                    onClick={() => handlePay(plan.id, 'alipay')}
                    style={{ color: '#1677FF', borderColor: '#1677FF' }}
                  >
                    {language === 'zh' ? '支付宝' : 'Alipay'}
                  </Button>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>

        <Card size="small" title={language === 'zh' ? '会员权益' : 'Member Benefits'} style={{ marginBottom: 24 }}>
          <Row gutter={[16, 8]}>
            {[
              { zh: '无限 AI 健康对话', en: 'Unlimited AI health chat' },
              { zh: '每日健康报告', en: 'Daily health reports' },
              { zh: '智能用药提醒', en: 'Smart medication reminders' },
              { zh: '数字孪生分析', en: 'Digital twin analysis' },
              { zh: '风险预警监测', en: 'Risk alert monitoring' },
              { zh: '临床报告生成', en: 'Clinical report generation' }
            ].map((b, i) => (
              <Col xs={24} sm={12} key={i}>
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <Text>{language === 'zh' ? b.zh : b.en}</Text>
                </Space>
              </Col>
            ))}
          </Row>
        </Card>

        {orders.length > 0 && (
          <Card size="small" title={language === 'zh' ? '订单记录' : 'Order History'}>
            <Table
              dataSource={orders}
              columns={columns}
              rowKey="orderNo"
              size="small"
              pagination={{ pageSize: 5 }}
              scroll={{ x: 700 }}
            />
          </Card>
        )}
      </Card>
    </div>
  );
};

export default SubscriptionPage;
