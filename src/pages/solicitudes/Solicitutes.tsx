/* eslint-disable no-mixed-spaces-and-tabs */
import { Button, Input, Table } from 'antd';
import { useEffect, useState } from 'react';
import { ColumnsType } from 'antd/es/table';
import { SearchOutlined } from '@ant-design/icons';
import { AnyObject } from 'antd/es/_util/type';
import { DrawerUI } from '../../components/drawer/DrawerUI';
// import { useFetch } from '../../hooks/useFetch';
import { SolicitudForm } from './SolicitudForm';
import { PacienteForm } from '../pacientes/PacienteForm';
import { DoctorForm } from '../doctores/DoctorForm';
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
		title: 'Paciente ID',
		dataIndex: 'pacienteId',
		key: 'pacienteId',
	},
	{
		title: 'Fecha de Recepción',
		dataIndex: 'fechaRecepcion',
		key: 'fechaRecepcion',
	},
	{
		title: 'Tipo Estudio',
		dataIndex: 'tipoEstudio',
		key: 'tipoEstudio',
	},
	{
		title: 'Procedencia',
		dataIndex: 'procedencia',
		key: 'procedencia',
	},
	{
		title: 'Estatus',
		dataIndex: 'estatus',
		key: 'estatus',
		sorter: (a, b) => a.estatus.length - b.estatus.length,
	},
];

export const SolicitudesPage = () => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [openDrawer, setopenDrawer] = useState(false);
	const [openDrawerPatientForm, setopenDrawerPatientForm] = useState(false);
	const [openDrawerDoctorForm, setopenDrawerDoctorForm] = useState(false);

	const [solicitudesData, setSolicitudesData] = useState([]);

	useEffect(() => {
		console.log(window.sessionStorage.getItem('token')?.replace('"', ''));
		axios
			.get('http://localhost:8090/api/Applications/ObtenerSolicitudes', {
				headers: {
					Authorization: `Bearer ${window.sessionStorage.getItem('token')}`,
				},
			})
			.then((resp) => {
				setSolicitudesData(resp.data.solicitudes);
				console.log('axios.get', resp);
			})
			.catch((err) => {
				console.log('axios.err', err);
			});
	}, []);

	const onNewRequest = () => {
		setopenDrawer(!openDrawer);
	};

	const onNewPatient = () => {
		setopenDrawerPatientForm(!openDrawerPatientForm);
	};
	const onNewDoctor = () => {
		setopenDrawerDoctorForm(!openDrawerDoctorForm);
	};

	return (
		<>
			<h4>Solicitudes de Estudio</h4>
			<Button onClick={onNewRequest} type="primary">
				Nueva Solicitud
			</Button>
			<Table dataSource={solicitudesData} columns={columns} rowKey="id" />
			<DrawerUI
				title="Solicitud de Estudio"
				open={openDrawer}
				setOpen={onNewRequest}
				size="large"
			>
				<SolicitudForm onNewPatient={onNewPatient} onNewDoctor={onNewDoctor} />
			</DrawerUI>
			<DrawerUI
				title="Registro de paciente"
				open={openDrawerPatientForm}
				setOpen={onNewPatient}
				size="default"
			>
				<PacienteForm />
			</DrawerUI>
			<DrawerUI
				title="Registro de médico"
				open={openDrawerDoctorForm}
				setOpen={onNewDoctor}
				size="default"
			>
				<DoctorForm />
			</DrawerUI>
		</>
	);
};
