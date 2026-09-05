import type { ReactNode } from 'react';

export function PhoneMockup({ children }: { children: ReactNode }) {
  return (
    <div className="lp-phone-mockup">
      <div className="lp-phone-screen">
        <div className="lp-phone-notch" />
        <div className="lp-phone-content">{children}</div>
      </div>
    </div>
  );
}

export function TrackingScreen({ compact = false }: { compact?: boolean }) {
  return (
    <>
      <div className="lp-phone-header">
        <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#2F4156' }}>
          Pedido MR-000482
        </span>
        <span style={{
          fontSize: '0.6rem',
          fontWeight: 700,
          color: '#FFFEFF',
          background: '#567C8D',
          padding: '3px 10px',
          borderRadius: 999,
        }}>
          En camino
        </span>
      </div>
      <div className="lp-phone-map">
        <div className="lp-map-grid" />
        <div className="lp-map-route" />
        <div className="lp-map-pin pin-teal" />
        <div className="lp-map-pin pin-navy" />
        <div className="lp-map-pin pin-teal-light" />
      </div>
      {!compact && (
        <div className="lp-phone-sheet">
          <div className="lp-phone-sheet-icon">🛵</div>
          <div className="lp-phone-sheet-text">
            <strong>Está en camino a tu casa</strong>
            <span>Llegada estimada: 8 min</span>
          </div>
        </div>
      )}
    </>
  );
}

export function UploadScreen() {
  return (
    <div style={{ padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#2F4156' }}>
        Subir receta
      </span>
      <div style={{
        border: '2px dashed rgba(47,65,86,0.12)',
        borderRadius: 14,
        padding: '20px 12px',
        textAlign: 'center',
        background: 'rgba(86,124,141,0.04)',
      }}>
        <div style={{
          width: 44,
          height: 44,
          margin: '0 auto 10px',
          borderRadius: 12,
          background: 'var(--lp-teal)',
          display: 'grid',
          placeItems: 'center',
          fontSize: '1.2rem',
          color: 'var(--lp-white)',
        }}>
          📄
        </div>
        <span style={{ fontSize: '0.7rem', color: '#567C8D', fontWeight: 600 }}>
          receta_dra_gomez.jpg
        </span>
      </div>
      {['Farmacia de destino', 'Dirección de entrega'].map((campo) => (
        <div key={campo}>
          <div style={{ fontSize: '0.6rem', color: '#567C8D', marginBottom: 4 }}>{campo}</div>
          <div style={{
            height: 30,
            borderRadius: 10,
            background: 'rgba(47,65,86,0.04)',
            border: '1px solid rgba(47,65,86,0.08)',
          }} />
        </div>
      ))}
      <div style={{
        marginTop: 4,
        background: 'var(--lp-teal)',
        color: '#FFFEFF',
        textAlign: 'center',
        padding: '10px',
        borderRadius: 12,
        fontSize: '0.8rem',
        fontWeight: 700,
      }}>
        Continuar
      </div>
    </div>
  );
}

export function DeliveredScreen() {
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
      padding: '0 20px',
      textAlign: 'center',
    }}>
      <div style={{
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: 'var(--lp-teal)',
        display: 'grid',
        placeItems: 'center',
        fontSize: '1.6rem',
        color: 'var(--lp-white)',
        boxShadow: '0 8px 32px rgba(86,124,141,0.2)',
      }}>
        ✅
      </div>
      <span style={{ fontWeight: 700, color: '#2F4156', fontSize: '1rem' }}>
        Pedido entregado
      </span>
      <span style={{ fontSize: '0.7rem', color: '#567C8D', lineHeight: 1.5 }}>
        Confirmado con el código MR-000482 a las 4:12 p.m.
      </span>
      <div style={{
        border: '2px dashed rgba(47,65,86,0.12)',
        borderRadius: 12,
        padding: '8px 20px',
        fontFamily: "'Fraunces', serif",
        fontSize: '1rem',
        letterSpacing: '0.2em',
        color: '#2F4156',
        background: 'rgba(86,124,141,0.04)',
      }}>
        8V9W6D
      </div>
    </div>
  );
}