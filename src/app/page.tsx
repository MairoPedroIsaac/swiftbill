import HeroSection from '@/components/HeroSection';
import InvoiceGenerator from '@/components/InvoiceGenerator';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <main>
        <Header />
        <HeroSection />
        <InvoiceGenerator />
      </main>
      <Footer />
    </>
  );
}
