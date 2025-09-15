// src/components/LoginForm.tsx
import React, { useState } from 'react';
import { Button, Form, Input, message, FormProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../../services/authService';


type FieldType = {
  User: string;
  Password: string;
};

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState<boolean>(false);
  const [form] = Form.useForm();

  const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
    setLoading(true);
    
    try {
      console.log('🔐 Intentando login con:', values);
      
      const result = await AuthService.login(values.User, values.Password);
      console.log('📋 Resultado login:', result);
      
      if (result.success && result.user) {
        sessionStorage.setItem('aws_token', result.user.token);
        sessionStorage.setItem('aws_user', JSON.stringify(result.user));
        
        messageApi.success('¡Login exitoso!');
        navigate('/dashboard');
      } else {
        messageApi.error(result.error || 'Error en el login');
      }
    } catch (error) {
      console.error('Error completo:', error);
      messageApi.error('Error de conexión con la base de datos');
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = (errorInfo) => {
    console.log('Failed:', errorInfo);
    messageApi.error('Por favor, completa todos los campos correctamente');
  };

  // Datos de prueba para desarrollo
 

  return (        
              <Form
                layout="vertical"
                form={form}
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
                autoComplete="off"
              >
                <Form.Item<FieldType>
                  name="User"
                  label="Usuario"
                  rules={[{ required: true, message: 'El usuario es requerido' }]}
                  validateTrigger="onBlur"
                >
                  <Input 
                    placeholder="Introduce tu usuario" 
                    size="large"
                    disabled={loading}
                  />
                </Form.Item>
                
                <Form.Item<FieldType>
                  name="Password"
                  label="Contraseña"
                  rules={[{ required: true, message: 'La contraseña es requerida' }]}
                  validateTrigger="onBlur"
                >
                  <Input.Password 
                    placeholder="Introduce tu contraseña" 
                    size="large"
                    disabled={loading}
                  />
                </Form.Item>
                
                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    size="large"
                    style={{ width: '100%' }}
                  >
                    {loading ? 'Conectando...' : 'Acceder'}
                  </Button>
                </Form.Item>
              </Form>
              
              
    
  );
};