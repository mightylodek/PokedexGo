'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { TypeBadge } from './TypeBadge';
import { MoveDetailsModal } from './MoveDetailsModal';
import { TypeDetailsModal } from './TypeDetailsModal';
import { TypeMovesModal } from './TypeMovesModal';
import { RegionModal } from './RegionModal';
import { getWeakAgainstTypes, getStrongAgainstTypes } from '../utils/typeEffectiveness';
import { getBulbapediaRegionUrl, hasBulbapediaRegionPage } from '../lib/bulbapedia-utils';

interface PokemonProfileModalProps {
  pokemonId: string | null;
  apiUrl: string;
  onClose: () => void;
  onPokemonClick?: (pokemonId: string) => void;
}

interface EvolutionChainMember {
  id: string;
  dexNumber: number;
  name: string;
  primaryType: { name: string };
  spriteUrl: string | null;
}

interface PokemonDetails {
  id: string;
  dexNumber: number;
  name: string;
  generation: number;
  isLegendary: boolean;
  isMythical: boolean;
  primaryType: { name: string };
  secondaryType: { name: string } | null;
  region: { name: string } | null;
  evolutionChain?: EvolutionChainMember[];
  forms: Array<{
    id: string;
    formName: string;
    formKey: string;
    isDefault: boolean;
    baseAttack: number;
    baseDefense: number;
    baseStamina: number;
    moves: Array<{
      move: {
        id: string;
        name: string;
        category: string;
        power: number;
        type: { name: string };
      };
      learnMethod: string;
    }>;
    assets: Array<{
      asset: {
        path: string;
        mimeType: string;
      };
    }>;
  }>;
}

