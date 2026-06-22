import { useState } from 'react';
import { Form, Input, Button, Alert, Typography } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already logged in → send to dashboard
  if (!authLoading && user) return <Navigate to="/" replace />;

  const onFinish = async (values: { login: string; password: string }) => {
    setSubmitting(true);
    setError(null);
    const result = await login(values.login, values.password);
    setSubmitting(false);
    if (result.ok) {
      navigate('/');
    } else {
      setError(result.error ?? 'Ошибка входа');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F5F3EE',
      }}
    >
      <div
        style={{
          width: 380,
          background: '#FFFFFF',
          borderRadius: 14,
          border: '1px solid #DEDAD1',
          padding: '40px 36px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 11,
              background: '#5F7B8E',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: 20, color: '#fff' }}>⚙</span>
          </div>
          <Typography.Title level={4} style={{ margin: 0, color: '#1A1A1A', fontWeight: 600 }}>
            JetConf
          </Typography.Title>
          <div style={{ color: '#9E9890', fontSize: 13, marginTop: 4 }}>
            Войдите в свою учётную запись
          </div>
        </div>

        {error && (
          <Alert
            type="error"
            message={error}
            showIcon
            style={{ marginBottom: 20, borderRadius: 8 }}
          />
        )}

        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="login" rules={[{ required: true, message: 'Введите логин' }]}>
            <Input
              prefix={<UserOutlined style={{ color: '#AAA49E' }} />}
              placeholder="Логин"
              size="large"
              style={{ borderRadius: 8, fontSize: 14 }}
            />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Введите пароль' }]}>
            <Input.Password
              prefix={<LockOutlined style={{ color: '#AAA49E' }} />}
              placeholder="Пароль"
              size="large"
              style={{ borderRadius: 8, fontSize: 14 }}
            />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={submitting}
            icon={<LoginOutlined />}
            style={{
              background: '#5F7B8E',
              borderColor: '#5F7B8E',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              height: 44,
            }}
          >
            Войти
          </Button>
        </Form>

        <div style={{ marginTop: 20, padding: '12px 16px', background: '#F5F3EE', borderRadius: 8, fontSize: 12, color: '#7B7670' }}>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>Тестовый доступ:</div>
          <div><code style={{ background: '#EAE8E2', padding: '1px 5px', borderRadius: 4 }}>ivan.petrov</code> / <code style={{ background: '#EAE8E2', padding: '1px 5px', borderRadius: 4 }}>Petrov123</code></div>
          {/*<div style={{ marginTop: 4 }}>*/}
          {/*  Полный список: <a href="/users.txt" target="_blank" style={{ color: '#5F7B8E' }}>/users.txt</a>*/}
          {/*</div>*/}
        </div>
      </div>
    </div>
  );
}
