import { useEffect, useState } from 'react';
import { Spin } from 'antd';
import { apiGetCatalogTree } from '../api/catalog';
import { useAuth } from '../context/AuthContext';
import { CatalogTree } from '../components/catalog/CatalogTree';
import { EntityPanel } from '../components/catalog/EntityPanel';
import type { CatalogNode } from '../types';

export function CatalogPage() {
  const { user } = useAuth();
  const [nodes, setNodes] = useState<CatalogNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<CatalogNode | null>(null);

  const loadTree = async () => {
    if (!user) return;
    setLoading(true);
    const tree = await apiGetCatalogTree(user.id);
    setNodes(tree);
    setLoading(false);
  };

  useEffect(() => {
    loadTree();
  }, [user]);

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', color: '#1A1A1A', fontWeight: 600, fontSize: 20 }}>
        Каталог сервисов
      </h2>

      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 12,
          border: '1px solid #DEDAD1',
          padding: '20px 16px',
          minHeight: 400,
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Spin size="large" />
          </div>
        ) : (
          <CatalogTree nodes={nodes} onSelectNode={setSelectedNode} />
        )}
      </div>

      <EntityPanel
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
        onDraftCreated={loadTree}
      />
    </div>
  );
}
