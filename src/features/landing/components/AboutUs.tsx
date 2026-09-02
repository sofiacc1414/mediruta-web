import { useRef, useEffect, useState } from 'react';
import { Reveal, RevealLeft, RevealRight } from './Reveal';

export function AboutUs() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;

    // 1. FORZAR SILENCIO SIEMPRE
    if (video) {
      video.muted = true; // 🔇 SIN SONIDO SIEMPRE
      video.defaultMuted = true; // Refuerzo para algunos navegadores
      video.volume = 0; // Volumen al mínimo absoluto
    }

    // 2. OBSERVADOR PARA REPRODUCIR CUANDO LA SECCIÓN ENTRE EN VISTA
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasPlayed) {
            const playPromise = video?.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  setHasPlayed(true);
                  console.log('✅ Video reproduciendo (muted)');
                })
                .catch((error) => {
                  console.log('⚠️ Error al reproducir (muted):', error.name);
                });
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    // 3. INTENTAR REPRODUCIR TAMBIÉN AL CARGAR LA PÁGINA (por si ya está en vista)
    setTimeout(() => {
      video?.play().catch(() => {});
    }, 1000);

    if (video) {
      observer.observe(video);
    }

    return () => {
      if (video) {
        observer.unobserve(video);
      }
    };
  }, [hasPlayed, videoError]);

  const handleVideoError = () => {
    setVideoError(true);
    console.error('❌ Error cargando el video');
  };

  return (
    <section className="lp-section lp-about-premium" id="quienes-somos">
      
      <div className="lp-about-video-side">
        {videoError ? (
          <div className="lp-about-video-fallback">
            <span>🎬</span>
            <p>Video no disponible</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            className="lp-about-video-side-element"
            src="/videos/domiciliario-moto.mp4"
            muted={true}           // 🔇 SIN SONIDO
            playsInline
            autoPlay              // Inicia automáticamente
            preload="auto"
            controls={false}      // Sin controles para que se quede quieto
            onError={handleVideoError}
            onEnded={() => {
              // >>> AL TERMINAR, SE QUEDA CONGELADO EN EL ÚLTIMO FOTOGRAMA <<<
              if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.currentTime = videoRef.current.duration; // Fuerza al último frame
                videoRef.current.style.opacity = '1'; // Mantiene opacidad completa
              }
            }}
          />
        )}
        <div className="lp-about-video-side-overlay" />
      </div>

      {/* ===== RESTO DEL CONTENIDO ===== */}
      <div className="lp-container">
        <Reveal>
          <div className="lp-section-head center">
            <span className="lp-section-eyebrow center">Innovación en salud</span>
            <h2 className="lp-section-title">Conectamos el ecosistema de medicamentos</h2>
            <p className="lp-section-desc">
              Una plataforma que une pacientes, farmacias y domiciliarios en un solo lugar
            </p>
          </div>
        </Reveal>

        <div className="lp-about-grid">
          <RevealLeft>
            <div className="lp-about-visual">
              <div className="lp-about-bg-glow" />
              
              <svg className="lp-about-circuit" viewBox="0 0 400 400" fill="none">
                <circle cx="200" cy="200" r="120" stroke="rgba(86,124,141,0.08)" strokeWidth="1.5" strokeDasharray="8 12">
                  <animate attributeName="stroke-dashoffset" from="0" to="100" dur="20s" repeatCount="indefinite" />
                </circle>
                <circle cx="200" cy="200" r="160" stroke="rgba(86,124,141,0.06)" strokeWidth="1" strokeDasharray="4 16">
                  <animate attributeName="stroke-dashoffset" from="100" to="0" dur="30s" repeatCount="indefinite" />
                </circle>
                <circle cx="200" cy="200" r="80" stroke="rgba(86,124,141,0.12)" strokeWidth="2" strokeDasharray="2 20">
                  <animate attributeName="stroke-dashoffset" from="0" to="100" dur="15s" repeatCount="indefinite" />
                </circle>
              </svg>

              <svg className="lp-about-lines" viewBox="0 0 400 400">
                <line x1="80" y1="120" x2="320" y2="120" stroke="#567C8D" strokeWidth="2" opacity="0.15">
                  <animate attributeName="stroke-dashoffset" from="0" to="300" dur="4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.05;0.2;0.05" dur="3s" repeatCount="indefinite" />
                </line>
                <line x1="320" y1="120" x2="320" y2="320" stroke="#2F4156" strokeWidth="2" opacity="0.15">
                  <animate attributeName="stroke-dashoffset" from="0" to="200" dur="5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.05;0.2;0.05" dur="4s" repeatCount="indefinite" />
                </line>
                <line x1="320" y1="320" x2="80" y2="320" stroke="#567C8D" strokeWidth="2" opacity="0.15">
                  <animate attributeName="stroke-dashoffset" from="0" to="300" dur="4.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.05;0.2;0.05" dur="3.5s" repeatCount="indefinite" />
                </line>
                <line x1="80" y1="120" x2="320" y2="320" stroke="#2F4156" strokeWidth="1.5" opacity="0.08">
                  <animate attributeName="stroke-dashoffset" from="0" to="400" dur="6s" repeatCount="indefinite" />
                </line>
              </svg>

              <div className="lp-about-node node-patient">
                <div className="lp-about-node-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <span className="lp-about-node-label">Paciente</span>
                <div className="lp-about-node-pulse" />
              </div>

              <div className="lp-about-node node-pharmacy">
                <div className="lp-about-node-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                </div>
                <span className="lp-about-node-label">Farmacia</span>
                <div className="lp-about-node-pulse" />
              </div>

              <div className="lp-about-node node-delivery">
                <div className="lp-about-node-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13" rx="2" />
                    <polyline points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18" r="2.5" />
                    <circle cx="18.5" cy="18" r="2.5" />
                  </svg>
                </div>
                <span className="lp-about-node-label">Domiciliario</span>
                <div className="lp-about-node-pulse" />
              </div>

              <div className="lp-about-particle p1" />
              <div className="lp-about-particle p2" />
              <div className="lp-about-particle p3" />
              <div className="lp-about-particle p4" />
              <div className="lp-about-particle p5" />
            </div>
          </RevealLeft>

          <RevealRight delayMs={120}>
            <div className="lp-about-text">
              <div className="lp-about-text-badge">
                <span className="lp-about-text-dot" />
                <span>3 actores conectados</span>
              </div>
              <h2>Una plataforma, un ecosistema</h2>
              <p>
                MediRuta integra a <strong>pacientes</strong> que necesitan medicamentos, 
                <strong> farmacias</strong> que los dispensan y <strong>domiciliarios</strong> 
                que los entregan. Todo en una experiencia fluida y transparente.
              </p>
              <div className="lp-about-features">
                <div className="lp-about-feature">
                  <div className="lp-about-feature-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#567C8D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <div>
                    <h4>Seguridad</h4>
                    <p>Validación de identidad y trazabilidad</p>
                  </div>
                </div>
                <div className="lp-about-feature">
                  <div className="lp-about-feature-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#567C8D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div>
                    <h4>Tiempo real</h4>
                    <p>Seguimiento en vivo de cada pedido</p>
                  </div>
                </div>
                <div className="lp-about-feature">
                  <div className="lp-about-feature-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#567C8D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div>
                    <h4>Cobertura</h4>
                    <p>Red de farmacias y domiciliarios</p>
                  </div>
                </div>
              </div>
            </div>
          </RevealRight>
        </div>
      </div>
    </section>
  );
}