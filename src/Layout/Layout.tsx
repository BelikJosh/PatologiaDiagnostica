// src/Layout/Layout.tsx
import { Layout, theme } from 'antd';
import { NavBar } from '../Navigation/NavBar';
import { SideBar } from '../Navigation/SideBar';
import { useState } from 'react';
import { NavRoutes } from '../routes/NavRoutes';
import { ProtectedRoute } from '../components/ProtectedRoute'; // Importar el ProtectedRoute

const { Header, Sider, Content } = Layout;

export const LayoutComponent = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <ProtectedRoute> {/* 🔐 Envuelve todo con ProtectedRoute */}
      <Layout>
        <Header style={{ background: theme.useToken().token.colorPrimary }}>
          <NavBar />
        </Header>
        <Layout>
          <Sider
            breakpoint="md"
            collapsible
            collapsed={collapsed}
            onCollapse={(value) => setCollapsed(value)}
          >
            <SideBar />
          </Sider>
          <Layout>
            <Content
              style={{
                padding: '20px',
                overflow: 'scroll',
              }}
            >
              <NavRoutes />
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </ProtectedRoute>
  );
};