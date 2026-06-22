import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';

export function AppLayout() {
  return (
    <div style={{ minHeight: '100vh', background: '#F5F3EE' }}>
      <AppSidebar />
      <AppHeader />
      <main
        style={{
          marginLeft: 220,
          marginTop: 56,
          minHeight: 'calc(100vh - 56px)',
          padding: '28px 32px',
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
