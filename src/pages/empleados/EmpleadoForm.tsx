import { UploadOutlined } from '@ant-design/icons';
import { Button, DatePicker, Form, Input, Select, Upload } from 'antd';
import { AnyObject } from 'antd/es/_util/type';
import FormItem from 'antd/es/form/FormItem';
import TextArea from 'antd/es/input/TextArea';
import axios from 'axios';
import { useState } from 'react';

export const EmpleadoForm = () => {
	const [form] = Form.useForm();
	const [saveEmpleado, setsaveEmpleado] = useState(false);

	const onSaveEmpleado = (formValues: AnyObject) => {
		console.log('save Empleado', formValues);
		setsaveEmpleado(true);
		axios
			.post('http://localhost:8090/api/Users/RegistrarUsuario', formValues, {
				headers: {
					Authorization: `Bearer ${window.sessionStorage.getItem('token')}`,
				},
			})
			.then((resp) => {
				console.log('post respond');
				console.log(resp.data);
				form.resetFields();
				setsaveEmpleado(false);
			})
			.catch((err) => {
				console.log(err);
				setsaveEmpleado(false);
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
					<Input type="text" placeholder="Contraseña de acceso" />
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
							pattern: /\d{10}/g,
							required: true,
							message: 'El teléfono es requerido a 10 dígitos',
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
				<Form.Item label="Fecha de nac." name="FechaNacimiento" required>
					<DatePicker />
				</Form.Item>
				<Form.Item label="Domicilio" name="Direccion">
					<TextArea placeholder="Domicilio del Empleado" />
				</Form.Item>
				<Form.Item label="Tipo de usuario" name="IdTipoUsuario">
					<Select
						options={[
							{ value: 1, label: 'Super Admin' },
							{ value: 2, label: 'Administrador' },
							{ value: 3, label: 'Operador' },
						]}
					/>
				</Form.Item>
				<Form.Item label="Avatar" name="Imagen">
					<Upload>
						<Button icon={<UploadOutlined />}>Seleccionar una imagen</Button>
					</Upload>
				</Form.Item>
				<FormItem>
					<Button type="primary" htmlType="submit" loading={saveEmpleado}>
						Guardar
					</Button>
				</FormItem>
			</Form>
		</>
	);
};
