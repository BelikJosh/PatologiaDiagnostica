/* eslint-disable no-mixed-spaces-and-tabs */
import { Button, Input, Table, message } from 'antd';
import { useEffect, useState } from 'react';
import { ColumnsType } from 'antd/es/table';
import { SearchOutlined } from '@ant-design/icons';
import { AnyObject } from 'antd/es/_util/type';
import { DrawerUI } from '../../components/drawer/DrawerUI';
import { EmpleadoForm } from './EmpleadoForm';
import axios from 'axios';

const columns: ColumnsType<AnyObject> = [
	{
		title: 'ID',
		dataIndex: 'id',
		key: 'id',
		sorter: (a, b) => a.estatus.length - b.estatus.length,
		filterIcon: () => <SearchOutlined />,
		filterDropdown: () => (
			<div>
				<Input type="text" placeholder="Buscar ID" />
			</div>
		),
	},
	{
		title: 'Nombre',
		dataIndex: 'nombre',
		key: 'nombre',
		sorter: (a, b) => a.estatus.length - b.estatus.length,
	},
	{
		title: '1er. apellido',
		dataIndex: 'ApellidoPat',
		key: 'ApellidoPat',
		sorter: (a, b) => a.estatus.length - b.estatus.length,
	},
	{
		title: '2o. apellido',
		dataIndex: 'ApellidoMat',
		key: 'ApellidoMat',
		sorter: (a, b) => a.estatus.length - b.estatus.length,
	},
	{
		title: 'Fecha de nac.',
		dataIndex: 'FechaNacimiento',
		key: 'FechaNacimiento',
	},
	{
		title: 'Teléfono',
		dataIndex: 'Telefono',
		key: 'Telefono',
	},
	{
		title: 'Edad',
		dataIndex: '',
		key: 'estatus',
		sorter: (a, b) => a.estatus.length - b.estatus.length,
	},
];

export const EmpleadosPage = () => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [openDrawer, setopenDrawer] = useState(false);
	const [EmpleadosData, setEmpleadosData] = useState([]);
	const [loadingEmpleados, setLoadingEmpleados] = useState(false);

	useEffect(() => {
		axios
			.get('http://localhost:8090/api/Users/ObtenerUsuario', {
				headers: {
					Authorization: `Bearer ${window.sessionStorage.getItem('token')}`,
				},
			})
			.then((resp) => {
				console.log(resp);
				setEmpleadosData(resp.data.Empleados);
				return setLoadingEmpleados(false);
			})
			.catch((err) => {
				console.log(err);
				message.error(
					`Error ${err.response.status}, ${err.response.data.mensaje}`
				);
				return setLoadingEmpleados(false);
			});
		return setLoadingEmpleados(false);
	}, [loadingEmpleados]);

	const onNewRequest = () => {
		setopenDrawer(!openDrawer);
	};

	return (
		<>
			<h4>Empleados</h4>
			<Button onClick={onNewRequest} type="primary">
				Nuevo Empleado
			</Button>
			<Table
				dataSource={EmpleadosData}
				columns={columns}
				rowKey="id"
				loading={loadingEmpleados}
			/>
			<DrawerUI
				title="Registro de Empleado"
				open={openDrawer}
				setOpen={onNewRequest}
				size="default"
			>
				<EmpleadoForm />
			</DrawerUI>
		</>
	);
};
