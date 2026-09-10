import HeroSection from '@/components/HeroSection';
import InvoiceGenerator from '@/components/InvoiceGenerator';
import Header from '@/components/Header';

export default function Home() {
  return (
    <main style={{ paddingBottom: '4rem' }}>
      <Header />
      <HeroSection />
      <InvoiceGenerator />
    </main>
  );
}