export function PokemonProfileModal({ pokemonId, apiUrl, onClose, onPokemonClick }: PokemonProfileModalProps) {
  const [pokemon, setPokemon] = useState<PokemonDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMoveId, setSelectedMoveId] = useState<string | null>(null);
  const [selectedTypeName, setSelectedTypeName] = useState<string | null>(null);
  const [selectedMoveTypeName, setSelectedMoveTypeName] = useState<string | null>(null);
  const [selectedRegionName, setSelectedRegionName] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<{ y: number; scrollTop: number; startY: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance (in px) to trigger close
  const minSwipeDistance = 50;
  // Maximum distance from top of modal to allow swipe-to-close
  const swipeZoneHeight = 100;

  useEffect(() => {
    if (!pokemonId) {
      setPokemon(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`${apiUrl}/catalog/pokemon/${pokemonId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch pokemon: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setPokemon(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [pokemonId, apiUrl]);

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
      if (e.key === 'Escape' && pokemonId) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [pokemonId, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (pokemonId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [pokemonId]);

  // Calculate weak against types (must be before any conditional returns)
  const weakAgainstTypes = useMemo(() => {
    if (!pokemon) return [];
    return getWeakAgainstTypes(
      pokemon.primaryType.name,
      pokemon.secondaryType?.name || null
    );
  }, [pokemon]);

  // Calculate strong against types (must be before any conditional returns)
  const strongAgainstTypes = useMemo(() => {
    if (!pokemon) return [];
    return getStrongAgainstTypes(
      pokemon.primaryType.name,
      pokemon.secondaryType?.name || null
    );
  }, [pokemon]);

  if (!pokemonId) return null;

  // Hide Pokemon modal when Move modal is open
  if (selectedMoveId) {
    return (
      <MoveDetailsModal
        moveId={selectedMoveId}
        apiUrl={apiUrl}
        onClose={() => setSelectedMoveId(null)}
        onPokemonClick={(pokemonId) => {
          setSelectedMoveId(null);
          if (onPokemonClick) {
            onPokemonClick(pokemonId);
          }
        }}
        onMoveClick={(moveId) => setSelectedMoveId(moveId)}
      />
    );
  }

  // Hide Pokemon modal when Move Type modal is open
  if (selectedMoveTypeName) {
    return (
      <TypeMovesModal
        typeName={selectedMoveTypeName}
        apiUrl={apiUrl}
        onClose={() => setSelectedMoveTypeName(null)}
        onMoveClick={(moveId) => {
          setSelectedMoveTypeName(null);
          setSelectedMoveId(moveId);
        }}
        onTypeClick={(typeName) => setSelectedMoveTypeName(typeName)}
      />
    );
  }

  // Hide Pokemon modal when Region modal is open
  if (selectedRegionName) {
    return (
      <RegionModal
        regionName={selectedRegionName}
        apiUrl={apiUrl}
        onClose={() => setSelectedRegionName(null)}
        onPokemonClick={(pokemonId) => {
          setSelectedRegionName(null);
          if (onPokemonClick) {
            onPokemonClick(pokemonId);
          }
        }}
        onTypeClick={(typeName) => {
          setSelectedRegionName(null);
          setSelectedTypeName(typeName);
        }}
        onRegionClick={(regionName) => setSelectedRegionName(regionName)}
      />
    );
  }

  // Hide Pokemon modal when Type modal is open
  if (selectedTypeName) {
    return (
      <TypeDetailsModal
        typeName={selectedTypeName}
        apiUrl={apiUrl}
        onClose={() => setSelectedTypeName(null)}
        onPokemonClick={(pokemonId) => {
          setSelectedTypeName(null);
          if (onPokemonClick) {
            onPokemonClick(pokemonId);
          }
        }}
        onTypeClick={(typeName) => setSelectedTypeName(typeName)}
        onRegionClick={(regionName) => {
          setSelectedTypeName(null);
          setSelectedRegionName(regionName);
        }}
      />
    );
  }

  const defaultForm = pokemon?.forms.find((f) => f.isDefault) || pokemon?.forms[0];
  const spriteAsset = defaultForm?.assets?.find((a) => a.asset)?.asset;
  const spriteUrl = spriteAsset?.path
    ? spriteAsset.path.startsWith('http')
      ? spriteAsset.path
      : `${apiUrl}${spriteAsset.path}`
    : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon?.dexNumber || 0}.png`;

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

        {pokemon && !loading && (
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <img
                  src={spriteUrl}
                  alt={pokemon.name}
                  className="w-24 h-24 object-contain"
                  style={{ width: '96px', height: '96px' }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes('PokeAPI')) {
                      target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.dexNumber}.png`;
                    }
                  }}
                />
                <div>
                  <h2 className="text-3xl font-bold theme-text-primary mb-1">
                    {pokemon.name}
                  </h2>
                  <p className="text-lg theme-text-secondary">#{pokemon.dexNumber}</p>
                  <div className="flex gap-2 mt-2">
                    <TypeBadge 
                      typeName={pokemon.primaryType.name} 
                      onClick={setSelectedTypeName}
                    />
                    {pokemon.secondaryType && (
                      <TypeBadge 
                        typeName={pokemon.secondaryType.name}
                        onClick={setSelectedTypeName}
                      />
                    )}
                  </div>
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

            {/* Basic Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="theme-bg-secondary rounded p-3 border theme-border">
                <div className="text-sm theme-text-secondary">Generation</div>
                <div className="text-lg font-semibold theme-text-primary">Gen {pokemon.generation}</div>
              </div>
              <div 
                className="theme-bg-secondary rounded p-3 border theme-border cursor-pointer hover:theme-bg-hover transition-colors"
                onClick={() => setSelectedRegionName(pokemon.region?.name || 'None')}
              >
                <div className="text-sm theme-text-secondary">Region</div>
                {pokemon.region ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRegionName(pokemon.region!.name);
                      }}
                      className="text-lg font-semibold theme-text-primary hover:opacity-80 transition-all text-left flex-1"
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
                      {pokemon.region.name}
                    </button>
                    {hasBulbapediaRegionPage(pokemon.region.name) && (
                      <a
                        href={getBulbapediaRegionUrl(pokemon.region.name) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs theme-text-secondary hover:theme-text-primary transition-colors"
                        title="View on Bulbapedia"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3"
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
                      </a>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRegionName('None');
                    }}
                    className="text-lg font-semibold theme-text-secondary hover:opacity-80 transition-all text-left w-full"
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
                    None
                  </button>
                )}
              </div>
              {pokemon.isLegendary && (
                <div className="theme-bg-secondary rounded p-3 border theme-border">
                  <div className="text-sm theme-text-secondary">Legendary</div>
                  <div className="text-lg font-semibold theme-text-primary">Yes</div>
                </div>
              )}
              {pokemon.isMythical && (
                <div className="theme-bg-secondary rounded p-3 border theme-border">
                  <div className="text-sm theme-text-secondary">Mythical</div>
                  <div className="text-lg font-semibold theme-text-primary">Yes</div>
                </div>
              )}
            </div>

            {/* Weak Against & Strong Against */}
            {(weakAgainstTypes.length > 0 || strongAgainstTypes.length > 0) && (
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Weak Against */}
                  {weakAgainstTypes.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold theme-text-primary mb-3">Weak Against</h3>
                      <div className="flex flex-wrap gap-2">
                        {weakAgainstTypes.map((typeName) => (
                          <TypeBadge
                            key={typeName}
                            typeName={typeName}
                            onClick={setSelectedTypeName}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Strong Against */}
                  {strongAgainstTypes.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold theme-text-primary mb-3">Strong Against</h3>
                      <div className="flex flex-wrap gap-2">
                        {strongAgainstTypes.map((typeName) => (
                          <TypeBadge
                            key={typeName}
                            typeName={typeName}
                            onClick={setSelectedTypeName}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Forms */}
            {pokemon.forms.length > 1 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold theme-text-primary mb-3">Forms</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {pokemon.forms.map((form) => (
                    <div
                      key={form.id}
                      className="theme-bg-secondary rounded p-3 border theme-border"
                    >
                      <div className="font-medium theme-text-primary">{form.formName}</div>
                      <div className="text-sm theme-text-secondary mt-1">
                        ATK: {form.baseAttack} | DEF: {form.baseDefense} | STA: {form.baseStamina}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Evolution Chain */}
            {pokemon.evolutionChain && pokemon.evolutionChain.length > 1 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold theme-text-primary mb-3">Evolution Chain</h3>
                <div className="flex items-center gap-4 flex-wrap">
                  {pokemon.evolutionChain.map((evo, index) => {
                    const isCurrent = evo.id === pokemon.id;
                    const spriteUrl = evo.spriteUrl
                      ? evo.spriteUrl.startsWith('http')
                        ? evo.spriteUrl
                        : `${apiUrl}${evo.spriteUrl}`
                      : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evo.dexNumber}.png`;

                    return (
                      <div key={evo.id} className="flex items-center gap-2">
                        {index > 0 && (
                          <span className="text-2xl theme-text-secondary">→</span>
                        )}
                        <div
                          className={`flex flex-col items-center gap-2 p-3 rounded border transition-all ${
                            isCurrent
                              ? 'theme-bg-hover border-2'
                              : 'theme-bg-secondary theme-border border cursor-pointer hover:theme-bg-hover'
                          }`}
                          style={{
                            borderColor: isCurrent ? 'var(--accent-primary)' : 'var(--border-color)',
                          }}
                          onClick={() => {
                            if (!isCurrent && onPokemonClick) {
                              onPokemonClick(evo.id);
                            }
                          }}
                        >
                          <img
                            src={spriteUrl}
                            alt={evo.name}
                            className="w-16 h-16 object-contain"
                            style={{ width: '64px', height: '64px' }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (!target.src.includes('PokeAPI')) {
                                target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evo.dexNumber}.png`;
                              }
                            }}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isCurrent && onPokemonClick) {
                                onPokemonClick(evo.id);
                              }
                            }}
                            className={`text-sm font-medium transition-all ${
                              isCurrent
                                ? 'theme-text-primary'
                                : 'theme-text-primary hover:opacity-80 cursor-pointer'
                            }`}
                            style={{
                              textDecoration: 'none',
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              font: 'inherit',
                            }}
                          >
                            {evo.name}
                          </button>
                          <span className="text-xs theme-text-secondary">#{evo.dexNumber}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Moves */}
            {defaultForm && defaultForm.moves.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold theme-text-primary mb-3">Moves</h3>
                <div className="space-y-2">
                  {defaultForm.moves.map((formMove) => (
                    <div
                      key={`${formMove.move.id}-${formMove.learnMethod}`}
                      className="theme-bg-secondary rounded p-3 border theme-border flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <TypeBadge 
                          typeName={formMove.move.type.name}
                          onClick={setSelectedMoveTypeName}
                        />
                        <button
                          onClick={() => setSelectedMoveId(formMove.move.id)}
                          className="font-medium theme-text-primary hover:opacity-80 transition-all cursor-pointer text-left"
                          style={{
                            textDecoration: 'none',
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            font: 'inherit',
                          }}
                        >
                          {formMove.move.name}
                        </button>
                        <span className="text-sm theme-text-secondary">
                          ({formMove.move.category})
                        </span>
                      </div>
                      <div className="text-sm theme-text-secondary">
                        Power: {formMove.move.power}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

