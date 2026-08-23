import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DomiciliarioDetallePage } from './features/domiciliarios/pages/DomiciliarioDetallePage';
import { DomiciliariosPendientesPage } from './features/domiciliarios/pages/DomiciliariosPendientesPage';
import { ProtectedRoute } from './features/usuarios/components/ProtectedRoute';
import { AuthProvider } from './features/usuarios/hooks/AuthProvider';
import { CambiarContrasenaPage } from './features/usuarios/pages/CambiarContrasenaPage';
import { LoginPage } from './features/usuarios/pages/LoginPage';
import { PanelPage } from './features/usuarios/pages/PanelPage';
import { RecuperarContrasenaPage } from './features/usuarios/pages/RecuperarContrasenaPage';
import { RestablecerContrasenaPage } from './features/usuarios/pages/RestablecerContrasenaPage';

/** HU-01 — panel administrativo (solo ROOT/ADMINISTRADOR, ver AuthProvider).
 * Reemplaza el placeholder de infraestructura por las rutas reales. */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/recuperar-contrasena" element={<RecuperarContrasenaPage />} />
          <Route path="/restablecer-contrasena" element={<RestablecerContrasenaPage />} />
          <Route
            path="/cambiar-contrasena"
            element={
              <ProtectedRoute>
                <CambiarContrasenaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <PanelPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/domiciliarios"
            element={
              <ProtectedRoute>
                <DomiciliariosPendientesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/domiciliarios/:id"
            element={
              <ProtectedRoute>
                <DomiciliarioDetallePage />
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
