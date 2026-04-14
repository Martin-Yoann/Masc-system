'use client'

import React, { useState } from 'react'
import { Card, Form, Input, Button, Typography } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'

const { Title, Text } = Typography

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true)

    // 模拟登录请求
    setTimeout(() => {
      console.log('Login:', values)
      router.push('/')
    }, 1200)
  }

  return (
    <div style={styles.container}>
      <Card style={styles.card} bordered={false}>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 10 }}>
          Admin Management
        </Title>

        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 30 }}>
          Sign in to your account
        </Text>

        <Form
          layout="vertical"
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: 'Please enter username' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Enter your username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please enter password' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter your password"
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 10 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              Login
            </Button>
          </Form.Item>
        </Form>

        <Text type="secondary" style={{ fontSize: 12 }}>
          © {new Date().getFullYear()} Company Admin System
        </Text>
      </Card>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg,#f0f2f5,#d9e2ec)'
  },
  card: {
    width: 380,
    padding: 20,
    borderRadius: 8,
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
  }
}