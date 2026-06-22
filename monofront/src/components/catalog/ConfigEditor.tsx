import { useState, useEffect } from 'react';
import { Button, Alert, Spin, message } from 'antd';
import { SaveOutlined, FileTextOutlined } from '@ant-design/icons';
import type { Draft, EntityType, UserRole } from '../../types';

interface ConfigEditorProps {
  entityType: EntityType;
  entityId: string;
  entityName: string;
  config: Record<string, unknown>;
  effectiveRole: UserRole;
  activeDraft?: Draft;
  onSave: (newConfig: Record<string, unknown>) => Promise<{ ok: boolean; error?: string }>;
}

export function ConfigEditor({ config, effectiveRole, activeDraft, onSave, entityName }: ConfigEditorProps) {
  const isReadOnly = effectiveRole === 'read' || Boolean(activeDraft);
  const canonical = JSON.stringify(config, null, 2);
  const [value, setValue] = useState(() => canonical);
  const [parseError, setParseError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(JSON.stringify(config, null, 2));
  }, [config]);

  const hasChanges = (() => {
    if (parseError) return false;
    try {
      return JSON.stringify(JSON.parse(value)) !== JSON.stringify(config);
    } catch {
      return false;
    }
  })();

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setValue(v);
    try {
      JSON.parse(v);
      setParseError(null);
    } catch {
      setParseError('Невалидный JSON');
    }
  };

  const handleSave = async () => {
    if (parseError) return;
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(value);
    } catch {
      setParseError('Невалидный JSON');
      return;
    }
    setSaving(true);
    const result = await onSave(parsed);
    setSaving(false);
    if (result.ok) {
      message.success(`Черновик для «${entityName}» создан. Конфигурация заблокирована до подтверждения.`);
    } else {
      message.error(result.error ?? 'Ошибка сохранения');
    }
  };

  return (
    <div>
      {activeDraft && (
        <Alert
          type="warning"
          showIcon
          icon={<FileTextOutlined />}
          message="Есть неподтверждённый черновик"
          description={`Черновик #${activeDraft.id.slice(-3)} создан ${new Date(activeDraft.createdAt).toLocaleString('ru')}. Конфигурация заблокирована до его подтверждения или отмены.`}
          style={{ marginBottom: 12, borderRadius: 8 }}
        />
      )}
      {effectiveRole === 'read' && !activeDraft && (
        <Alert
          type="info"
          showIcon
          message="Только для чтения"
          description="У вас права только на просмотр конфигурации."
          style={{ marginBottom: 12, borderRadius: 8 }}
        />
      )}

      <div style={{ position: 'relative' }}>
        <textarea
          value={value}
          onChange={handleChange}
          disabled={isReadOnly}
          spellCheck={false}
          style={{
            width: '100%',
            minHeight: 320,
            fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
            fontSize: 12,
            lineHeight: 1.6,
            padding: '12px 14px',
            borderRadius: 8,
            border: `1px solid ${parseError ? '#E3735A' : '#DEDAD1'}`,
            background: isReadOnly ? '#F8F6F1' : '#FFFFFF',
            color: isReadOnly ? '#8A857A' : '#2A2A2A',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
            cursor: isReadOnly ? 'default' : 'text',
            transition: 'border-color 0.15s',
          }}
        />
        {saving && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
            <Spin />
          </div>
        )}
      </div>

      {parseError && (
        <div style={{ color: '#E3735A', fontSize: 12, marginTop: 4 }}>{parseError}</div>
      )}

      {!isReadOnly && (
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={saving}
          disabled={!hasChanges}
          style={{
            marginTop: 12,
            background: '#5F7B8E',
            borderColor: '#5F7B8E',
            borderRadius: 7,
            fontWeight: 500,
          }}
        >
          Создать черновик
        </Button>
      )}
    </div>
  );
}
