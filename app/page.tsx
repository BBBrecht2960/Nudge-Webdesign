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
    <main className="min-h-screen bg-muted w-full min-w-0 overflow-x-hidden pb-24 md:pb-0">
      <Hero />
      <ProblemSolution />
      <PackagesPreview />
      <Process />
      <Maintenance />
      <Proof />
      <FAQ />
      <div className="py-14 sm:py-20 px-5 sm:px-6 lg:px-8 bg-white w-full min-w-0 overflow-hidden">
        <div className="max-w-4xl mx-auto w-full min-w-0">
          <LeadForm />
        </div>
      </div>
      <FinalCTA />
      <StickyMobileCTA />
    </main>
  );
}
