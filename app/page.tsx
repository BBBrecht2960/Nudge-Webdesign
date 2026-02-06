import { HomeHeader } from './components/HomeHeader';
import { Hero } from './components/Hero';
import { ProblemSolution } from './components/ProblemSolution';
import { PackagesPreview } from './components/PackagesPreview';
import { Process } from './components/Process';
import { Maintenance } from './components/Maintenance';
import { Proof } from './components/Proof';
import { FAQ } from './components/FAQ';
import { LeadForm } from './components/LeadForm';
import { FinalCTA } from './components/FinalCTA';
import { StickyMobileCTA } from './components/StickyMobileCTA';

const sectionBase = 'bg-white w-full min-w-0 overflow-hidden border-t border-border/60';

export default function Home() {
  return (
    <main className="min-h-screen overflow-y-auto overflow-x-hidden scroll-smooth bg-white w-full min-w-0">
      <HomeHeader />
      <Hero />
      <ProblemSolution className={sectionBase} />
      <PackagesPreview className={sectionBase} />
      <Process className={sectionBase} />
      <Maintenance className={sectionBase} />
      <Proof className={sectionBase} />
      <FAQ className={sectionBase} />
      <section id="contact-form" className={sectionBase}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 w-full min-w-0 flex flex-col items-center">
          <LeadForm />
        </div>
      </section>
      <FinalCTA />
      <StickyMobileCTA />
    </main>
  );
}
