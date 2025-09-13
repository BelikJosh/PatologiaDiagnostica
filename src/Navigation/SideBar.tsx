import {
	CopyOutlined,
	DashboardOutlined,
	DollarOutlined,
	EyeFilled,
	FileAddFilled,
	FolderFilled,
	TeamOutlined,
} from '@ant-design/icons';
import { Menu } from 'antd';
import type { MenuProps } from 'antd';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';

const MenuItems: MenuProps['items'] = [
	{
		label: <Link to="">Panel de Control</Link>,
		key: 'panel',
		icon: <DashboardOutlined />,
	},
	{
		label: 'Solicitudes',
		key: 'solicitudesSub',
		icon: <CopyOutlined />,
		children: [
			{
				label: <Link to="viewSolicitudes">Ver Solicitudes</Link>,
				key: 'viewSol',
				icon: <EyeFilled />,
			},
			{
				label: 'Agregar Solicitud',
				key: 'addSol',
				icon: <FileAddFilled />,
			},
			{
				label: 'Ver Solicitudes Anteriores',
				key: 'verSolAnt',
				icon: <FolderFilled />,
			},
		],
	},
	{
		label: <Link to="doctores">Doctores</Link>,
		key: 'doctores',
		icon: <Icon icon="fa6-solid:user-doctor" />,
	},
	{
		label: <Link to="pacientes">Pacientes</Link>,
		key: 'pacientes',
		icon: <TeamOutlined />,
	},
	{
		label: <Link to="cuentas">Cuentas</Link>,
		key: 'cuentas',
		icon: <DollarOutlined />,
	},
	{
		label: <Link to="empleados">Empleados</Link>,
		key: 'empleados',
		icon: <Icon icon="clarity:employee-solid" />,
	},
	{
		label: 'Administrar',
		key: 'admin',
		icon: <Icon icon="dashicons:admin-generic" />,
		children: [
			{
				label: <Link to="administrar/customUI">Apariencia</Link>,
				key: 'ui',
				icon: <Icon icon="healthicons:ui-preferences" />,
			},
		],
	},
];

export const SideBar = () => {
	return (
		<>
			<Menu
				items={MenuItems}
				mode="inline"
				style={{
					height: '100%',
				}}
			/>
		</>
	);
};
