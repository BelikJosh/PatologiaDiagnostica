// src/components/solicitudes/Modals/ModalEstudioMicroscopico.tsx
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
  Divider,
  Select,
  Tabs
} from 'antd';
import { UploadOutlined, InboxOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;
const { Dragger } = Upload;
const { TabPane } = Tabs;

interface ModalEstudioMicroscopicoProps {
  visible: boolean;
  onCancel: () => void;
  onSave: (data: any) => Promise<void>;
  solicitudId: string;
}

export const ModalEstudioMicroscopico: React.FC<ModalEstudioMicroscopicoProps> = ({
  visible,
  onCancel,
  onSave,
  solicitudId
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [requiereFirma, setRequiereFirma] = useState(false);
  const [esMaligno, setEsMaligno] = useState(false);
  const [archivos, setArchivos] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('descripciones');

  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      const formData = {
        ...values,
        archivos,
        solicitudId,
        requiereFirma,
        esMaligno
      };
      
      await onSave(formData);
      message.success('Estudio microscópico guardado correctamente');
      form.resetFields();
      setArchivos([]);
    } catch (error) {
      console.error('Error guardando estudio microscópico:', error);
      message.error('Error al guardar el estudio microscópico');
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    multiple: true,
    beforeUpload: (file: File) => {
      setArchivos(prev => [...prev, file]);
      return false;
    },
    onRemove: (file: any) => {
      setArchivos(prev => prev.filter(f => f.uid !== file.uid));
    },
    fileList: archivos,
  };

  return (
    <Modal
      title="ESTUDIO MICROSCÓPICO"
      open={visible}
      onCancel={onCancel}
      width={900}
      style={{ top: 20 }}
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
          Guardar y Finalizar
        </Button>
      ]}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        {/* Pestaña 1: Descripciones */}
        <TabPane tab="Descripciones" key="descripciones">
          <Form form={form} layout="vertical">
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

            <Form.Item
              name="borrador"
              label="Seleccionar borrador"
            >
              <Select placeholder="Seleccione un borrador">
                <Select.Option value="borrador1">Borrador estándar</Select.Option>
                <Select.Option value="borrador2">Borrador especial</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="tipoEstudio"
              label="Seleccionar estudio"
            >
              <Select placeholder="Seleccione el tipo de estudio">
                <Select.Option value="biopsia">Biopsia</Select.Option>
                <Select.Option value="citologia">Citología</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="descripcionMicroscopica"
              label="Descripción Microscópica"
            >
              <TextArea
                rows={6}
                placeholder="Descripción detallada del estudio microscópico..."
                showCount
                maxLength={4000}
              />
            </Form.Item>
          </Form>
        </TabPane>

        {/* Pestaña 2: Diagnóstico */}
        <TabPane tab="Diagnóstico" key="diagnostico">
          <Form form={form} layout="vertical">
            <Form.Item
              name="esMaligno"
              label="¿Es maligno?"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="SI"
                unCheckedChildren="NO"
                onChange={setEsMaligno}
              />
            </Form.Item>

            <Form.Item
              name="diagnostico"
              label="Diagnóstico"
              rules={[{ required: true, message: 'El diagnóstico es requerido' }]}
            >
              <TextArea
                rows={8}
                placeholder="Escriba el diagnóstico completo..."
                showCount
                maxLength={5000}
              />
            </Form.Item>
          </Form>
        </TabPane>

        {/* Pestaña 3: Imágenes */}
        <TabPane tab="Imágenes" key="imagenes">
          <Form layout="vertical">
            <Form.Item
              label="Imágenes del estudio"
              extra="Puede subir múltiples imágenes del estudio microscópico"
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

            {archivos.length > 0 && (
              <Text type="secondary">
                {archivos.length} archivo(s) seleccionado(s)
              </Text>
            )}
          </Form>
        </TabPane>
      </Tabs>
    </Modal>
  );
};