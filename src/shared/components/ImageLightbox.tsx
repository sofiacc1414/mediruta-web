import { useEffect } from 'react';
import { CloseIcon } from './icons';

type Props = {
  url: string;
  label: string;
  onClose: () => void;
};

/**
 * Visor a pantalla completa para una foto de documento (cédula, licencia,
 * SOAT, tecnomecánica, ...) — la miniatura de 44px de la lista no alcanza
 * para que el administrador revise un documento real antes de aprobar o
 * rechazar. Mismo criterio que `app_image_viewer.dart` del lado de la App
 * (Flutter): sin librería nueva, solo un overlay con la imagen a su
 * tamaño natural (limitado al viewport) — acá no hace falta zoom/pan como
 * en mobile, ya hay suficiente espacio de pantalla en desktop.
 */
export function ImageLightbox({ url, label, onClose }: Props) {
  useEffect(() => {
    function onKeyDown(evento: KeyboardEvent) {
      if (evento.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20, 25, 33, 0.85)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-4)',
        padding: 'var(--space-6)',
        zIndex: 1000,
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        style={{
          position: 'absolute',
          top: 'var(--space-4)',
          right: 'var(--space-4)',
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: 'none',
          background: 'var(--color-white)',
          color: 'var(--color-navy)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 8,
        }}
      >
        <CloseIcon />
      </button>
      <img
        src={url}
        alt={label}
        // Sin esto, tocar la imagen (para acercarla en el zoom nativo del
        // navegador, por ejemplo) cierra el visor por el onClick del fondo.
        onClick={(evento) => evento.stopPropagation()}
        style={{
          maxWidth: '100%',
          maxHeight: 'calc(100% - 3rem)',
          borderRadius: 12,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          objectFit: 'contain',
        }}
      />
      <span style={{ color: 'var(--color-white)', fontWeight: 600 }}>{label}</span>
    </div>
  );
}
