import LandingNavbar from '@/components/landing/LandingNavbar';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import Footer from '@/components/landing/Footer';

const Index = () => {
  return (
    <div className="min-h-screen">
      <LandingNavbar />
      <main>
        <HeroSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
