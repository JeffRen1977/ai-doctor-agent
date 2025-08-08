import React, { useState } from 'react'
import { Card, Table, Button, Space, Tag, Modal, Form, Input, DatePicker, Select, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import './HealthRecordsPage.css'

const { TextArea } = Input
const { Option } = Select

interface HealthRecord {
  id: string
  date: string
  type: string
  description: string
  severity: 'low' | 'medium' | 'high'
  status: 'active' | 'resolved'
}

const HealthRecordsPage: React.FC = () => {
  const [records, setRecords] = useState<HealthRecord[]>([
    {
      id: '1',
      date: '2024-01-15',
      type: '头痛',
      description: '持续性头痛，伴有轻微恶心',
      severity: 'medium',
      status: 'resolved',
    },
    {
      id: '2',
      date: '2024-01-10',
      type: '感冒',
      description: '流鼻涕，咳嗽，轻微发热',
      severity: 'low',
      status: 'resolved',
    },
  ])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null)
  const [form] = Form.useForm()

  const severityColors = {
    low: 'green',
    medium: 'orange',
    high: 'red',
  }

  const severityLabels = {
    low: '轻微',
    medium: '中等',
    high: '严重',
  }

  const statusColors = {
    active: 'red',
    resolved: 'green',
  }

  const statusLabels = {
    active: '进行中',
    resolved: '已解决',
  }

  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '症状类型',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: keyof typeof severityColors) => (
        <Tag color={severityColors[severity]}>{severityLabels[severity]}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: keyof typeof statusColors) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: HealthRecord) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: HealthRecord) => {
    setEditingRecord(record)
    form.setFieldsValue({
      ...record,
      date: dayjs(record.date),
    })
    setModalVisible(true)
  }

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条健康记录吗？',
      onOk: () => {
        setRecords(records.filter(record => record.id !== id))
        message.success('删除成功')
      },
    })
  }

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const recordData = {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
      }

      if (editingRecord) {
        setRecords(records.map(record =>
          record.id === editingRecord.id ? { ...record, ...recordData } : record
        ))
        message.success('更新成功')
      } else {
        const newRecord: HealthRecord = {
          id: Date.now().toString(),
          ...recordData,
        }
        setRecords([...records, newRecord])
        message.success('添加成功')
      }

      setModalVisible(false)
      form.resetFields()
    })
  }

  return (
    <div className="health-records-page">
      <Card
        title="健康记录"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加记录
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>

      <Modal
        title={editingRecord ? '编辑健康记录' : '添加健康记录'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="date"
            label="日期"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="type"
            label="症状类型"
            rules={[{ required: true, message: '请输入症状类型' }]}
          >
            <Input placeholder="例如：头痛、感冒、发烧等" />
          </Form.Item>

          <Form.Item
            name="description"
            label="详细描述"
            rules={[{ required: true, message: '请输入详细描述' }]}
          >
            <TextArea rows={4} placeholder="请详细描述您的症状..." />
          </Form.Item>

          <Form.Item
            name="severity"
            label="严重程度"
            rules={[{ required: true, message: '请选择严重程度' }]}
          >
            <Select placeholder="请选择严重程度">
              <Option value="low">轻微</Option>
              <Option value="medium">中等</Option>
              <Option value="high">严重</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value="active">进行中</Option>
              <Option value="resolved">已解决</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default HealthRecordsPage 