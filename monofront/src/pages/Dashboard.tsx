import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button, Statistic, Card, Row, Col } from 'antd';
import {
  LoginOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { apiGetStats } from '../api/catalog';

function GuestDashboard() {
  const navigate = useNavigate();
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 20 }}>⚙️</div>
      <h2 style={{ color: '#2A2A2A', fontWeight: 600, fontSize: 22, margin: '0 0 8px' }}>
        Управление конфигурациями
      </h2>
      <p style={{ color: '#7B7670', fontSize: 14, maxWidth: 400, marginBottom: 28, lineHeight: 1.6 }}>
        Корпоративная платформа для управления конфигурациями сервисов. Войдите, чтобы получить доступ к каталогу, черновикам и ролям.
      </p>
      <Button
        type="primary"
        size="large"
        icon={<LoginOutlined />}
        onClick={() => navigate('/login')}
        style={{
          background: '#5F7B8E',
          borderColor: '#5F7B8E',
          borderRadius: 8,
          fontWeight: 600,
          height: 44,
          padding: '0 28px',
          fontSize: 14,
        }}
      >
        Войти
      </Button>
    </div>
  );
}

function AuthDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ namespaces: 0, services: 0, activeDrafts: 0 });

  useEffect(() => {
    if (user) apiGetStats(user.id).then(setStats);
  }, [user]);

  const cards = [
    {
      title: 'Каталог',
      description: 'Просмотр и управление конфигурациями сервисов в иерархии неймспейсов и проектов.',
      icon: <AppstoreOutlined style={{ fontSize: 22, color: '#5F7B8E' }} />,
      path: '/catalog',
      bg: '#EEF3F7',
    },
    {
      title: 'Черновики',
      description: 'Список изменений конфигураций, ожидающих подтверждения ответственными.',
      icon: <FileTextOutlined style={{ fontSize: 22, color: '#7A6A3A' }} />,
      path: '/drafts',
      bg: '#F7F3E8',
    },
    {
      title: 'Роли',
      description: 'Ваши права доступа на уровне неймспейсов, проектов и сервисов.',
      icon: <SafetyCertificateOutlined style={{ fontSize: 22, color: '#5A7A5A' }} />,
      path: '/roles',
      bg: '#EEF7EE',
    },
  ];

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: '0 0 4px', color: '#1A1A1A', fontWeight: 600, fontSize: 22 }}>
          Добро пожаловать, {user?.firstName}!
        </h2>
        <div style={{ color: '#7B7670', fontSize: 14 }}>
          {user?.position} · {user?.department}
        </div>
      </div>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 28 }}>
        {[
          { title: 'Неймспейсов', value: stats.namespaces, icon: <AppstoreOutlined /> },
          { title: 'Сервисов', value: stats.services, icon: <ClockCircleOutlined /> },
          { title: 'Активных черновиков', value: stats.activeDrafts, icon: <FileTextOutlined /> },
        ].map(s => (
          <Col key={s.title} xs={24} sm={8}>
            <Card
              style={{
                borderRadius: 10,
                border: '1px solid #DEDAD1',
                background: '#FFFFFF',
              }}
              styles={{ body: { padding: '16px 20px' } }}
            >
              <Statistic
                title={<span style={{ fontSize: 12, color: '#9E9890' }}>{s.title}</span>}
                value={s.value}
                valueStyle={{ color: '#2A2A2A', fontSize: 24, fontWeight: 600 }}
                prefix={<span style={{ color: '#5F7B8E', marginRight: 4, fontSize: 16 }}>{s.icon}</span>}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Quick nav */}
      <Row gutter={16}>
        {cards.map(c => (
          <Col key={c.title} xs={24} sm={8}>
            <Card
              hoverable
              onClick={() => navigate(c.path)}
              style={{
                borderRadius: 10,
                border: '1px solid #DEDAD1',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s',
              }}
              styles={{ body: { padding: '20px' } }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: c.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                {c.icon}
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#1A1A1A', marginBottom: 6 }}>
                {c.title}
              </div>
              <div style={{ fontSize: 12, color: '#7B7670', lineHeight: 1.5 }}>
                {c.description}
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}

export function DashboardPage() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <AuthDashboard /> : <GuestDashboard />;
}
