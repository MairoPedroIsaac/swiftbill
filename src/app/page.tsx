import HeroSection from '@/components/HeroSection';
import InvoiceGenerator from '@/components/InvoiceGenerator';

export default function Home() {
  return (
    <main style={{ paddingBottom: '4rem' }}>
      <HeroSection />
      <InvoiceGenerator />
    </main>
  );
}
