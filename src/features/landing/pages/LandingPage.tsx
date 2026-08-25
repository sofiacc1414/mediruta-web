import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/components/Button';
import { IconBadge } from '../../../shared/components/IconBadge';
import {
  CheckCircleIcon,
  DocumentIcon,
  DownloadIcon,
  MopedIcon,
  PinIcon,
  ShieldIcon,
} from '../../../shared/components/icons';

/**
 * Página pública de MediRuta — presentación del producto, descarga del
 * APK y acceso al panel de Administrador. Es la nueva raíz ("/"): el
 * panel administrativo (antes en "/") se movió a "/admin" (ver App.tsx)
 * para que "/" pueda ser público sin pasar por ProtectedRoute.
 *
 * URL del release del APK: se actualiza a mano acá cada vez que se
 * publica una versión nueva (`gh release create` en mediruta-app).
 */
const APK_DOWNLOAD_URL =
  'https://github.com/sofiacc1414/mediruta-app/releases/download/v1.0.0/mediruta.apk';

const FEATURES = [
  {
    icon: <DocumentIcon />,
    titulo: 'Pedí tus medicamentos',
    texto:
      'Cargá tu receta médica, elegí la farmacia y la dirección de entrega — MediRuta arma el pedido en minutos.',
  },
  {
    icon: <MopedIcon />,
    titulo: 'Domiciliario más cercano',
    texto:
      'El pedido se asigna automáticamente al domiciliario disponible más cercano a la farmacia, sin intervención manual.',
  },
  {
    icon: <PinIcon />,
    titulo: 'Seguimiento en tiempo real',
    texto:
      'Ocho estados, desde "pedido generado" hasta "entregado" — siempre sabés en qué paso está tu pedido.',
  },
  {
    icon: <ShieldIcon />,
    titulo: 'Entrega verificada',
    texto:
      'Un código único de 6 caracteres confirma que el pedido llegó a la persona correcta, no a cualquiera.',
  },
];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-4) var(--space-6)',
          maxWidth: 1100,
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
      >
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--color-navy)' }}>
          MediRuta
        </span>
        <Button
          variante="secondary"
          style={{ width: 'auto', padding: '10px 28px' }}
          onClick={() => navigate('/login')}
        >
          Iniciar sesión
        </Button>
      </header>

      <main style={{ flex: 1 }}>
        {/* Hero */}
        <section
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: 'var(--space-8) var(--space-6) var(--space-12)',
            display: 'grid',
            gap: 'var(--space-8)',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            alignItems: 'center',
          }}
        >
          <div>
            <h1 style={{ fontSize: '2.75rem', lineHeight: 1.15, marginBottom: 'var(--space-4)' }}>
              Tus medicamentos, contigo y a tiempo
            </h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--color-teal)', marginBottom: 'var(--space-6)' }}>
              MediRuta conecta a pacientes que necesitan sus medicamentos con domiciliarios que los
              recogen en la farmacia y se los llevan hasta la puerta — entregas seguras, rápidas y
              con seguimiento en cada paso.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <a href="#descargar" style={{ textDecoration: 'none' }}>
                <Button style={{ width: 'auto', padding: '14px 32px' }}>
                  Descargar la app
                </Button>
              </a>
              <Button
                variante="secondary"
                style={{ width: 'auto', padding: '14px 32px' }}
                onClick={() => navigate('/login')}
              >
                Soy Administrador
              </Button>
            </div>
          </div>
          <div
            style={{
              background: 'var(--color-navy)',
              borderRadius: 32,
              padding: 'var(--space-12) var(--space-8)',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <IconBadge icon={<MopedIcon />} size={160} background="var(--color-sky-blue)" />
          </div>
        </section>

        {/* Quiénes somos */}
        <section
          style={{
            background: 'var(--color-white)',
            padding: 'var(--space-12) var(--space-6)',
          }}
        >
          <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2rem' }}>Quiénes somos</h2>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.6 }}>
              Somos un equipo enfocado en resolver un problema cotidiano: conseguir medicamentos no
              debería depender de hacer fila ni de encontrar movilidad. MediRuta digitaliza todo el
              proceso — desde que el paciente sube su receta hasta que el domiciliario confirma la
              entrega — para que pedir un medicamento sea tan simple como pedir cualquier otra cosa.
            </p>
          </div>
        </section>

        {/* Qué hace la app */}
        <section
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: 'var(--space-12) var(--space-6)',
          }}
        >
          <h2 style={{ fontSize: '2rem', textAlign: 'center', marginBottom: 'var(--space-8)' }}>
            Qué hace MediRuta
          </h2>
          <div
            style={{
              display: 'grid',
              gap: 'var(--space-6)',
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            }}
          >
            {FEATURES.map((f) => (
              <div
                key={f.titulo}
                style={{
                  background: 'var(--color-beige)',
                  borderRadius: 24,
                  padding: 'var(--space-6)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                }}
              >
                <IconBadge icon={f.icon} size={56} />
                <h3 style={{ fontSize: '1.15rem', textAlign: 'center' }}>{f.titulo}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-teal)', textAlign: 'center' }}>
                  {f.texto}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Descargar */}
        <section
          id="descargar"
          style={{
            background: 'var(--color-navy)',
            padding: 'var(--space-12) var(--space-6)',
          }}
        >
          <div
            style={{
              maxWidth: 640,
              margin: '0 auto',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-4)',
            }}
          >
            <IconBadge icon={<DownloadIcon />} background="var(--color-sky-blue)" />
            <h2 style={{ color: 'var(--color-white)', fontSize: '2rem' }}>Descargá la app</h2>
            <p style={{ color: 'var(--color-sky-blue)', fontSize: '1.05rem' }}>
              Disponible para Android. Instalala como Paciente para pedir tus medicamentos, o como
              Domiciliario para empezar a hacer entregas.
            </p>
            <a href={APK_DOWNLOAD_URL} style={{ textDecoration: 'none' }}>
              <Button
                style={{
                  width: 'auto',
                  padding: '16px 40px',
                  background: 'var(--color-white)',
                  color: 'var(--color-navy)',
                  border: '1.5px solid var(--color-white)',
                }}
              >
                Descargar APK
              </Button>
            </a>
            <p style={{ color: 'var(--color-sky-blue)', fontSize: '0.8rem' }}>
              Archivo .apk (~52 MB) — Android te va a pedir permitir "orígenes desconocidos" para
              instalarlo, es normal al no venir de Play Store.
            </p>
          </div>
        </section>
      </main>

      <footer
        style={{
          padding: 'var(--space-6)',
          textAlign: 'center',
          color: 'var(--color-teal)',
          fontSize: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <span style={{ width: 16, height: 16, display: 'inline-flex' }}>
            <CheckCircleIcon />
          </span>
          MediRuta — entregas de medicamentos, simples y a tiempo.
        </div>
      </footer>
    </div>
  );
}
