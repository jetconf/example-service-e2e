import { useEffect, useState, useCallback } from 'react';
import {
  Spin,
  Tag,
  Button,
  Tooltip,
  Avatar,
  Popconfirm,
  message,
  Empty,
  Divider,
  Typography,
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  UserOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { apiGetDrafts, apiApproveDraft, apiCancelDraft } from '../api/drafts';
import { useAuth } from '../context/AuthContext';
import type { Draft } from '../types';
import store from '../mocks/store';

const STATUS_CONFIG = {
  created: { label: 'Создан', color: '#C8943A', bg: '#FDF4E4', border: '#F0D89A' },
  approved: { label: 'Подтверждён', color: '#4A7A4A', bg: '#EBF5EB', border: '#A8D4A8' },
  cancelled: { label: 'Отменён', color: '#8A7A7A', bg: '#F5F0EE', border: '#D4C8C4' },
};

function DeltaView({ before, after }: { before: Record<string, unknown>; after: Record<string, unknown> }) {
  const beforeStr = JSON.stringify(before, null, 2);
  const afterStr = JSON.stringify(after, null, 2);

  const beforeLines = beforeStr.split('\n');
  const afterLines = afterStr.split('\n');

  // Simple line-diff: show removed (before-only) and added (after-only)
  const allKeys = new Set([...beforeLines, ...afterLines]);
  const removed = beforeLines.filter(l => !afterLines.includes(l));
  const added = afterLines.filter(l => !beforeLines.includes(l));

  // Show at most 20 diff lines total
  const toShow = [
    ...removed.slice(0, 10).map(l => ({ type: 'removed' as const, line: l })),
    ...added.slice(0, 10).map(l => ({ type: 'added' as const, line: l })),
  ].sort((a, b) => {
    const ai = allKeys.has(a.line) ? [...allKeys].indexOf(a.line) : 99;
    const bi = allKeys.has(b.line) ? [...allKeys].indexOf(b.line) : 99;
    return ai - bi;
  });

  if (toShow.length === 0) {
    return <div style={{ fontSize: 12, color: '#9E9890', fontStyle: 'italic' }}>Изменений нет</div>;
  }

  return (
    <div
      style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 11,
        lineHeight: 1.6,
        background: '#F8F6F2',
        borderRadius: 7,
        padding: '10px 12px',
        overflow: 'auto',
        maxHeight: 180,
        border: '1px solid #ECEAE3',
      }}
    >
      {toShow.map((l, i) => (
        <div
          key={i}
          style={{
            color: l.type === 'removed' ? '#B85450' : '#4A7A4A',
            background: l.type === 'removed' ? '#FFF0F0' : '#F0FFF0',
            padding: '0 6px',
            borderRadius: 3,
            marginBottom: 1,
            whiteSpace: 'pre',
          }}
        >
          {l.type === 'removed' ? '- ' : '+ '}{l.line}
        </div>
      ))}
      {(removed.length > 10 || added.length > 10) && (
        <div style={{ color: '#9E9890', marginTop: 4, fontStyle: 'italic', fontSize: 10 }}>
          …показаны первые изменения
        </div>
      )}
    </div>
  );
}

function getUserName(userId: string): string {
  const u = store.users.find(u => u.id === userId);
  return u ? `${u.firstName} ${u.lastName}` : userId;
}

