import { Avatar, Card, Descriptions } from 'antd';
import { MailOutlined, TeamOutlined, SolutionOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

export function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div style={{ maxWidth: 640 }}>
      <h2 style={{ margin: '0 0 24px', color: '#1A1A1A', fontWeight: 600, fontSize: 20 }}>
        Профиль
      </h2>

      <Card
        style={{ borderRadius: 12, border: '1px solid #DEDAD1' }}
        styles={{ body: { padding: '28px' } }}
      >
        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
          <Avatar
            size={72}
            style={{ background: '#5F7B8E', fontSize: 24, flexShrink: 0 }}
          >
            {user.firstName[0]}{user.lastName[0]}
          </Avatar>
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#1A1A1A' }}>
              {user.firstName} {user.lastName}
            </div>
            <div style={{ fontSize: 13, color: '#7B7670', marginTop: 4 }}>
              @{user.login}
            </div>
          </div>
        </div>

        <Descriptions
          column={1}
          labelStyle={{ color: '#7B7670', fontSize: 13, width: 180, fontWeight: 500, paddingBottom: 16 }}
          contentStyle={{ color: '#2A2A2A', fontSize: 13, paddingBottom: 16 }}
          colon={false}
        >
          <Descriptions.Item
            label={
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <SolutionOutlined style={{ color: '#9E9890' }} /> Должность
              </span>
            }
          >
            {user.position}
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MailOutlined style={{ color: '#9E9890' }} /> Рабочая почта
              </span>
            }
          >
            <a href={`mailto:${user.email}`} style={{ color: '#5F7B8E' }}>
              {user.email}
            </a>
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <TeamOutlined style={{ color: '#9E9890' }} /> Подразделение
              </span>
            }
          >
            {user.department}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}
