import { LandingHeader } from '@/components/landing/landing-header';
import { Hero } from '@/components/landing/hero';
import { StatsBar } from '@/components/landing/stats-bar';
import { Services } from '@/components/landing/services';
import { FeaturedServices } from '@/components/landing/featured-services';
import { HowItWorks } from '@/components/landing/how-it-works';
import { WhyChooseUs } from '@/components/landing/why-choose-us';
import { Team } from '@/components/landing/team';
import { CtaBanner } from '@/components/landing/cta-banner';
import { LandingFooter } from '@/components/landing/landing-footer';
import { BookingModalProvider } from '@/components/landing/booking-modal';

export default function HomePage() {
  return (
    <BookingModalProvider>
      <div className="min-h-screen bg-background text-foreground">
        <LandingHeader />
        <main>
          <Hero />
          <StatsBar />
          <Services />
          <FeaturedServices />
          <HowItWorks />
          <WhyChooseUs />
          <Team />
          <CtaBanner />
        </main>
        <LandingFooter />
      </div>
    </BookingModalProvider>
  );
}
