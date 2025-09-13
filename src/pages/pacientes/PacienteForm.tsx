import { Button, DatePicker, Form, Input, Select } from 'antd';
import FormItem from 'antd/es/form/FormItem';
import TextArea from 'antd/es/input/TextArea';
import axios from 'axios';
import { useState } from 'react';

export const PacienteForm = () => {
	const [form] = Form.useForm();
	const [savePaciente, setsavePaciente] = useState(false);

	const onSavePaciente = () => {
		console.log('save paciente');
		setsavePaciente(true);
		axios
			.post(
				'http://localhost:8090/api/Patients/AgregarPaciente',
				form.getFieldsValue(true),
				{
					headers: {
						Authorization: `Bearer ${window.sessionStorage.getItem('token')}`,
					},
				}
			)
			.then((resp) => {
				console.log('post respond');
				console.log(resp.data);
				form.resetFields();
				setsavePaciente(false);
			})
			.catch((err) => {
				console.log(err);
				setsavePaciente(false);
			});
	};

	return (
		<>
			<Form
				layout="horizontal"
				labelCol={{ span: 10 }}
				wrapperCol={{ span: 24 }}
				onFinish={onSavePaciente}
				form={form}
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
					<Input type="text" placeholder="Nombre(s) del paciente" />
				</Form.Item>
				<Form.Item
					label="Primer apellido"
					name="apellidoPat"
					rules={[
						{ required: true, message: 'El primer apellido es requerido' },
					]}
				>
					<Input type="text" placeholder="Primer apellido del paciente" />
				</Form.Item>
				<Form.Item label="Segundo apellido" name="apellidoMat">
					<Input type="text" placeholder="Segundo apellido del paciente" />
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
				<Form.Item label="Fecha de nac." name="fechaNacimiento" required>
					<DatePicker />
				</Form.Item>
				<Form.Item label="Domicilio" name="direccion">
					<TextArea />
				</Form.Item>
				<Form.Item label="Sexo" name="sexo">
					<Select
						options={[
							{ value: 'M', label: 'Masculino' },
							{ value: 'F', label: 'Femenino' },
						]}
					/>
				</Form.Item>
				<FormItem>
					<Button type="primary" htmlType="submit" loading={savePaciente}>
						Guardar
					</Button>
				</FormItem>
			</Form>
		</>
	);
};
