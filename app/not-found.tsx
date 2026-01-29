import Link from 'next/link';
import { Button } from './components/Button';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-muted flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl sm:text-7xl font-bold text-primary font-[family-name:var(--font-display)]">404</p>
        <h1 className="text-xl sm:text-2xl font-semibold mt-4 text-foreground">Pagina niet gevonden</h1>
        <p className="text-muted-foreground mt-2">
          De pagina die je zoekt bestaat niet of is verplaatst.
        </p>
        <Link href="/" className="inline-flex items-center gap-2 mt-6">
          <Button size="lg" className="gap-2">
            <Home className="w-4 h-4" />
            Naar home
          </Button>
        </Link>
      </div>
    </main>
  );
}
