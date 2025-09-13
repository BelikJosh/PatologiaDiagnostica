import { Button, Form, Input } from 'antd';
import FormItem from 'antd/es/form/FormItem';
import TextArea from 'antd/es/input/TextArea';
import axios from 'axios';
import { useState } from 'react';

export const DoctorForm = () => {
	const [saveDoctor, setsaveDoctor] = useState(false);
	const [form] = Form.useForm();

	const onSaveDoctor = () => {
		axios
			.post(
				'http://localhost:8090/api/Doctors/AgregarMedico',
				form.getFieldsValue(true),
				{
					headers: {
						Authorization: `Bearer ${window.sessionStorage.getItem('token')}`,
					},
				}
			)
			.then((resp) => {
				console.log(resp.data);
				form.resetFields();
				setsaveDoctor(false);
			})
			.catch((err) => {
				console.log(err);
			});
	};

	return (
		<>
			<Form
				layout="horizontal"
				labelCol={{ span: 10 }}
				wrapperCol={{ span: 24 }}
				form={form}
				onFinish={onSaveDoctor}
			>
				<Form.Item
					label="Nombre"
					name="nombre"
					rules={[
						{
							required: true,
							message: 'El nombre es requerido',
						},
					]}
				>
					<Input type="text" placeholder="Nombre(s) del médico" />
				</Form.Item>
				<Form.Item
					label="Primer apellido"
					name="primerApellido"
					rules={[
						{ required: true, message: 'El primer apellido es requerido' },
					]}
				>
					<Input type="text" placeholder="Primer apellido del médico" />
				</Form.Item>
				<Form.Item label="Segundo apellido" name="segundoApellido">
					<Input type="text" placeholder="Segundo apellido del médico" />
				</Form.Item>
				<Form.Item
					label="Teléfono"
					name="telefono"
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
				<Form.Item label="Correo" name="email">
					<Input type="email" />
				</Form.Item>
				<Form.Item label="Especialidad" name="especialidad">
					<Input placeholder="Especialidad del médico" />
				</Form.Item>
				<Form.Item label="Domicilio" name="Direccion">
					<TextArea />
				</Form.Item>
				<FormItem>
					<Button type="primary" htmlType="submit" loading={saveDoctor}>
						Guardar
					</Button>
				</FormItem>
			</Form>
		</>
	);
};
