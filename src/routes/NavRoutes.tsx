// src/routes/NavRoutes.tsx
import { Navigate, Route, Routes } from 'react-router-dom';
import { HomeDashboard } from '../pages/home/HomeDashboard';
import { Solicitudes } from '../pages/solicitudes/Solicitudes';
import CustomUI from '../pages/apariencia/CustomUI';
import { DoctoresPage } from '../pages/doctores/Doctores';
import { PacientesPage } from '../pages/pacientes/Pacientes';
import { CuentasPage} from '../pages/cuentas/cuentas'
import { EmpleadosPage } from '../pages/empleados/Empleados';
import { SolicitudesAnterioresPage } from '../pages/solicitudes/SolicitudesAnterioresPage';
import { SolicitudesEventos } from '../pages/solicitudes/SolicitudesEventos';

export const NavRoutes = () => {
	return (
		<Routes>
			<Route path="" element={<HomeDashboard />} />
			<Route path="viewSolicitudes" element={<Solicitudes/>} />
			{/* QUITA el "/" del inicio de estas rutas */}
			<Route path="solicitudes-anteriores" element={<SolicitudesAnterioresPage />} />
			<Route path="solicitudes-eventos/:id" element={<SolicitudesEventos />} />
			<Route path="doctores" element={<DoctoresPage />} />
			<Route path="pacientes" element={<PacientesPage />} />
			<Route path="cuentas" element={<CuentasPage />} />
			<Route path="empleados" element={<EmpleadosPage />} />
			<Route path="administrar/customUI" element={<CustomUI />} />
			<Route path="*" element={<Navigate to="/login" />} />
		</Routes>
	);
};