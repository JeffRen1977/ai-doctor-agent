import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Typography,
  Space
} from 'antd';
import { 
  CalendarOutlined, 
  PlusOutlined
} from '@ant-design/icons';
import { useLanguageStore } from '@/stores/languageStore';
import { getTranslation } from '@/locales';

const { Title, Text } = Typography;

const AppointmentPage: React.FC = () => {
  const { language } = useLanguageStore();
  const t = (key: string) => getTranslation(language, key);
  
  // Add error boundary and logging
  useEffect(() => {
    console.log('🏥 AppointmentPage mounted, language:', language);
    console.log('🏥 Translation test:', t('appointments.title'));
  }, [language]);

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>{t('appointments.title')}</Title>
      
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Text>Welcome to Appointment Management</Text>
                <br />
                <Text type="secondary">Current language: {language}</Text>
              </div>
              
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                size="large"
              >
                {t('appointments.newAppointment')}
              </Button>
              
              <Button 
                icon={<CalendarOutlined />} 
                size="large"
              >
                View Calendar
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AppointmentPage; 