function DraftCard({ draft, currentUserId, onAction }: { draft: Draft; currentUserId: string; onAction: () => void }) {
  const [approving, setApproving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const status = STATUS_CONFIG[draft.status];
  const isApprover = draft.approverIds.includes(currentUserId);
  const isActive = draft.status === 'created';

  const handleApprove = async () => {
    setApproving(true);
    const result = await apiApproveDraft(currentUserId, draft.id);
    setApproving(false);
    if (result.ok) {
      message.success('Черновик подтверждён');
      onAction();
    } else {
      message.error(result.error ?? 'Ошибка');
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    const result = await apiCancelDraft(currentUserId, draft.id);
    setCancelling(false);
    if (result.ok) {
      message.success('Черновик отменён');
      onAction();
    } else {
      message.error(result.error ?? 'Ошибка');
    }
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 10,
        border: '1px solid #DEDAD1',
        padding: '16px 20px',
        marginBottom: 12,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <FileTextOutlined style={{ color: '#9E9890', fontSize: 13 }} />
            <span style={{ fontSize: 11, color: '#9E9890', fontFamily: 'monospace' }}>#{draft.id.slice(-6)}</span>
            <Tag
              style={{
                margin: 0,
                fontSize: 11,
                background: status.bg,
                border: `1px solid ${status.border}`,
                color: status.color,
                borderRadius: 5,
                fontWeight: 500,
              }}
            >
              {status.label}
            </Tag>
          </div>
          <Typography.Text strong style={{ fontSize: 14, color: '#1A1A1A' }}>
            {draft.entityName}
          </Typography.Text>
          <span
            style={{
              marginLeft: 8,
              fontSize: 11,
              color: '#9E9890',
              background: '#F5F3EE',
              padding: '1px 6px',
              borderRadius: 4,
            }}
          >
            {draft.entityType === 'namespace' ? 'неймспейс' : draft.entityType === 'project' ? 'проект' : 'сервис'}
          </span>
        </div>

        {/* Action buttons */}
        {isActive && isApprover && (
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <Popconfirm
              title="Подтвердить черновик?"
              description="Конфигурация сервиса будет обновлена."
              onConfirm={handleApprove}
              okText="Подтвердить"
              cancelText="Отмена"
              okButtonProps={{ style: { background: '#5F7B8E', borderColor: '#5F7B8E' } }}
            >
              <Button
                size="small"
                icon={<CheckOutlined />}
                loading={approving}
                style={{
                  background: '#EBF5EB',
                  border: '1px solid #A8D4A8',
                  color: '#4A7A4A',
                  borderRadius: 6,
                  fontWeight: 500,
                  fontSize: 12,
                }}
              >
                Подтвердить
              </Button>
            </Popconfirm>
            <Popconfirm
              title="Отменить черновик?"
              description="Изменения будут отклонены."
              onConfirm={handleCancel}
              okText="Отменить"
              cancelText="Назад"
              okButtonProps={{ danger: true }}
            >
              <Button
                size="small"
                icon={<CloseOutlined />}
                loading={cancelling}
                style={{
                  background: '#FFF0F0',
                  border: '1px solid #E8BABA',
                  color: '#B85450',
                  borderRadius: 6,
                  fontWeight: 500,
                  fontSize: 12,
                }}
              >
                Отменить
              </Button>
            </Popconfirm>
          </div>
        )}
      </div>

      {/* Delta */}
      <DeltaView before={draft.configBefore} after={draft.configAfter} />

      <Divider style={{ margin: '12px 0', borderColor: '#ECEAE3' }} />

      {/* Meta */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Avatar size={18} style={{ background: '#5F7B8E', fontSize: 9 }} icon={<UserOutlined />}>
            {getUserName(draft.authorId).split(' ').map(w => w[0]).join('')}
          </Avatar>
          <span style={{ color: '#7B7670' }}>Автор:</span>
          <span style={{ color: '#2A2A2A', fontWeight: 500 }}>{getUserName(draft.authorId)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ClockCircleOutlined style={{ color: '#9E9890', fontSize: 12 }} />
          <span style={{ color: '#7B7670' }}>{new Date(draft.createdAt).toLocaleString('ru')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <CheckOutlined style={{ color: '#9E9890', fontSize: 12 }} />
          <span style={{ color: '#7B7670' }}>Подтверждающие:</span>
          {draft.approverIds.map((id, idx) => (
            <span key={id}>
              {idx > 0 && <span style={{ color: '#C5C0B8' }}>,&nbsp;</span>}
              <Tooltip title={getUserName(id)}>
                <Link to="/profile" style={{ color: '#5F7B8E', fontSize: 12 }}>
                  {getUserName(id)}
                </Link>
              </Tooltip>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DraftsPage() {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await apiGetDrafts(user.id);
    setDrafts(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const active = drafts.filter(d => d.status === 'created');
  const inactive = drafts.filter(d => d.status !== 'created');

  return (
    <div style={{ maxWidth: 780 }}>
      <h2 style={{ margin: '0 0 20px', color: '#1A1A1A', fontWeight: 600, fontSize: 20 }}>
        Черновики
      </h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {drafts.length === 0 && (
            <div style={{ background: '#FFF', borderRadius: 12, border: '1px solid #DEDAD1', padding: '60px 20px' }}>
              <Empty description={<span style={{ color: '#9E9890' }}>Черновиков нет</span>} />
            </div>
          )}

          {active.length > 0 && (
            <section style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#9E9890', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                Активные · {active.length}
              </div>
              {active.map(d => (
                <DraftCard key={d.id} draft={d} currentUserId={user!.id} onAction={load} />
              ))}
            </section>
          )}

          {inactive.length > 0 && (
            <section>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#9E9890', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                История · {inactive.length}
              </div>
              {inactive.map(d => (
                <DraftCard key={d.id} draft={d} currentUserId={user!.id} onAction={load} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
