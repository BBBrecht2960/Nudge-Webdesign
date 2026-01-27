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

export default function Home() {
  return (
    <main className="h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-muted w-full min-w-0 overflow-x-hidden">
      <Hero />
      <ProblemSolution />
      <PackagesPreview />
      <Process />
      <Maintenance />
      <Proof />
      <FAQ />
      <div className="snap-start py-4 sm:py-6 px-5 sm:px-6 lg:px-8 bg-white w-full min-w-0 overflow-hidden min-h-screen flex items-center">
        <div className="max-w-4xl mx-auto w-full min-w-0">
          <LeadForm />
        </div>
      </div>
      <FinalCTA />
      <StickyMobileCTA />
    </main>
  );
}
