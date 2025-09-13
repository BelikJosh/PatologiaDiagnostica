// src/Navigation/NavBar.tsx
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Col, Dropdown, Row, message } from 'antd';
import type { MenuProps } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const NavBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const handleLogout = () => {
    logout();
    messageApi.success('Sesión cerrada correctamente');
    navigate('/'); // Redirigir al login
  };

  const items: MenuProps['items'] = [
    {
      label: (
        <div style={{ padding: '8px 12px', minWidth: 150 }}>
          <div style={{ fontWeight: 'bold' }}>{user?.nombre || 'Usuario'}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{user?.username}</div>
          <div style={{ fontSize: '11px', color: '#888' }}>Rol: {user?.role}</div>
        </div>
      ),
      key: 'user-info',
    },
    {
      type: 'divider',
    },
    {
      label: (
        <Link to="/dashboard/perfil">
          <Button type="text" icon={<UserOutlined />} style={{ width: '100%', textAlign: 'left' }}>
            Mi cuenta
          </Button>
        </Link>
      ),
      key: 'cuenta',
    },
    {
      type: 'divider',
    },
    {
      label: (
        <Button 
          type="text" 
          danger 
          icon={<LogoutOutlined />} 
          onClick={handleLogout}
          style={{ width: '100%', textAlign: 'left' }}
        >
          Cerrar sesión
        </Button>
      ),
      key: 'logout',
    },
  ];

  return (
    <>
      {contextHolder}
      <Row justify="end" align="middle" style={{ height: '100%' }}>
        <Col></Col>
        <Col style={{ textAlign: 'end' }}>
          <Dropdown 
            menu={{ items }} 
            trigger={['click']}
            placement="bottomRight"
          >
            <Button type="primary" icon={<UserOutlined />}>
              {user?.nombre || 'Usuario'}
            </Button>
          </Dropdown>
        </Col>
      </Row>
    </>
  );
};