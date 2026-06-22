import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { AuthProvider } from './context/AuthContext';
import { router } from './router';

const theme = {
  token: {
    colorPrimary: '#5F7B8E',
    colorBgBase: '#F5F3EE',
    colorBgContainer: '#FFFFFF',
    colorBorder: '#DEDAD1',
    colorText: '#2A2A2A',
    colorTextSecondary: '#7B7670',
    borderRadius: 8,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    colorLink: '#5F7B8E',
    colorLinkHover: '#4A6878',
  },
  components: {
    Button: {
      borderRadius: 7,
    },
    Card: {
      borderRadius: 10,
    },
    Input: {
      borderRadius: 7,
    },
    Tag: {
      borderRadius: 5,
    },
    Drawer: {
      borderRadius: 0,
    },
    Alert: {
      borderRadius: 8,
    },
  },
};

export default function App() {
  return (
    <ConfigProvider theme={theme} locale={ruRU}>
      <AntApp>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </AntApp>
    </ConfigProvider>
  );
}
