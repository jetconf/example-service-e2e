import { useEffect, useState, useCallback } from 'react';
import { Drawer, Spin, Tag, Avatar, Divider, Alert, Typography } from 'antd';
import {
  GlobalOutlined,
  FolderOutlined,
  ApiOutlined,
  LockOutlined,
  EyeOutlined,
  EditOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { CatalogNode, EntityDetail, EntityType } from '../../types';
import { apiGetEntityDetail, apiSaveConfig } from '../../api/catalog';
import { useAuth } from '../../context/AuthContext';
import { ConfigEditor } from './ConfigEditor';

const ENTITY_ICONS: Record<EntityType, React.ReactNode> = {
  namespace: <GlobalOutlined />,
  project: <FolderOutlined />,
  service: <ApiOutlined />,
};

const ENTITY_LABELS: Record<EntityType, string> = {
  namespace: 'Неймспейс',
  project: 'Проект',
  service: 'Сервис',
};

const ROLE_CONFIG = {
  read: { color: '#5A7B8A', bg: '#EBF3F7', icon: <EyeOutlined />, label: 'Чтение' },
  edit: { color: '#5A7A5A', bg: '#EBF7EB', icon: <EditOutlined />, label: 'Редактирование' },
  responsible: { color: '#7A6A3A', bg: '#F7F3E3', icon: <CheckCircleOutlined />, label: 'Ответственный' },
};

interface EntityPanelProps {
  node: CatalogNode | null;
  onClose: () => void;
  onDraftCreated: () => void;
}

export function EntityPanel({ node, onClose, onDraftCreated }: EntityPanelProps) {
  const { user } = useAuth();
  const [detail, setDetail] = useState<EntityDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!node || !user) return;
    setLoading(true);
    const d = await apiGetEntityDetail(user.id, node.type, node.id);
    setDetail(d);
    setLoading(false);
  }, [node, user]);

  useEffect(() => {
    if (node) loadDetail();
    else setDetail(null);
  }, [node, loadDetail]);

  const handleSave = async (newConfig: Record<string, unknown>) => {
    if (!user || !detail) return { ok: false, error: 'Нет данных' };
    const result = await apiSaveConfig(user.id, detail.type, detail.id, newConfig);
    if (result.ok) {
      await loadDetail();
      onDraftCreated();
    }
    return result;
  };

  const open = Boolean(node);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={520}
      title={null}
      closable={false}
      styles={{
        body: { padding: 0 },
        wrapper: { boxShadow: '-4px 0 24px rgba(0,0,0,0.10)' },
      }}
    >
      {/* Custom header */}
      <div
        style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid #ECEAE3',
          background: '#FDFCFA',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Show at minimum the node name while detail is loading */}
          {node && !detail && (
            <Typography.Title level={4} style={{ margin: 0, color: '#1A1A1A', fontWeight: 600 }}>
              {node.displayName}
            </Typography.Title>
          )}
          {detail && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ color: '#5F7B8E', fontSize: 16 }}>{ENTITY_ICONS[detail.type]}</span>
                <Tag
                  style={{
                    margin: 0,
                    fontSize: 11,
                    background: '#EEF3F7',
                    border: 'none',
                    color: '#5F7B8E',
                    borderRadius: 5,
                  }}
                >
                  {ENTITY_LABELS[detail.type]}
                </Tag>
                {detail.effectiveRole && (
                  <Tag
                    style={{
                      margin: 0,
                      fontSize: 11,
                      background: ROLE_CONFIG[detail.effectiveRole].bg,
                      border: 'none',
                      color: ROLE_CONFIG[detail.effectiveRole].color,
                      borderRadius: 5,
                    }}
                  >
                    {ROLE_CONFIG[detail.effectiveRole].icon}{' '}
                    {ROLE_CONFIG[detail.effectiveRole].label}
                  </Tag>
                )}
              </div>
              <Typography.Title level={4} style={{ margin: 0, color: '#1A1A1A', fontWeight: 600 }}>
                {detail.displayName}
              </Typography.Title>
              <div style={{ color: '#7B7670', fontSize: 12, marginTop: 2 }}>{detail.name}</div>
            </>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: 18,
            color: '#AAA49E',
            padding: 4,
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '20px 24px', overflowY: 'auto', height: 'calc(100vh - 120px)' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
          </div>
        )}

        {!loading && detail && (
          <>
            {/* No access */}
            {!detail.effectiveRole && (
              <Alert
                type="error"
                showIcon
                icon={<LockOutlined />}
                message="Нет прав доступа"
                description="У вас нет прав на просмотр этой сущности."
                style={{ borderRadius: 8 }}
              />
            )}

            {detail.effectiveRole && (
              <>
                {/* Description */}
                <section style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#9E9890', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                    Описание
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: '#3A3A38', lineHeight: 1.6 }}>
                    {detail.description}
                  </p>
                </section>

                <Divider style={{ margin: '0 0 20px', borderColor: '#ECEAE3' }} />

                {/* Responsible users */}
                <section style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#9E9890', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                    Ответственные
                  </div>
                  {detail.responsibleUsers.length === 0 ? (
                    <div style={{ color: '#AAA49E', fontSize: 13 }}>Ответственные не назначены</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {detail.responsibleUsers.map(u => (
                        <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar size={30} style={{ background: '#5F7B8E', fontSize: 12, flexShrink: 0 }}>
                            {u.firstName[0]}{u.lastName[0]}
                          </Avatar>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: '#2A2A2A' }}>
                              {u.firstName} {u.lastName}
                            </div>
                            <div style={{ fontSize: 11, color: '#9E9890' }}>{u.position}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Config (services only) */}
                {detail.type === 'service' && detail.config !== undefined && (
                  <>
                    <Divider style={{ margin: '0 0 20px', borderColor: '#ECEAE3' }} />
                    <section>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#9E9890', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                        Конфигурация
                      </div>
                      <ConfigEditor
                        entityType={detail.type}
                        entityId={detail.id}
                        entityName={detail.displayName}
                        config={detail.config}
                        effectiveRole={detail.effectiveRole}
                        activeDraft={detail.activeDraft}
                        onSave={handleSave}
                      />
                    </section>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </Drawer>
  );
}
