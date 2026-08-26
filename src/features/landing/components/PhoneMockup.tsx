import type { ReactNode } from 'react';

/**
 * Marco de teléfono dibujado 100% en CSS (sin imágenes/fotos de stock,
 * a pedido explícito) — recibe la pantalla como children. Se reusa en
 * el hero y en la sección de producto con distinto contenido cada vez.
 */
export function PhoneMockup({ children }: { children: ReactNode }) {
  return (
    <div className="lp-phone">
      <div className="lp-phone-notch" />
      <div className="lp-phone-screen">{children}</div>
    </div>
  );
}

/** Pantalla "pedido en curso": mapa simplificado con farmacia → domiciliario → paciente. */
export function TrackingScreen({ compact = false }: { compact?: boolean }) {
  return (
    <>
      <div className="lp-phone-topbar">
        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-navy)' }}>
          Pedido MR-000482
        </span>
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            color: 'var(--color-white)',
            background: 'var(--color-teal)',
            padding: '4px 9px',
            borderRadius: 999,
          }}
        >
          En camino
        </span>
      </div>
      <div className="lp-phone-map">
        <svg className="lp-map-route" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path
            d="M24 22 C 40 30, 46 42, 46 46 S 58 60, 70 66"
            fill="none"
            stroke="var(--color-teal)"
            strokeWidth="1.6"
            strokeDasharray="1 4"
            strokeLinecap="round"
          />
        </svg>
        <span className="lp-map-pin pharmacy">
          <span />
        </span>
        <span className="lp-map-rider" />
        <span className="lp-map-pin patient">
          <span />
        </span>
      </div>
      {compact ? null : (
        <div className="lp-phone-sheet">
          <div style={{ fontSize: '0.72rem', color: 'var(--color-teal)', fontWeight: 600 }}>
            TU DOMICILIARIO
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 4,
            }}
          >
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-navy)' }}>
              Está en camino a tu casa
            </span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-navy)' }}>
              8 min
            </span>
          </div>
        </div>
      )}
    </>
  );
}

/** Pantalla "cargar receta". */
export function UploadScreen() {
  return (
    <div style={{ padding: '26px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-navy)' }}>
        Subir receta
      </span>
      <div
        style={{
          border: '1.5px dashed var(--lp-navy-line)',
          borderRadius: 14,
          padding: '24px 12px',
          textAlign: 'center',
          background: 'var(--color-beige)',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            margin: '0 auto 10px',
            borderRadius: 10,
            background: 'var(--color-white)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-navy)" strokeWidth="1.8">
            <path d="M6 3h8l4 4v14H6z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 3v4h4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-teal)', fontWeight: 600 }}>
          receta_dra_gomez.jpg
        </span>
      </div>
      {['Farmacia de destino', 'Dirección de entrega'].map((campo) => (
        <div key={campo}>
          <div style={{ fontSize: '0.68rem', color: 'var(--color-teal)', marginBottom: 4 }}>{campo}</div>
          <div
            style={{
              height: 32,
              borderRadius: 9,
              background: 'var(--color-beige)',
              border: '1px solid var(--lp-navy-line)',
            }}
          />
        </div>
      ))}
      <div
        style={{
          marginTop: 4,
          background: 'var(--color-navy)',
          color: 'var(--color-white)',
          textAlign: 'center',
          padding: '10px',
          borderRadius: 10,
          fontSize: '0.82rem',
          fontWeight: 700,
        }}
      >
        Continuar
      </div>
    </div>
  );
}

/** Pantalla "entrega confirmada". */
export function DeliveredScreen() {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: '0 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'var(--color-navy)',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--color-white)" strokeWidth="2">
          <path d="m5 12 5 5 9-10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span style={{ fontWeight: 700, color: 'var(--color-navy)' }}>Pedido entregado</span>
      <span style={{ fontSize: '0.78rem', color: 'var(--color-teal)', lineHeight: 1.5 }}>
        Confirmado con el código MR-000482 a las 4:12 p.m.
      </span>
      <div
        style={{
          border: '1px dashed var(--lp-navy-line)',
          borderRadius: 10,
          padding: '8px 18px',
          fontFamily: 'var(--lp-heading)',
          fontSize: '1.1rem',
          letterSpacing: '0.2em',
          color: 'var(--color-navy)',
        }}
      >
        8V9W6D
      </div>
    </div>
  );
}
