// src/Layout/Layout.tsx
import { Layout, theme } from 'antd';
import { NavBar } from '../Navigation/NavBar';
import { SideBar } from '../Navigation/SideBar';
import { useState } from 'react';
import { NavRoutes } from '../routes/NavRoutes';
// REMUEVE el import de ProtectedRoute de aquí

const { Header, Sider, Content } = Layout;

export const LayoutComponent = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    // REMUEVE el ProtectedRoute de aquí
    <Layout>
      <Header style={{ 
        padding: '0 24px',
        background: theme.useToken().token.colorPrimary,
        display: 'flex',
        alignItems: 'center'
      }}>
        <NavBar />
      </Header>
      <Layout>
        <Sider
          breakpoint="md"
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          style={{
            background: '#fff',
          }}
        >
          <SideBar />
        </Sider>
        <Layout>
          <Content
            style={{
              padding: '24px',
              margin: 0,
              minHeight: 280,
              background: '#f5f5f5',
              overflow: 'auto'
            }}
          >
            <NavRoutes />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};