'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { TypeBadge } from '../../components/TypeBadge';
import { PokemonProfileModal } from '../../components/PokemonProfileModal';
import { TypeDetailsModal } from '../../components/TypeDetailsModal';
import { RegionModal } from '../../components/RegionModal';
import { RegionsListModal } from '../../components/RegionsListModal';
import { FilterModal, FilterState } from '../../components/FilterModal';
import { WidgetInfoModal } from '../../components/WidgetInfoModal';
import { getApiUrl } from '../../lib/api-utils';

interface CatalogStats {
  species: number;
  forms: number;
  moves: number;
  types: number;
  regions: number;
}

interface PokemonSpecies {
  id: string;
  dexNumber: number;
  name: string;
  generation: number;
  primaryType: { name: string };
  secondaryType: { name: string } | null;
  forms: Array<{
    id: string;
    formName: string;
    baseAttack: number;
    baseDefense: number;
    baseStamina: number;
    isDefault: boolean;
    assets: Array<{
      asset: {
        path: string;
        mimeType: string;
      };
    }>;
  }>;
}

export default function CatalogPage() {
  const [stats, setStats] = useState<CatalogStats | null>(null);
  const [pokemon, setPokemon] = useState<PokemonSpecies[]>([]);
  const [allPokemon, setAllPokemon] = useState<PokemonSpecies[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number | 'all'>(20);
  const [selectedPokemonId, setSelectedPokemonId] = useState<string | null>(null);
  const [selectedTypeName, setSelectedTypeName] = useState<string | null>(null);
  const [selectedRegionName, setSelectedRegionName] = useState<string | null>(null);
  const [regionsListModalOpen, setRegionsListModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ searchQuery: '', selectedTypes: [] });
  const [shouldReopenFilterModal, setShouldReopenFilterModal] = useState(false);
  const [widgetInfoModalOpen, setWidgetInfoModalOpen] = useState(false);
  const [apiUrl, setApiUrl] = useState<string>('');

  // Calculate API URL on client side to ensure window is available
  useEffect(() => {
    setApiUrl(getApiUrl());
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/catalog/stats`);
      if (!res.ok) {
        throw new Error(`Failed to fetch stats: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      console.log('Stats data:', data);
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch stats');
    }
  }, [apiUrl]);

  // Fetch all pokemon for filtering
  const fetchAllPokemon = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${apiUrl}/catalog/pokemon?skip=0&take=10000`;
      const res = await fetch(url);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch all pokemon: ${res.status} ${res.statusText}. ${errorText}`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setAllPokemon(data);
      } else {
        console.error('Expected array but got:', typeof data, data);
        setError('Invalid response format: expected array');
      }
    } catch (error) {
      console.error('Error fetching all pokemon:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch pokemon');
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);


  useEffect(() => {
    if (apiUrl) {
      fetchStats();
      fetchAllPokemon();
    }
  }, [apiUrl, fetchStats, fetchAllPokemon]);

  // Apply filters to all pokemon
  const filteredPokemon = useMemo(() => {
    if (!filters.searchQuery && filters.selectedTypes.length === 0) {
      return allPokemon;
    }

    return allPokemon.filter(p => {
      // Search filter
      let matchesSearch = true;
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.trim().toLowerCase();
        const isNumber = /^\d+$/.test(query);
        
        if (isNumber) {
          matchesSearch = p.dexNumber.toString().includes(query);
        } else {
          matchesSearch = p.name.toLowerCase().includes(query);
        }
      }

      // Type filter
      let matchesType = true;
      if (filters.selectedTypes.length > 0) {
        matchesType = filters.selectedTypes.some(typeName => 
          p.primaryType.name === typeName || p.secondaryType?.name === typeName
        );
      }

      return matchesSearch && matchesType;
    });
  }, [allPokemon, filters]);

  // Apply pagination to filtered results
  const paginatedPokemon = useMemo(() => {
    if (pageSize === 'all') {
      return filteredPokemon;
    }
    const start = page * pageSize;
    return filteredPokemon.slice(start, start + pageSize);
  }, [filteredPokemon, page, pageSize]);

  // Update displayed pokemon when filters or pagination change
  useEffect(() => {
    setPokemon(paginatedPokemon);
  }, [paginatedPokemon]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery.trim()) count++;
    if (filters.selectedTypes.length > 0) count++;
    return count;
  }, [filters]);

  // Reset to page 0 when pageSize changes
  useEffect(() => {
    setPage(0);
  }, [pageSize]);

  if (loading && pokemon.length === 0) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <p className="theme-text-primary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 theme-text-primary">Pokémon Catalog</h1>

        {error && (
          <div className="mb-6 p-4 rounded-lg border border-red-500 bg-red-50 dark:bg-red-900/20">
            <p className="text-red-700 dark:text-red-400 font-semibold">Error: {error}</p>
            <p className="text-sm text-red-600 dark:text-red-500 mt-2">
              API URL: {apiUrl || (typeof window !== 'undefined' ? window.location.origin : 'same origin')}
            </p>
            <button
              onClick={() => {
                setError(null);
                fetchStats();
                fetchAllPokemon();
              }}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="flex flex-wrap gap-2 mb-6" style={{ width: '100%' }}>
            <button
              onClick={() => setWidgetInfoModalOpen(true)}
              className="theme-bg-card rounded-lg theme-shadow px-3 py-3 border theme-border cursor-pointer hover:theme-bg-hover transition-colors text-left"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                font: 'inherit',
                flex: '0 0 calc(20% - 6.4px)',
                minWidth: 0,
              }}
            >
              <div className="text-xl font-bold" style={{ color: 'var(--accent-primary)' }}>{stats.species}</div>
              <div className="text-sm theme-text-secondary">Species</div>
            </button>
            <button
              onClick={() => setWidgetInfoModalOpen(true)}
              className="theme-bg-card rounded-lg theme-shadow px-3 py-3 border theme-border cursor-pointer hover:theme-bg-hover transition-colors text-left"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                font: 'inherit',
                flex: '0 0 calc(20% - 6.4px)',
                minWidth: 0,
              }}
            >
              <div className="text-xl font-bold" style={{ color: 'var(--accent-secondary)' }}>{stats.forms}</div>
              <div className="text-sm theme-text-secondary">Forms</div>
            </button>
            <button
              onClick={() => setWidgetInfoModalOpen(true)}
              className="theme-bg-card rounded-lg theme-shadow px-3 py-3 border theme-border cursor-pointer hover:theme-bg-hover transition-colors text-left"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                font: 'inherit',
                flex: '0 0 calc(20% - 6.4px)',
                minWidth: 0,
              }}
            >
              <div className="text-xl font-bold horizons-accent-blue sv-accent-violet">{stats.moves}</div>
              <div className="text-sm theme-text-secondary">Moves</div>
            </button>
            <button
              onClick={() => setWidgetInfoModalOpen(true)}
              className="theme-bg-card rounded-lg theme-shadow px-3 py-3 border theme-border cursor-pointer hover:theme-bg-hover transition-colors text-left"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                font: 'inherit',
                flex: '0 0 calc(20% - 6.4px)',
                minWidth: 0,
              }}
            >
              <div className="text-xl font-bold horizons-accent-yellow sv-accent-gold">{stats.types}</div>
              <div className="text-sm theme-text-secondary">Types</div>
            </button>
            <button
              onClick={() => setRegionsListModalOpen(true)}
              className="theme-bg-card rounded-lg theme-shadow px-3 py-3 border theme-border cursor-pointer hover:theme-bg-hover transition-colors text-left"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                font: 'inherit',
                flex: '0 0 calc(20% - 6.4px)',
                minWidth: 0,
              }}
            >
              <div className="text-xl font-bold" style={{ color: 'var(--accent-tertiary, #10b981)' }}>{stats.regions}</div>
              <div className="text-sm theme-text-secondary">Regions</div>
            </button>
          </div>
        )}

        {/* Pokemon List */}
        <div className="theme-bg-card rounded-lg theme-shadow p-6 border theme-border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold theme-text-primary">Pokémon Species</h2>
            <div className="flex items-center gap-3">
              {/* Filter Icon */}
              <button
                onClick={() => setFilterModalOpen(true)}
                className="relative p-2 rounded hover:theme-bg-hover transition-colors"
                aria-label="Filter"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 theme-text-secondary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {activeFilterCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs font-bold text-white flex items-center justify-center"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  >
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <label htmlFor="pageSize" className="text-sm theme-text-secondary">
                Items per page:
              </label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
                className="px-3 py-1 rounded border theme-border theme-bg-card theme-text-primary text-sm cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value="all">All</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y" style={{ borderColor: 'var(--border-color)' }}>
              <thead className="theme-bg-secondary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                    Pokémon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                    Types
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                    Generation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                    Forms
                  </th>
                </tr>
              </thead>
              <tbody className="theme-bg-card divide-y" style={{ borderColor: 'var(--border-color)' }}>
                {pokemon.map((p) => (
                  <tr key={p.id} className="hover:theme-bg-hover transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium theme-text-primary">
                      #{p.dexNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium theme-text-primary">
                      <div className="flex items-center gap-3">
                        {(() => {
                          // Get default form or first form
                          const defaultForm = p.forms.find(f => f.isDefault) || p.forms[0];
                          const spriteAsset = defaultForm?.assets?.[0]?.asset;
                          const spriteUrl = spriteAsset?.path 
                            ? (spriteAsset.path.startsWith('http') ? spriteAsset.path : `${apiUrl}${spriteAsset.path}`)
                            : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.dexNumber}.png`;
                          
                          return (
                            <img
                              src={spriteUrl}
                              alt={p.name}
                              className="w-18 h-18 object-contain"
                              style={{ width: '72px', height: '72px' }}
                              onError={(e) => {
                                // Fallback to PokeAPI if image fails to load
                                const target = e.target as HTMLImageElement;
                                if (!target.src.includes('PokeAPI')) {
                                  target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.dexNumber}.png`;
                                }
                              }}
                            />
                          );
                        })()}
                        <button
                          onClick={() => setSelectedPokemonId(p.id)}
                          className="text-left transition-all cursor-pointer font-medium theme-text-primary rounded px-2 py-1 -mx-2 -my-1 hover:theme-bg-hover"
                          style={{
                            textDecoration: 'none',
                            background: 'none',
                            border: 'none',
                            padding: '4px 8px',
                            margin: '-4px -8px',
                            font: 'inherit',
                          }}
                        >
                          {p.name}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm theme-text-secondary">
                      <div className="flex gap-2">
                        <TypeBadge 
                          typeName={p.primaryType.name} 
                          isPrimary
                          onClick={setSelectedTypeName}
                        />
                        {p.secondaryType && (
                          <TypeBadge 
                            typeName={p.secondaryType.name}
                            onClick={setSelectedTypeName}
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm theme-text-secondary">
                      Gen {p.generation}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm theme-text-secondary">
                      {p.forms.length} form{p.forms.length !== 1 ? 's' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pokemon.length === 0 && (
              <p className="text-center theme-text-muted py-8">No Pokémon data yet. Run ingestion to populate.</p>
            )}
          </div>
          {pageSize !== 'all' && (
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: page === 0 ? 'var(--bg-hover)' : 'var(--accent-primary)',
                  color: 'white'
                }}
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={(page + 1) * pageSize >= filteredPokemon.length}
                className="px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: (page + 1) * pageSize >= filteredPokemon.length ? 'var(--bg-hover)' : 'var(--accent-primary)',
                  color: 'white'
                }}
              >
                Next
              </button>
            </div>
          )}
          {pageSize === 'all' && filteredPokemon.length > 0 && (
            <div className="mt-4 text-sm theme-text-secondary text-center">
              Showing all {filteredPokemon.length} Pokémon
            </div>
          )}
          {activeFilterCount > 0 && (
            <div className="mt-4 text-sm theme-text-secondary text-center">
              {filteredPokemon.length} result{filteredPokemon.length !== 1 ? 's' : ''} match{filteredPokemon.length !== 1 ? '' : 'es'} your filter{activeFilterCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Pokemon Profile Modal */}
      <PokemonProfileModal
        pokemonId={selectedPokemonId}
        apiUrl={apiUrl}
        onClose={() => {
          setSelectedPokemonId(null);
          // Reopen filter modal if it was open when pokemon modal opened
          if (shouldReopenFilterModal) {
            setFilterModalOpen(true);
            setShouldReopenFilterModal(false);
          }
        }}
        onPokemonClick={(pokemonId) => setSelectedPokemonId(pokemonId)}
      />

      {/* Type Details Modal */}
      <TypeDetailsModal
        typeName={selectedTypeName}
        apiUrl={apiUrl}
        onClose={() => setSelectedTypeName(null)}
        onPokemonClick={(pokemonId) => {
          setSelectedTypeName(null);
          setSelectedPokemonId(pokemonId);
        }}
        onTypeClick={(typeName) => setSelectedTypeName(typeName)}
        onRegionClick={(regionName) => {
          setSelectedTypeName(null);
          setSelectedRegionName(regionName);
        }}
      />

      {/* Regions List Modal */}
      <RegionsListModal
        isOpen={regionsListModalOpen}
        apiUrl={apiUrl}
        onClose={() => setRegionsListModalOpen(false)}
        onRegionClick={(regionName) => {
          setRegionsListModalOpen(false);
          setSelectedRegionName(regionName);
        }}
      />

      {/* Region Modal */}
      <RegionModal
        regionName={selectedRegionName}
        apiUrl={apiUrl}
        onClose={() => setSelectedRegionName(null)}
        onPokemonClick={(pokemonId) => {
          setSelectedRegionName(null);
          setSelectedPokemonId(pokemonId);
        }}
        onTypeClick={(typeName) => {
          setSelectedRegionName(null);
          setSelectedTypeName(typeName);
        }}
        onRegionClick={(regionName) => setSelectedRegionName(regionName)}
      />

      {/* Filter Modal */}
      <FilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onApply={(newFilters) => {
          setFilters(newFilters);
          setPage(0); // Reset to first page when filters change
        }}
        allPokemon={allPokemon}
        apiUrl={apiUrl}
        currentFilters={filters}
        onPokemonClick={(pokemonId) => {
          // Close filter modal and open pokemon modal, set flag to reopen filter modal when pokemon modal closes
          setFilterModalOpen(false);
          setShouldReopenFilterModal(true);
          setSelectedPokemonId(pokemonId);
        }}
      />

      {/* Widget Info Modal */}
      <WidgetInfoModal
        isOpen={widgetInfoModalOpen}
        onClose={() => setWidgetInfoModalOpen(false)}
      />
    </div>
  );
}

