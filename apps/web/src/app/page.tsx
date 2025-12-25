import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4 theme-text-primary">Pokémon GO Data Platform</h1>
        <p className="text-lg mb-8 theme-text-secondary">
          Data-first MVP for Pokémon GO content with modular battle engine.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/catalog" className="p-6 theme-bg-card rounded-lg theme-shadow hover:shadow-xl transition-all transform hover:-translate-y-1 border theme-border">
            <h2 className="text-2xl font-semibold mb-2 theme-text-primary">Catalog</h2>
            <p className="theme-text-secondary">
              Browse Pokémon species, forms, moves, and types.
            </p>
          </Link>
          
          <div className="p-6 theme-bg-card rounded-lg theme-shadow border theme-border">
            <h2 className="text-2xl font-semibold mb-2 theme-text-primary">Battle Simulator</h2>
            <p className="theme-text-secondary">
              Simulate turn-based battles using the modular battle engine.
            </p>
          </div>
          
          <div className="p-6 theme-bg-card rounded-lg theme-shadow border theme-border">
            <h2 className="text-2xl font-semibold mb-2 theme-text-primary">My Pokédex</h2>
            <p className="theme-text-secondary">
              Manage your collection, favorites, and owned Pokémon.
            </p>
          </div>
          
          <Link href="/ingestion" className="p-6 theme-bg-card rounded-lg theme-shadow hover:shadow-xl transition-all transform hover:-translate-y-1 border theme-border">
            <h2 className="text-2xl font-semibold mb-2 theme-text-primary">Data Ingestion</h2>
            <p className="theme-text-secondary">
              Manage data ingestion and view imported Pokémon GO data.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}

