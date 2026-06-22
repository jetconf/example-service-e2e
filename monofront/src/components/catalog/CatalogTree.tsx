import { useState, useMemo } from 'react';
import { Input, Tag, Tooltip } from 'antd';
import {
  SearchOutlined,
  GlobalOutlined,
  FolderOutlined,
  ApiOutlined,
  RightOutlined,
  DownOutlined,
  LockOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { CatalogNode, EntityType } from '../../types';

const ENTITY_ICONS: Record<EntityType, React.ReactNode> = {
  namespace: <GlobalOutlined style={{ fontSize: 14 }} />,
  project: <FolderOutlined style={{ fontSize: 13 }} />,
  service: <ApiOutlined style={{ fontSize: 13 }} />,
};

const ENTITY_LABELS: Record<EntityType, string> = {
  namespace: 'Неймспейс',
  project: 'Проект',
  service: 'Сервис',
};

interface TreeNodeProps {
  node: CatalogNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (node: CatalogNode) => void;
  searchMatch: Set<string>;
}

function TreeNode({ node, depth, expanded, onToggle, onSelect, searchMatch }: TreeNodeProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const isMatched = searchMatch.has(node.id);
  const noAccess = node.effectiveRole === null;
  const hasActiveDraft = Boolean(node.activeDraftId);

  const indent = depth * 18;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: `6px 10px 6px ${indent + 10}px`,
          borderRadius: 6,
          cursor: noAccess ? 'default' : 'pointer',
          opacity: noAccess ? 0.8 : 1,
          background: isMatched ? '#EEF3F7' : 'transparent',
          transition: 'background 0.12s',
          userSelect: 'none',
        }}
        onMouseEnter={e => {
          if (!noAccess) (e.currentTarget as HTMLDivElement).style.background = '#E8E5DC';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.background = isMatched ? '#EEF3F7' : 'transparent';
        }}
        onClick={() => {
          if (hasChildren) onToggle(node.id);
          if (!noAccess) onSelect(node);
        }}
      >
        {/* Expand toggle */}
        <span
          style={{ width: 14, fontSize: 10, color: '#999', flexShrink: 0, cursor: hasChildren ? 'pointer' : 'default' }}
          onClick={e => { e.stopPropagation(); if (hasChildren) onToggle(node.id); }}
        >
          {hasChildren ? (isExpanded ? <DownOutlined /> : <RightOutlined />) : null}
        </span>

        {/* Icon */}
        <span style={{ color: noAccess ? '#BBBAB5' : node.type === 'namespace' ? '#5F7B8E' : node.type === 'project' ? '#7B6E5A' : '#5A7B6A', flexShrink: 0 }}>
          {ENTITY_ICONS[node.type]}
        </span>

        {/* Name */}
        <span
          style={{
            fontSize: 13,
            fontWeight: node.type === 'namespace' ? 600 : node.type === 'project' ? 500 : 400,
            color: noAccess ? '#828282' : '#2A2A2A',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {node.displayName}
        </span>

        {/* Badges */}
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {noAccess && (
            <Tooltip title="Нет прав доступа">
              <LockOutlined style={{ fontSize: 11, color: '#BBBAB5' }} />
            </Tooltip>
          )}
          {hasActiveDraft && !noAccess && (
            <Tooltip title="Есть активный черновик">
              <FileTextOutlined style={{ fontSize: 11, color: '#C8943A' }} />
            </Tooltip>
          )}
          {!noAccess && node.type !== 'namespace' && (
            <Tag
              style={{
                fontSize: 10,
                padding: '0 5px',
                lineHeight: '16px',
                height: 16,
                borderRadius: 4,
                margin: 0,
                background: 'transparent',
                border: '1px solid #D8D4CB',
                color: '#8A857A',
              }}
            >
              {ENTITY_LABELS[node.type]}
            </Tag>
          )}
        </span>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
              searchMatch={searchMatch}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Collect all node IDs that match the query or have matching descendants
function computeSearchMatch(nodes: CatalogNode[], query: string): { matched: Set<string>; expanded: Set<string> } {
  const matched = new Set<string>();
  const expanded = new Set<string>();
  const lq = query.toLowerCase();

  function visit(node: CatalogNode): boolean {
    const selfMatch =
      node.displayName.toLowerCase().includes(lq) ||
      node.name.toLowerCase().includes(lq) ||
      node.description.toLowerCase().includes(lq);

    let childMatch = false;
    if (node.children) {
      for (const child of node.children) {
        if (visit(child)) childMatch = true;
      }
    }

    if (selfMatch) matched.add(node.id);
    if (childMatch) expanded.add(node.id);
    return selfMatch || childMatch;
  }

  for (const node of nodes) visit(node);
  return { matched, expanded };
}

// Collect all node IDs for initial expansion of namespaces
function getAllTopIds(nodes: CatalogNode[]): Set<string> {
  return new Set(nodes.map(n => n.id));
}

interface CatalogTreeProps {
  nodes: CatalogNode[];
  onSelectNode: (node: CatalogNode) => void;
}

export function CatalogTree({ nodes, onSelectNode }: CatalogTreeProps) {
  const [search, setSearch] = useState('');
  const [manualExpanded, setManualExpanded] = useState<Set<string>>(() => getAllTopIds(nodes));

  const { searchExpanded, searchMatched } = useMemo(() => {
    if (!search.trim()) return { searchExpanded: new Set<string>(), searchMatched: new Set<string>() };
    const { matched, expanded } = computeSearchMatch(nodes, search.trim());
    return { searchExpanded: expanded, searchMatched: matched };
  }, [nodes, search]);

  const effectiveExpanded = useMemo(() => {
    if (!search.trim()) return manualExpanded;
    // merge: auto-expand matching paths + keep any manual expansions
    return new Set([...manualExpanded, ...searchExpanded, ...searchMatched]);
  }, [search, manualExpanded, searchExpanded, searchMatched]);

  const handleToggle = (id: string) => {
    setManualExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const displayNodes = useMemo(() => {
    if (!search.trim()) return nodes;
    // Filter: keep nodes that match or have matching descendants
    function filterNode(node: CatalogNode): CatalogNode | null {
      const lq = search.toLowerCase();
      const selfMatch = node.displayName.toLowerCase().includes(lq) || node.name.toLowerCase().includes(lq) || node.description.toLowerCase().includes(lq);
      const filteredChildren = node.children?.map(filterNode).filter((c): c is CatalogNode => c !== null);
      if (selfMatch || (filteredChildren && filteredChildren.length > 0)) {
        return { ...node, children: filteredChildren };
      }
      return null;
    }
    return nodes.map(filterNode).filter((n): n is CatalogNode => n !== null);
  }, [nodes, search]);

  return (
    <div>
      <Input
        prefix={<SearchOutlined style={{ color: '#999' }} />}
        placeholder="Поиск по каталогу…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        allowClear
        style={{
          marginBottom: 16,
          borderRadius: 8,
          background: '#FFF',
          border: '1px solid #DEDAD1',
          fontSize: 13,
        }}
      />

      {displayNodes.length === 0 && (
        <div style={{ textAlign: 'center', color: '#9E9890', padding: '40px 0', fontSize: 13 }}>
          Ничего не найдено
        </div>
      )}

      {displayNodes.map(node => (
        <TreeNode
          key={node.id}
          node={node}
          depth={0}
          expanded={effectiveExpanded}
          onToggle={handleToggle}
          onSelect={onSelectNode}
          searchMatch={searchMatched}
        />
      ))}
    </div>
  );
}
