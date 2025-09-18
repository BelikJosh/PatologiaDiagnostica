// src/components/empleados/EmpleadoForm.tsx
import { UploadOutlined } from '@ant-design/icons';
import { Button, DatePicker, Form, Input, Select, Space, Upload, message } from 'antd';
import { useState } from 'react';
import { EmpleadoService } from '../../services/empleadoService';
import dayjs from 'dayjs';

interface EmpleadoFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const EmpleadoForm = ({ onSuccess, onCancel }: EmpleadoFormProps) => {
  const [form] = Form.useForm();
  const [saveEmpleado, setSaveEmpleado] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

    const handleImageUpload = (file: File) => {
    setImageFile(file);
    return false; // Prevent automatic upload
  };

  // En el componente EmpleadoForm, modifica la función onSaveEmpleado
const onSaveEmpleado = async (formValues: any) => {
  setSaveEmpleado(true);
  
  try {
    if (formValues.Telefono && formValues.Telefono.length !== 10) {
      message.error('El teléfono debe tener exactamente 10 dígitos');
      setSaveEmpleado(false);
      return;
    }

    let imagenBase64 = '';
      if (imageFile) {
        try {
          imagenBase64 = await convertFileToBase64(imageFile);
        } catch (error) {
          console.error('Error converting image to base64:', error);
          message.warning('La imagen no pudo ser procesada, se guardará sin imagen');
        }
      }

 const valoresProcesados = {
        ...formValues,
        FechaNacimiento: formValues.FechaNacimiento 
          ? dayjs(formValues.FechaNacimiento).format('YYYY-MM-DD') 
          : '',
        Imagen: imagenBase64 // Enviamos la imagen como base64 o string vacío
      };

      console.log('📤 Datos a guardar:', { ...valoresProcesados, Imagen: imagenBase64 ? '[BASE64_IMAGE]' : '' });

    const result = await EmpleadoService.createEmpleado(valoresProcesados);
    
    console.log('📥 Resultado del guardado:', result);
    
    if (result.success) {
      message.success('Empleado guardado exitosamente');
      form.resetFields();
      setImageFile(null);
      onSuccess?.();
    } else {
      message.error(result.error || 'Error al guardar el empleado');
    }
  } catch (error) {
    console.error('Error:', error);
    message.error('Error al guardar el empleado');
  } finally {
    setSaveEmpleado(false);
  }
};
 const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  return (
    <>
      <Form
        layout="horizontal"
        labelCol={{ span: 10 }}
        wrapperCol={{ span: 24 }}
        onFinish={onSaveEmpleado}
        form={form}
      >
        <Form.Item
          label="Usuario"
          name="NombreUsuario"
          rules={[
            {
              required: true,
              message: 'El nombre de usuario es requerido',
            },
          ]}
        >
          <Input type="text" placeholder="Nombre de usuario de acceso" />
        </Form.Item>
        <Form.Item
          label="Contraseña"
          name="Password"
          rules={[
            {
              required: true,
              message: 'La contraseña es requerida',
            },
          ]}
        >
          <Input.Password placeholder="Contraseña de acceso" />
        </Form.Item>
        <Form.Item
          label="Nombre"
          name="Nombre"
          rules={[
            {
              required: true,
              message: 'El nombre es requerido',
            },
          ]}
        >
          <Input type="text" placeholder="Nombre(s) del Empleado" />
        </Form.Item>
        <Form.Item
          label="Primer apellido"
          name="ApellidoPat"
          rules={[
            { required: true, message: 'El primer apellido es requerido' },
          ]}
        >
          <Input type="text" placeholder="Primer apellido del Empleado" />
        </Form.Item>
        <Form.Item label="Segundo apellido" name="ApellidoMat">
          <Input type="text" placeholder="Segundo apellido del Empleado" />
        </Form.Item>
        <Form.Item
          label="Teléfono"
          name="Telefono"
          rules={[
            {
              pattern: /^\d{10}$/,
              required: true,
              message: 'El teléfono debe tener 10 dígitos',
            },
          ]}
        >
          <Input
            maxLength={10}
            placeholder="10 dígitos"
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item label="Correo" name="Email">
          <Input type="email" placeholder="Email del Empleado" />
        </Form.Item>
        <Form.Item label="Fecha de nac." name="FechaNacimiento">
          <DatePicker 
            style={{ width: '100%' }} 
            format="DD/MM/YYYY"
          />
        </Form.Item>
        <Form.Item label="Domicilio" name="Direccion">
          <Input.TextArea placeholder="Domicilio del Empleado" />
        </Form.Item>
        <Form.Item 
          label="Tipo de usuario" 
          name="IdTipoUsuario"
          rules={[{ required: true, message: 'Selecciona el tipo de usuario' }]}
        >
          <Select
            placeholder="Selecciona el tipo de usuario"
            options={[
              { value: 1, label: 'Super Admin' },
              { value: 2, label: 'Administrador' },
              { value: 3, label: 'Operador' },
            ]}
          />
        </Form.Item>
         <Form.Item label="Avatar" name="Imagen">
          <Upload
            beforeUpload={handleImageUpload}
            onRemove={() => setImageFile(null)}
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>Seleccionar una imagen</Button>
          </Upload>
        </Form.Item>
        
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={saveEmpleado}>
              Guardar
            </Button>
            {onCancel && (
              <Button onClick={onCancel}>
                Cancelar
              </Button>
            )}
          </Space>
        </Form.Item>
      </Form>
    </>
  );
};