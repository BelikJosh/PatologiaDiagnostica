// src/routes/MainRoutes.tsx
import { Route, Routes } from 'react-router-dom';
import { LayoutComponent } from '../Layout/Layout';
import { Login } from '../pages/login/Login';
import { DebugPage } from '../pages/debug/DebugPage'; // ✅ Importar DebugPage
import { SolicitudesEventos } from '../pages/solicitudes/SolicitudesEventos';

export const MainRoutes = () => (
  <Routes>
    <Route path="*" element={<Login />} />
    <Route path="/dashboard/*" element={<LayoutComponent />} />
    <Route path="/debug" element={<DebugPage />} /> {/* ✅ Ruta para debug */}
    <Route path="solicitudes-eventos/:id" element={<SolicitudesEventos />} /> {/* ← AÑADE ESTA LÍNEA */}
    
  </Routes>
);