import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import { ProofStrip, HowItWorks, MadeFor, Features, TryItIntro, CtaBand } from '@/components/LandingSections';
import InvoiceGenerator from '@/components/InvoiceGenerator';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <main>
        <Header />
        <HeroSection />
        <ProofStrip />
        <HowItWorks />
        <MadeFor />
        <Features />
        <TryItIntro />
        <InvoiceGenerator />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}
