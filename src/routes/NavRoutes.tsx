import { Navigate, Route, Routes } from 'react-router-dom';
import { HomePage } from '../pages/home/HomePage';
import { SolicitudesPage } from '../pages/solicitudes/Solicitutes';
import CustomUI from '../pages/apariencia/CustomUI';
import { DoctoresPage } from '../pages/doctores/Doctores';
import { PacientesPage } from '../pages/pacientes/Pacientes';
import { CuentasPage } from '../pages/cuentas/Cuentas';
import { EmpleadosPage } from '../pages/empleados/Empleados';

export const NavRoutes = () => {
	return (
		<Routes>
			<Route path="" element={<HomePage />} />
			<Route path="viewSolicitudes" element={<SolicitudesPage />} />
			<Route path="doctores" element={<DoctoresPage />} />
			<Route path="pacientes" element={<PacientesPage />} />
			<Route path="cuentas" element={<CuentasPage />} />
			<Route path="empleados" element={<EmpleadosPage />} />
			<Route path="administrar/customUI" element={<CustomUI />} />
			<Route path="*" element={<Navigate to="/login" />} />
		</Routes>
	);
};
