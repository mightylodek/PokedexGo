'use client';

import { useEffect, useRef, useState } from 'react';
import { TypeBadge } from './TypeBadge';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  allPokemon: PokemonSpecies[];
  apiUrl: string;
  currentFilters?: FilterState;
  onPokemonClick?: (pokemonId: string) => void;
}

export interface FilterState {
  searchQuery: string;
  selectedTypes: string[];
}

interface PokemonSpecies {
  id: string;
  dexNumber: number;
  name: string;
  primaryType: { name: string };
  secondaryType: { name: string } | null;
}

interface Type {
  id: string;
  name: string;
}

export function FilterModal({ isOpen, onClose, onApply, allPokemon, apiUrl, currentFilters, onPokemonClick }: FilterModalProps) {
  const [searchQuery, setSearchQuery] = useState(currentFilters?.searchQuery || '');
  const [types, setTypes] = useState<Type[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(currentFilters?.selectedTypes || []);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Update local state when currentFilters prop changes (when modal opens with existing filters)
  useEffect(() => {
    if (isOpen && currentFilters) {
      setSearchQuery(currentFilters.searchQuery || '');
      setSelectedTypes(currentFilters.selectedTypes || []);
    }
  }, [isOpen, currentFilters]);

  // Fetch types when modal opens
  useEffect(() => {
    if (isOpen && types.length === 0) {
      setLoadingTypes(true);
      fetch(`${apiUrl}/catalog/types`)
        .then(res => res.json())
        .then(data => {
          setTypes(data);
          setLoadingTypes(false);
        })
        .catch(err => {
          console.error('Error fetching types:', err);
          setLoadingTypes(false);
        });
    }
  }, [isOpen, apiUrl, types.length]);

  // Calculate filtered results
  const filteredPokemon = allPokemon.filter(p => {
    // Search filter
    let matchesSearch = true;
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      const isNumber = /^\d+$/.test(query);
      
      if (isNumber) {
        matchesSearch = p.dexNumber.toString().includes(query);
      } else {
        matchesSearch = p.name.toLowerCase().includes(query);
      }
    }

    // Type filter
    let matchesType = true;
    if (selectedTypes.length > 0) {
      matchesType = selectedTypes.some(typeName => 
        p.primaryType.name === typeName || p.secondaryType?.name === typeName
      );
    }

    return matchesSearch && matchesType;
  });

  const filteredCount = filteredPokemon.length;
  
  // Show preview of first 20 matching pokemon when searching by letters
  const showPreview = searchQuery.trim() && !/^\d+$/.test(searchQuery.trim());
  const previewPokemon = showPreview ? filteredPokemon.slice(0, 20) : [];

  // Handle type selection
  const toggleType = (typeName: string) => {
    setSelectedTypes(prev => 
      prev.includes(typeName)
        ? prev.filter(t => t !== typeName)
        : [...prev, typeName]
    );
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedTypes([]);
  };

  // Handle apply
  const handleApply = () => {
    onApply({
      searchQuery: searchQuery.trim(),
      selectedTypes,
    });
    onClose();
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="theme-bg-card rounded-lg theme-shadow border theme-border max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{
          borderColor: 'var(--border-color)',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-2xl font-bold theme-text-primary">Filter Pokémon</h2>
            <button
              onClick={onClose}
              className="text-2xl theme-text-secondary hover:theme-text-primary transition-colors"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Search Box */}
          <div className="mb-6">
            <label htmlFor="search" className="block text-sm font-medium theme-text-primary mb-2">
              Search by Name or Number
            </label>
            <input
              id="search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type name or pokemon number..."
              className="w-full px-4 py-2 rounded border theme-border theme-bg-card theme-text-primary focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                focusRingColor: 'var(--accent-primary)',
              }}
              autoFocus
            />
            {searchQuery.trim() && (
              <p className="text-sm theme-text-secondary mt-2">
                {/^\d+$/.test(searchQuery.trim())
                  ? `Searching for Pokemon with number containing "${searchQuery.trim()}"`
                  : `Searching for Pokemon with name containing "${searchQuery.trim()}"`}
              </p>
            )}
          </div>

          {/* Real-time Preview (only for letter searches) */}
          {showPreview && (
            <div className="mb-6">
              <label className="block text-sm font-medium theme-text-primary mb-2">
                Matching Pokémon ({filteredCount} total)
              </label>
              <div className="max-h-60 overflow-y-auto border rounded theme-border" style={{ borderColor: 'var(--border-color)' }}>
                {previewPokemon.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {previewPokemon.map((p) => (
                      <div
                        key={p.id}
                        className="px-3 py-2 rounded theme-bg-secondary hover:theme-bg-hover transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium theme-text-secondary">#{p.dexNumber}</span>
                          <button
                            onClick={() => {
                              if (onPokemonClick) {
                                onPokemonClick(p.id);
                              }
                            }}
                            className="text-sm theme-text-primary hover:opacity-80 transition-all cursor-pointer text-left font-medium"
                            style={{
                              textDecoration: 'underline',
                              textDecorationThickness: '1px',
                              textUnderlineOffset: '2px',
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              font: 'inherit',
                            }}
                          >
                            {p.name}
                          </button>
                        </div>
                        <div className="flex gap-1">
                          <TypeBadge typeName={p.primaryType.name} />
                          {p.secondaryType && <TypeBadge typeName={p.secondaryType.name} />}
                        </div>
                      </div>
                    ))}
                    {filteredCount > 20 && (
                      <div className="px-3 py-2 text-sm theme-text-secondary text-center">
                        ... and {filteredCount - 20} more
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 text-center theme-text-secondary">
                    No matching Pokémon found
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium theme-text-primary mb-3">
              Filter by Type
            </label>
            {loadingTypes ? (
              <p className="theme-text-secondary">Loading types...</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {types.map((type) => {
                  const isSelected = selectedTypes.includes(type.name);
                  return (
                    <button
                      key={type.id}
                      onClick={() => toggleType(type.name)}
                      className={`transition-all ${
                        isSelected ? 'ring-2 ring-offset-2' : ''
                      }`}
                      style={{
                        ringColor: isSelected ? 'var(--accent-primary)' : 'transparent',
                      }}
                    >
                      <TypeBadge typeName={type.name} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Apply Button */}
          <div className="flex justify-between items-center pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <button
              onClick={handleClearFilters}
              disabled={!searchQuery.trim() && selectedTypes.length === 0}
              className="px-4 py-2 rounded font-medium transition-colors theme-text-secondary hover:theme-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear Filters
            </button>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded font-medium transition-colors theme-text-secondary hover:theme-text-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-6 py-2 rounded font-medium text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                Show {filteredCount} result{filteredCount !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

