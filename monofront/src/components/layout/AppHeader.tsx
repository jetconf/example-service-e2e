import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Breadcrumb, Button, Dropdown, Avatar, message } from 'antd';
import {
  HomeOutlined,
  UserOutlined,
  LogoutOutlined,
  LoginOutlined,
  DownOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuth } from '../../context/AuthContext';

const ROUTE_LABELS: Record<string, string> = {
  profile: 'Профиль',
  catalog: 'Каталог',
  drafts: 'Черновики',
  roles: 'Роли',
};

function useBreadcrumbs() {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  const items = [
    {
      title: (
        <Link to="/" style={{ color: '#5F7B8E', display: 'flex', alignItems: 'center', gap: 4 }}>
          <HomeOutlined style={{ fontSize: 13 }} />
          <span>Дашборд</span>
        </Link>
      ),
    },
    ...parts.map(part => ({
      title: <span style={{ color: '#7B7670' }}>{ROUTE_LABELS[part] ?? part}</span>,
    })),
  ];
  return items;
}

export function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const breadcrumbs = useBreadcrumbs();

  const handleLogout = async () => {
    await logout();
    message.success('Вы вышли из системы');
    navigate('/');
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <Link to="/profile">Профиль</Link>,
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Выйти',
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 220,
        right: 0,
        height: 56,
        background: '#FFFFFF',
        borderBottom: '1px solid #DEDAD1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 99,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <Breadcrumb
        items={breadcrumbs}
        separator={<span style={{ color: '#C5C0B8' }}>/</span>}
        style={{ fontSize: 13 }}
      />

      <div>
        {user ? (
          <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
            <Button
              type="text"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                height: 36,
                padding: '0 12px',
                borderRadius: 8,
                color: '#3A3A38',
                fontWeight: 500,
                fontSize: 13,
              }}
            >
              <Avatar
                size={26}
                style={{ background: '#5F7B8E', fontSize: 11, flexShrink: 0 }}
              >
                {user.firstName[0]}{user.lastName[0]}
              </Avatar>
              <span>{user.firstName} {user.lastName}</span>
              <DownOutlined style={{ fontSize: 10, opacity: 0.5 }} />
            </Button>
          </Dropdown>
        ) : (
          <Button
            type="primary"
            icon={<LoginOutlined />}
            onClick={() => navigate('/login')}
            size="small"
            style={{
              background: '#5F7B8E',
              borderColor: '#5F7B8E',
              borderRadius: 7,
              fontWeight: 500,
              fontSize: 13,
            }}
          >
            Войти
          </Button>
        )}
      </div>
    </header>
  );
}
