// src/components/solicitudes/Modals/ModalEstudioMacroscopico.tsx
import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Switch,
  Upload,
  Button,
  message,
  Space,
  Typography,
  Row,
  Col,
  Divider
} from 'antd';
import { UploadOutlined, InboxOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;
const { Dragger } = Upload;

interface ModalEstudioMacroscopicoProps {
  visible: boolean;
  onCancel: () => void;
  onSave: (data: any) => Promise<void>;
  solicitudId: string;
}

export const ModalEstudioMacroscopico: React.FC<ModalEstudioMacroscopicoProps> = ({
  visible,
  onCancel,
  onSave,
  solicitudId
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [requiereFirma, setRequiereFirma] = useState(false);
  const [archivos, setArchivos] = useState<any[]>([]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      // Agregar archivos al formulario
      const formData = {
        ...values,
        archivos,
        solicitudId,
        requiereFirma
      };
      
      await onSave(formData);
      message.success('Estudio macroscópico guardado correctamente');
      form.resetFields();
      setArchivos([]);
    } catch (error) {
      console.error('Error guardando estudio macroscópico:', error);
      message.error('Error al guardar el estudio macroscópico');
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    multiple: true,
    beforeUpload: (file: File) => {
      setArchivos(prev => [...prev, file]);
      return false; // Prevent automatic upload
    },
    onRemove: (file: any) => {
      setArchivos(prev => prev.filter(f => f.uid !== file.uid));
    },
    fileList: archivos,
  };

  return (
    <Modal
      title="ESTUDIO MACROSCÓPICO"
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancelar
        </Button>,
        <Button 
          key="save" 
          type="primary" 
          loading={loading}
          onClick={handleSave}
        >
          Guardar Estudio
        </Button>
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ requiereFirma: false }}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="requiereFirma"
              label="Requiere firma digital"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="SI"
                unCheckedChildren="NO"
                onChange={setRequiereFirma}
              />
            </Form.Item>
            <Text type="secondary">
              {requiereFirma 
                ? 'El estudio llevará firma digital' 
                : 'El estudio llevará firma autógrafa'
              }
            </Text>
          </Col>
        </Row>

        <Divider />

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="descripcionMacroscopica"
              label="Descripción Macroscópica"
              rules={[
                { required: true, message: 'Por favor ingrese la descripción macroscópica' }
              ]}
            >
              <TextArea
                rows={6}
                placeholder="Describa la muestra recibida: tamaño, forma, color, peso, características relevantes..."
                showCount
                maxLength={2000}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Fotografías de la Muestra"
              extra="Puede subir múltiples imágenes de la muestra"
            >
              <Dragger {...uploadProps}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">
                  Haga clic o arrastre las imágenes aquí para subirlas
                </p>
                <p className="ant-upload-hint">
                  Formatos soportados: JPG, PNG, BMP. Tamaño máximo: 10MB por imagen.
                </p>
              </Dragger>
            </Form.Item>
          </Col>
        </Row>

        {archivos.length > 0 && (
          <Row gutter={16}>
            <Col span={24}>
              <Text type="secondary">
                {archivos.length} archivo(s) seleccionado(s)
              </Text>
            </Col>
          </Row>
        )}
      </Form>
    </Modal>
  );
};