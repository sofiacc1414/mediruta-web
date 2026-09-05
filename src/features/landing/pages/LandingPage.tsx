import '../landing.css';
import { AboutUs } from '../components/AboutUs';
import { Benefits } from '../components/Benefits';
import { FinalCta } from '../components/FinalCta';
import { Footer } from '../components/Footer';
import { Hero } from '../components/Hero';
import { HowItWorks } from '../components/HowItWorks';
import { Navbar } from '../components/Navbar';
import { ProductShowcase } from '../components/ProductShowcase';

const APK_DOWNLOAD_URL =
  'https://github.com/sofiacc1414/mediruta-app/releases/download/v1.4.0/mediruta.apk';

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