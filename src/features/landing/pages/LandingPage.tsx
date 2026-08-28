import '../landing.css';
import { AboutUs } from '../components/AboutUs';
import { Benefits } from '../components/Benefits';
import { FinalCta } from '../components/FinalCta';
import { Footer } from '../components/Footer';
import { Hero } from '../components/Hero';
import { HowItWorks } from '../components/HowItWorks';
import { Navbar } from '../components/Navbar';
import { ProductShowcase } from '../components/ProductShowcase';
import { TrustSection } from '../components/TrustSection';

/**
 * Landing page pública de MediRuta — rediseño completo (ver hilo de la
 * skill `frontend-design`): narrativa visual receta → farmacia →
 * domiciliario → ruta → paciente, contada principalmente con
 * composición (mockups de teléfono dibujados en CSS, mapa simplificado,
 * línea de proceso) en vez de bloques de texto. Paleta oficial sin
 * cambios — toda variación sutil sale de `color-mix()` en landing.css,
 * nunca un color nuevo.
 *
 * URL del release del APK: se actualiza a mano cada vez que se publica
 * una versión nueva (`gh release create`/`gh release upload` en
 * mediruta-app).
 */
const APK_DOWNLOAD_URL =
  'https://github.com/sofiacc1414/mediruta-app/releases/download/v1.1.0/mediruta.apk';

export function LandingPage() {
  return (
    <div className="landing">
      <Navbar />
      <main>
        <Hero apkUrl={APK_DOWNLOAD_URL} />
        <HowItWorks />
        <AboutUs />
        <Benefits />
        <ProductShowcase />
        <TrustSection />
        <FinalCta apkUrl={APK_DOWNLOAD_URL} />
      </main>
      <Footer />
    </div>
  );
}
