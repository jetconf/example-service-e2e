import { Link, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  UserOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';

const SIDEBAR_WIDTH = 220;

const navItems = [
  { key: '/', label: 'Дашборд', icon: <DashboardOutlined />, public: true },
  { key: '/profile', label: 'Профиль', icon: <UserOutlined />, public: false },
  { key: '/catalog', label: 'Каталог', icon: <AppstoreOutlined />, public: false },
  { key: '/drafts', label: 'Черновики', icon: <FileTextOutlined />, public: false },
  { key: '/roles', label: 'Роли', icon: <SafetyCertificateOutlined />, public: false },
];

export function AppSidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const visibleItems = navItems.filter(item => item.public || user);

  return (
    <aside
      style={{
        width: SIDEBAR_WIDTH,
        minWidth: SIDEBAR_WIDTH,
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        background: '#ECEAE3',
        borderRight: '1px solid #DEDAD1',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        overflowY: 'auto',
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 20px',
          borderBottom: '1px solid #DEDAD1',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: '#5F7B8E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 14,
          }}
        >
          <SettingOutlined />
        </div>
        <span style={{ fontWeight: 600, fontSize: 14, color: '#2A2A2A', letterSpacing: '-0.2px' }}>
          JetConf
        </span>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '12px 10px', flex: 1 }}>
        {visibleItems.map(item => {
          const isActive = item.key === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.key);
          return (
            <Link key={item.key} to={item.key} style={{ textDecoration: 'none', display: 'block' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  borderRadius: 8,
                  marginBottom: 2,
                  cursor: 'pointer',
                  background: isActive ? '#5F7B8E' : 'transparent',
                  color: isActive ? '#fff' : '#3A3A38',
                  fontWeight: isActive ? 500 : 400,
                  fontSize: 14,
                  transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLDivElement).style.background = '#E0DDD5';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                  }
                }}
              >
                <span style={{ fontSize: 15, opacity: isActive ? 1 : 0.7 }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid #DEDAD1',
          fontSize: 11,
          color: '#9E9890',
        }}
      >
        v0.1.0 · corp.internal
      </div>
    </aside>
  );
}
