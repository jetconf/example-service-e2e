import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { DashboardPage } from '../pages/Dashboard';
import { LoginPage } from '../pages/Login';
import { ProfilePage } from '../pages/Profile';
import { CatalogPage } from '../pages/Catalog';
import { DraftsPage } from '../pages/Drafts';
import { RolesPage } from '../pages/Roles';
import { AuthGuard } from './AuthGuard';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      {
        path: 'profile',
        element: (
          <AuthGuard>
            <ProfilePage />
          </AuthGuard>
        ),
      },
      {
        path: 'catalog',
        element: (
          <AuthGuard>
            <CatalogPage />
          </AuthGuard>
        ),
      },
      {
        path: 'drafts',
        element: (
          <AuthGuard>
            <DraftsPage />
          </AuthGuard>
        ),
      },
      {
        path: 'roles',
        element: (
          <AuthGuard>
            <RolesPage />
          </AuthGuard>
        ),
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
