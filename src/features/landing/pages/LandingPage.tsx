import '../landing.css';
import { AboutUs } from '../components/AboutUs';
import { Benefits } from '../components/Benefits';
import { FinalCta } from '../components/FinalCta';
import { Footer } from '../components/Footer';
import { Hero } from '../components/Hero';
import { HowItWorks } from '../components/HowItWorks';
import { Navbar } from '../components/Navbar';
import { ProductShowcase } from '../components/ProductShowcase';

// El nombre del .apk incluye la versión a propósito (antes era siempre
// "mediruta.apk", igual en cada release) — algunos navegadores/gestores
// de descargas de Android reusan un archivo ya descargado con el mismo
// nombre en vez de traer el nuevo, así que alguien podía "actualizar" y
// terminar instalando el APK viejo otra vez. Con un nombre distinto por
// versión, cada release es una descarga nueva sin ambigüedad.
const APK_DOWNLOAD_URL =
  'https://github.com/sofiacc1414/mediruta-app/releases/download/v1.4.1/mediruta-v1.4.1.apk';

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
        <FinalCta apkUrl={APK_DOWNLOAD_URL} />
      </main>
      <Footer />
    </div>
  );
}