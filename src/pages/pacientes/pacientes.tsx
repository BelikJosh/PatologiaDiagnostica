/* eslint-disable no-mixed-spaces-and-tabs */
import { Button, Input, Table, message } from 'antd';
import { useEffect, useState } from 'react';
import { ColumnsType } from 'antd/es/table';
import { SearchOutlined } from '@ant-design/icons';
import { AnyObject } from 'antd/es/_util/type';
import { DrawerUI } from '../../components/drawer/DrawerUI';
import { PacienteForm } from './PacienteForm';
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

export const PacientesPage = () => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [openDrawer, setopenDrawer] = useState(false);
	const [pacientesData, setPacientesData] = useState([]);
	const [loadingPacientes, setLoadingPacientes] = useState(false);

	useEffect(() => {
		axios
			.get('http://localhost:8090/api/Patients/ObtenerPacientes', {
				headers: {
					Authorization: `Bearer ${window.sessionStorage.getItem('token')}`,
				},
			})
			.then((resp) => {
				console.log(resp);
				setPacientesData(resp.data.pacientes);
				return setLoadingPacientes(false);
			})
			.catch((err) => {
				message.error(
					`Error ${err.respond.status}, ${err.respond.data.mensaje}`
				);
				return setLoadingPacientes(false);
			});
		return setLoadingPacientes(false);
	}, [loadingPacientes]);

	const onNewRequest = () => {
		setopenDrawer(!openDrawer);
	};

	return (
		<>
			<h4>Pacientes</h4>
			<Button onClick={onNewRequest} type="primary">
				Nuevo Paciente
			</Button>
			<Table
				dataSource={pacientesData}
				columns={columns}
				rowKey="id"
				loading={loadingPacientes}
			/>
			<DrawerUI
				title="Registro de Paciente"
				open={openDrawer}
				setOpen={onNewRequest}
				size="default"
			>
				<PacienteForm />
			</DrawerUI>
		</>
	);
};
