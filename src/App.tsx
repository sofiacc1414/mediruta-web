import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminShell } from './features/admin/AdminShell';
import { LandingPage } from './features/landing/pages/LandingPage';
import { ProtectedRoute } from './features/usuarios/components/ProtectedRoute';
import { AuthProvider } from './features/usuarios/hooks/AuthProvider';
import { LoginPage } from './features/usuarios/pages/LoginPage';
import { RecuperarContrasenaPage } from './features/usuarios/pages/RecuperarContrasenaPage';
import { RestablecerContrasenaPage } from './features/usuarios/pages/RestablecerContrasenaPage';

/** HU-01 — panel administrativo (solo ROOT/ADMINISTRADOR, ver AuthProvider).
 * "/" es pública (landing del producto — quiénes somos, descarga del APK,
 * acceso a "Iniciar sesión"); el panel en sí vive en "/admin", detrás de
 * ProtectedRoute — un solo contenedor navegable por tabs (`AdminShell`),
 * no rutas separadas por sección (ver comentario en `AdminShell.tsx`). */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/recuperar-contrasena" element={<RecuperarContrasenaPage />} />
          <Route path="/restablecer-contrasena" element={<RestablecerContrasenaPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminShell />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
