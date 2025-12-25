'use client';

import { useEffect, useRef, useState } from 'react';
import { TypeBadge } from './TypeBadge';

interface TypeDetailsModalProps {
  typeName: string | null;
  apiUrl: string;
  onClose: () => void;
  onPokemonClick?: (pokemonId: string) => void;
  onTypeClick?: (typeName: string) => void;
  onRegionClick?: (regionName: string) => void;
}

interface TypeDetails {
  id: string;
  name: string;
}

interface PokemonWithType {
  id: string;
  dexNumber: number;
  name: string;
  primaryType: { name: string };
  secondaryType: { name: string } | null;
  region: { name: string } | null;
  spriteUrl: string | null;
}

export function TypeDetailsModal({ typeName, apiUrl, onClose, onPokemonClick, onTypeClick, onRegionClick }: TypeDetailsModalProps) {
  const [type, setType] = useState<TypeDetails | null>(null);
  const [pokemon, setPokemon] = useState<PokemonWithType[]>([]);
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
    if (!typeName) {
      setType(null);
      setPokemon([]);
      return;
    }

    setLoading(true);
    setError(null);

    // First, get the type details (by name or ID)
    // Then fetch Pokemon that have this type
    Promise.all([
      fetch(`${apiUrl}/catalog/types/${typeName}`),
      fetch(`${apiUrl}/catalog/types/${typeName}/pokemon`),
    ])
      .then(async ([typeRes, pokemonRes]) => {
        if (!typeRes.ok) {
          const errorText = await typeRes.text().catch(() => typeRes.statusText);
          throw new Error(`Failed to fetch type "${typeName}": ${typeRes.status} ${errorText}`);
        }
        if (!pokemonRes.ok) {
          const errorText = await pokemonRes.text().catch(() => pokemonRes.statusText);
          throw new Error(`Failed to fetch pokemon for type "${typeName}": ${pokemonRes.status} ${errorText}`);
        }
        const typeData = await typeRes.json();
        const pokemonData = await pokemonRes.json();
        setType(typeData);
        setPokemon(pokemonData);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [typeName, apiUrl]);

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
      if (e.key === 'Escape' && typeName) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [typeName, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (typeName) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [typeName]);

  if (!typeName) return null;

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

        {type && !loading && (
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <TypeBadge typeName={type.name} />
                <div>
                  <h2 className="text-3xl font-bold theme-text-primary mb-1">
                    {type.name}
                  </h2>
                  <p className="text-sm theme-text-secondary uppercase">
                    Pokémon Type
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

            {/* Pokemon that have this type */}
            <div>
              <h3 className="text-xl font-semibold theme-text-primary mb-3">
                Pokémon with this type ({pokemon.length})
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
                        <div className="text-center">
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
                  No Pokémon found with this type.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

