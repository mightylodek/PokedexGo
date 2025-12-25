'use client';

import { useEffect, useRef, useState } from 'react';
import { TypeBadge } from './TypeBadge';
import { getBulbapediaRegionUrl, hasBulbapediaRegionPage } from '../lib/bulbapedia-utils';

interface RegionModalProps {
  regionName: string | null;
  apiUrl: string;
  onClose: () => void;
  onPokemonClick?: (pokemonId: string) => void;
  onTypeClick?: (typeName: string) => void;
  onRegionClick?: (regionName: string) => void;
}

interface RegionDetails {
  id: string;
  name: string;
}

interface PokemonWithRegion {
  id: string;
  dexNumber: number;
  name: string;
  primaryType: { name: string };
  secondaryType: { name: string } | null;
  region: { name: string } | null;
  spriteUrl: string | null;
}

export function RegionModal({ regionName, apiUrl, onClose, onPokemonClick, onTypeClick, onRegionClick }: RegionModalProps) {
  const [region, setRegion] = useState<RegionDetails | null>(null);
  const [pokemon, setPokemon] = useState<PokemonWithRegion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<{ y: number; scrollTop: number; startY: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance (in px) to trigger close
  const minSwipeDistance = 50;
  // Maximum distance from top of modal to allow swipe-to-close
  const swipeZoneHeight = 100;

  useEffect(() => {
    if (!regionName) {
      setRegion(null);
      setPokemon([]);
      return;
    }

    setLoading(true);
    setError(null);

    // Handle "None" case - use lowercase for the API call
    const apiRegionName = regionName.toLowerCase() === 'none' ? 'none' : regionName;

    // First, get the region details (by name or ID)
    // Then fetch Pokemon that are from this region (or with no region if "none")
    Promise.all([
      fetch(`${apiUrl}/catalog/regions/${apiRegionName}`),
      fetch(`${apiUrl}/catalog/regions/${apiRegionName}/pokemon`),
    ])
      .then(async ([regionRes, pokemonRes]) => {
        if (!regionRes.ok) {
          const errorText = await regionRes.text().catch(() => regionRes.statusText);
          throw new Error(`Failed to fetch region "${regionName}": ${regionRes.status} ${errorText}`);
        }
        if (!pokemonRes.ok) {
          const errorText = await pokemonRes.text().catch(() => pokemonRes.statusText);
          throw new Error(`Failed to fetch pokemon for region "${regionName}": ${pokemonRes.status} ${errorText}`);
        }
        const regionData = await regionRes.json();
        const pokemonData = await pokemonRes.json();
        setRegion(regionData);
        setPokemon(pokemonData);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [regionName, apiUrl]);

  // Handle swipe gestures - only allow swipe-to-close from top of modal when scrolled to top
  const onTouchStart = (e: React.TouchEvent) => {
    if (!modalRef.current) return;
    
    const touch = e.targetTouches[0];
    const rect = modalRef.current.getBoundingClientRect();
    const touchY = touch.clientY - rect.top; // Position relative to modal top
    const scrollTop = modalRef.current.scrollTop;
    
    // Only allow swipe-to-close if:
    // 1. Touch starts within the top swipe zone
    // 2. Modal is scrolled to the top (or very close to it)
    if (touchY <= swipeZoneHeight && scrollTop <= 10) {
      setTouchEnd(null);
      setTouchStart({
        y: touch.clientY,
        scrollTop: scrollTop,
        startY: touchY,
      });
    } else {
      setTouchStart(null);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || !modalRef.current) return;
    
    // Check if user is scrolling within the modal
    const currentScrollTop = modalRef.current.scrollTop;
    const touch = e.targetTouches[0];
    
    // If modal has scrolled, cancel the swipe gesture
    if (Math.abs(currentScrollTop - touchStart.scrollTop) > 5) {
      setTouchStart(null);
      setTouchEnd(null);
      return;
    }
    
    setTouchEnd(touch.clientY);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setTouchStart(null);
      setTouchEnd(null);
      return;
    }
    
    const distance = touchStart.y - touchEnd;
    const isDownSwipe = distance > minSwipeDistance;

    if (isDownSwipe) {
      onClose();
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && regionName) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [regionName, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (regionName) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [regionName]);

  if (!regionName) return null;

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
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {loading && (
          <div className="p-8 text-center theme-text-primary">Loading...</div>
        )}

        {error && (
          <div className="p-8 text-center">
            <p className="text-red-500 mb-4">Error: {error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
            >
              Close
            </button>
          </div>
        )}

        {region && !loading && (
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-3xl font-bold theme-text-primary">
                      {region.name === 'None' ? 'No Region' : region.name}
                    </h2>
                    {hasBulbapediaRegionPage(region.name) && (
                      <a
                        href={getBulbapediaRegionUrl(region.name) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm theme-text-secondary hover:theme-text-primary transition-colors flex items-center gap-1"
                        title="View on Bulbapedia"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                        <span className="text-xs">Bulbapedia</span>
                      </a>
                    )}
                  </div>
                  <p className="text-sm theme-text-secondary uppercase">
                    Pokémon Region
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-2xl theme-text-secondary hover:theme-text-primary transition-colors"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Pokemon from this region */}
            <div>
              <h3 className="text-xl font-semibold theme-text-primary mb-3">
                {region.name === 'None' 
                  ? `Pokémon with no region (${pokemon.length})`
                  : `Pokémon from ${region.name} (${pokemon.length})`}
              </h3>
              {pokemon.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {pokemon.map((p) => {
                    const spriteUrl = p.spriteUrl
                      ? p.spriteUrl.startsWith('http')
                        ? p.spriteUrl
                        : `${apiUrl}${p.spriteUrl}`
                      : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.dexNumber}.png`;

                    return (
                      <div
                        key={p.id}
                        className="theme-bg-secondary rounded p-3 border theme-border cursor-pointer hover:theme-bg-hover transition-all flex flex-col items-center gap-2"
                        onClick={() => {
                          if (onPokemonClick) {
                            onClose();
                            onPokemonClick(p.id);
                          }
                        }}
                      >
                        <img
                          src={spriteUrl}
                          alt={p.name}
                          className="w-16 h-16 object-contain cursor-pointer"
                          style={{ width: '64px', height: '64px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onPokemonClick) {
                              onClose();
                              onPokemonClick(p.id);
                            }
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (!target.src.includes('PokeAPI')) {
                              target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.dexNumber}.png`;
                            }
                          }}
                        />
                        <div className="text-center w-full">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onPokemonClick) {
                                onClose();
                                onPokemonClick(p.id);
                              }
                            }}
                            className="text-sm font-medium theme-text-primary hover:opacity-80 transition-all"
                            style={{
                              textDecoration: 'underline',
                              textDecorationThickness: '1px',
                              textUnderlineOffset: '2px',
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              font: 'inherit',
                              cursor: 'pointer',
                            }}
                          >
                            {p.name}
                          </button>
                          <div className="text-xs theme-text-secondary">#{p.dexNumber}</div>
                          {p.region && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onRegionClick) {
                                  onRegionClick(p.region!.name);
                                }
                              }}
                              className="text-xs theme-text-secondary hover:opacity-80 transition-all mt-1"
                              style={{
                                textDecoration: 'underline',
                                textDecorationThickness: '1px',
                                textUnderlineOffset: '2px',
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                font: 'inherit',
                                cursor: 'pointer',
                              }}
                            >
                              {p.region.name}
                            </button>
                          )}
                          <div className="flex gap-1 justify-center mt-1">
                            <div onClick={(e) => e.stopPropagation()}>
                              <TypeBadge 
                                typeName={p.primaryType.name}
                                onClick={(typeName) => {
                                  if (onTypeClick) {
                                    onTypeClick(typeName);
                                  }
                                }}
                              />
                            </div>
                            {p.secondaryType && (
                              <div onClick={(e) => e.stopPropagation()}>
                                <TypeBadge 
                                  typeName={p.secondaryType.name}
                                  onClick={(typeName) => {
                                    if (onTypeClick) {
                                      onTypeClick(typeName);
                                    }
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="theme-text-secondary text-center py-4">
                  No Pokémon found from this region.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

