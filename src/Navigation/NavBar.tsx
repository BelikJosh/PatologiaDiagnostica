// src/Navigation/NavBar.tsx
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Col, Dropdown, Row, message, Image, Typography, Space } from 'antd';
import type { MenuProps } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const { Text } = Typography;

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
      <Row justify="space-between" align="middle" style={{ height: '100%'}}>
        {/* Parte izquierda: Logo + Nombre */}
        <Col >
          <Space>
            <Image
              src="/assets/Logo.jpg"
              alt="Logo Patología Diagnóstica"
              preview={false}
              width={40}
              height={40}
              style={{
                borderRadius: '8px',
                objectFit: 'cover'
              }}
              fallback="https://via.placeholder.com/40x40/1890ff/ffffff?text=PD"
            />
            <Text strong style={{ fontSize: '16px', whiteSpace: 'nowrap' }}>
              Patología Diagnóstica de Aguascalientes
            </Text>
          </Space>
        </Col>

        {/* Parte central: Sistema de Control Interno */}
        <Col flex="auto" style={{ textAlign: 'center' }}>
          <Text strong style={{ fontSize: '20px', whiteSpace: 'nowrap' }}>
            Sistema de Control Interno
          </Text>
        </Col>

        {/* Parte derecha: Usuario */}
        <Col flex="none">
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