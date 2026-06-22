import { useEffect, useState } from 'react';
import { Spin, Tag, Empty } from 'antd';
import {
  GlobalOutlined,
  FolderOutlined,
  ApiOutlined,
  EyeOutlined,
  EditOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { apiGetUserRoleAssignments } from '../api/catalog';
import { useAuth } from '../context/AuthContext';
import type { EntityType, UserRole } from '../types';

const ENTITY_ICONS: Record<EntityType, React.ReactNode> = {
  namespace: <GlobalOutlined style={{ color: '#5F7B8E' }} />,
  project: <FolderOutlined style={{ color: '#7B6E5A' }} />,
  service: <ApiOutlined style={{ color: '#5A7B6A' }} />,
};

const ENTITY_LABELS: Record<EntityType, string> = {
  namespace: 'Неймспейс',
  project: 'Проект',
  service: 'Сервис',
};

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; bg: string; border: string; icon: React.ReactNode; description: string }> = {
  read: {
    label: 'Чтение',
    color: '#3A6A7A',
    bg: '#EBF3F7',
    border: '#A8CCDA',
    icon: <EyeOutlined />,
    description: 'Просмотр сущности и её конфигурации',
  },
  edit: {
    label: 'Редактирование',
    color: '#3A6A3A',
    bg: '#EBF5EB',
    border: '#A8D4A8',
    icon: <EditOutlined />,
    description: 'Просмотр + создание черновиков конфигурации',
  },
  responsible: {
    label: 'Ответственный',
    color: '#7A5A1A',
    bg: '#F7F0E0',
    border: '#E0C878',
    icon: <CheckCircleOutlined />,
    description: 'Редактирование + подтверждение/отмена черновиков',
  },
};

interface RoleRow {
  entityType: EntityType;
  entityId: string;
  entityName: string;
  role: UserRole;
}

export function RolesPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    apiGetUserRoleAssignments(user.id).then(data => {
      setRows(data);
      setLoading(false);
    });
  }, [user]);

  return (
    <div style={{ maxWidth: 720 }}>
      <h2 style={{ margin: '0 0 8px', color: '#1A1A1A', fontWeight: 600, fontSize: 20 }}>
        Мои роли
      </h2>
      <p style={{ margin: '0 0 24px', color: '#7B7670', fontSize: 13 }}>
        Прямые назначения ролей. Роли наследуются вниз по иерархии: неймспейс → проект → сервис.
      </p>

      {/* Legend */}
      <div
        style={{
          background: '#FFF',
          borderRadius: 10,
          border: '1px solid #DEDAD1',
          padding: '14px 18px',
          marginBottom: 20,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#7B7670' }}>
          <InfoCircleOutlined style={{ color: '#9E9890' }} />
          <span>Ролевая модель:</span>
        </div>
        {(Object.entries(ROLE_CONFIG) as [UserRole, (typeof ROLE_CONFIG)[UserRole]][]).map(([role, cfg]) => (
          <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Tag
              style={{
                margin: 0,
                fontSize: 11,
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                color: cfg.color,
                borderRadius: 5,
              }}
            >
              {cfg.icon} {cfg.label}
            </Tag>
            <span style={{ fontSize: 11, color: '#9E9890' }}>— {cfg.description}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Spin size="large" />
        </div>
      ) : rows.length === 0 ? (
        <div style={{ background: '#FFF', borderRadius: 12, border: '1px solid #DEDAD1', padding: '60px 20px' }}>
          <Empty description={<span style={{ color: '#9E9890' }}>Назначенных ролей нет</span>} />
        </div>
      ) : (
        <div style={{ background: '#FFF', borderRadius: 12, border: '1px solid #DEDAD1', overflow: 'hidden' }}>
          {rows.map((row, i) => {
            const roleCfg = ROLE_CONFIG[row.role];
            return (
              <div
                key={`${row.entityType}-${row.entityId}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 20px',
                  borderBottom: i < rows.length - 1 ? '1px solid #F0EDE6' : 'none',
                  gap: 14,
                }}
              >
                {/* Entity icon */}
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: '#F5F3EE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 15,
                  }}
                >
                  {ENTITY_ICONS[row.entityType]}
                </div>

                {/* Name + type */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1A1A', marginBottom: 2 }}>
                    {row.entityName}
                  </div>
                  <div style={{ fontSize: 11, color: '#9E9890' }}>{ENTITY_LABELS[row.entityType]}</div>
                </div>

                {/* Role badge */}
                <Tag
                  style={{
                    margin: 0,
                    fontSize: 12,
                    padding: '3px 10px',
                    background: roleCfg.bg,
                    border: `1px solid ${roleCfg.border}`,
                    color: roleCfg.color,
                    borderRadius: 6,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  {roleCfg.icon} {roleCfg.label}
                </Tag>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
