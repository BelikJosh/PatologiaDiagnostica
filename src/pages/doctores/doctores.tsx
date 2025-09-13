/* eslint-disable no-mixed-spaces-and-tabs */
import { Button, Input, Table, message } from 'antd';
import { useEffect, useState } from 'react';
import { ColumnsType } from 'antd/es/table';
import { SearchOutlined } from '@ant-design/icons';
import { AnyObject } from 'antd/es/_util/type';
import { DrawerUI } from '../../components/drawer/DrawerUI';
import { DoctorForm } from './DoctorForm';
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
		sorter: (a, b) => a.nombre.localeCompare(b.nombre),
	},
	{
		title: '1er. apellido',
		dataIndex: 'primerApellido',
		key: 'ApellidoPat',
		sorter: (a, b) => a.nombre.localeCompare(b.nombre),
	},
	{
		title: '2o. apellido',
		dataIndex: 'segundoApellido',
		key: 'ApellidoMat',
		sorter: (a, b) => a.nombre.localeCompare(b.nombre),
	},
	{
		title: 'Email',
		dataIndex: 'email',
		key: 'email',
	},
	{
		title: 'Teléfono',
		dataIndex: 'telefono',
		key: 'Telefono',
	},
	{
		title: 'Especialidad',
		dataIndex: 'especialidad',
		key: 'especialidad',
		sorter: (a, b) => a.estatus.length - b.estatus.length,
	},
];

export const DoctoresPage = () => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [openDrawer, setopenDrawer] = useState(false);
	const [doctoresData, setDoctoresData] = useState([]);
	const [loadingDoctores, setLoadingDoctores] = useState(false);

	useEffect(() => {
		axios
			.get('http://localhost:8090/api/Doctors/ObtenerMedicos', {
				headers: {
					Authorization: `Bearer ${window.sessionStorage.getItem('token')}`,
				},
			})
			.then((resp) => {
				console.log(resp);
				setDoctoresData(resp.data.medicos);
				return setLoadingDoctores(false);
			})
			.catch((err) => {
				message.error(
					`Error ${err.respond.status}, ${err.respond.data.mensaje}`
				);
				return setLoadingDoctores(false);
			});
		return setLoadingDoctores(false);
	}, [loadingDoctores]);

	const onNewRequest = () => {
		setopenDrawer(!openDrawer);
	};

	return (
		<>
			<h4>Doctores</h4>
			<Button onClick={onNewRequest} type="primary">
				Nuevo Doctor
			</Button>
			<Table
				dataSource={doctoresData}
				columns={columns}
				rowKey="id"
				loading={loadingDoctores}
			/>
			<DrawerUI
				title="Registro de Doctor"
				open={openDrawer}
				setOpen={onNewRequest}
				size="default"
			>
				<DoctorForm />
			</DrawerUI>
		</>
	);
};
