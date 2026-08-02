import { LandingHeader } from '@/components/landing/landing-header';
import { Hero } from '@/components/landing/hero';
import { QuickBookWidget } from '@/components/landing/quick-book-widget';
import { StatsStrip } from '@/components/landing/stats-strip';
import { Services } from '@/components/landing/services';
import { WhatWeProvide } from '@/components/landing/what-we-provide';
import { FeaturedServices } from '@/components/landing/featured-services';
import { HowItWorks } from '@/components/landing/how-it-works';
import { WhyChooseUs } from '@/components/landing/why-choose-us';
import { Team } from '@/components/landing/team';
import { CtaBanner } from '@/components/landing/cta-banner';
import { LandingFooter } from '@/components/landing/landing-footer';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader />
      <main>
        <Hero />
        <QuickBookWidget />
        <StatsStrip />
        <Services />
        <WhatWeProvide />
        <FeaturedServices />
        <HowItWorks />
        <WhyChooseUs />
        <Team />
        <CtaBanner />
      </main>
      <LandingFooter />
    </div>
  );
}
