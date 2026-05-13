import { Header } from '@/components/shared/Header';
import { HeroSection } from '@/components/landing/HeroSection';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0f]">
      <Header variant="landing" />
      <HeroSection />
    </main>
  );
}
