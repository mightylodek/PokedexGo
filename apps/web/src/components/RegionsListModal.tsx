'use client';

import { useEffect, useRef, useState } from 'react';
import { getBulbapediaRegionUrl, hasBulbapediaRegionPage } from '../lib/bulbapedia-utils';

interface RegionsListModalProps {
  isOpen: boolean;
  apiUrl: string;
  onClose: () => void;
  onRegionClick: (regionName: string) => void;
}

interface RegionStats {
  withRegion: number;
  withoutRegion: number;
  regions: Array<{
    id: string;
    name: string;
    pokemonCount: number;
  }>;
}

export function RegionsListModal({ isOpen, apiUrl, onClose, onRegionClick }: RegionsListModalProps) {
  const [regionStats, setRegionStats] = useState<RegionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setRegionStats(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`${apiUrl}/catalog/regions/stats`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch region stats: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setRegionStats(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, apiUrl]);

  // Close on escape key
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

        {regionStats && !loading && (
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold theme-text-primary mb-1">
                  Regions
                </h2>
                <p className="text-sm theme-text-secondary">
                  Click on a region to see all Pokémon from that region
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-2xl theme-text-secondary hover:theme-text-primary transition-colors"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Regions List */}
            <div className="space-y-2">
              {/* None Region */}
              {regionStats.withoutRegion > 0 && (
                <button
                  onClick={() => {
                    onClose();
                    onRegionClick('None');
                  }}
                  className="w-full theme-bg-secondary rounded p-4 border theme-border cursor-pointer hover:theme-bg-hover transition-all flex items-center justify-between text-left"
                >
                  <div>
                    <div className="text-lg font-semibold theme-text-primary">No Region</div>
                    <div className="text-sm theme-text-secondary">Pokémon without a region</div>
                  </div>
                  <div className="text-xl font-bold theme-text-primary">{regionStats.withoutRegion}</div>
                </button>
              )}

              {/* All Regions */}
              {regionStats.regions.map((region) => (
                <div
                  key={region.id}
                  className="w-full theme-bg-secondary rounded p-4 border theme-border hover:theme-bg-hover transition-all flex items-center justify-between"
                >
                  <button
                    onClick={() => {
                      onClose();
                      onRegionClick(region.name);
                    }}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-semibold theme-text-primary">{region.name}</div>
                      {hasBulbapediaRegionPage(region.name) && (
                        <a
                          href={getBulbapediaRegionUrl(region.name) || '#'}
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
                    <div className="text-sm theme-text-secondary">Pokémon from {region.name}</div>
                  </button>
                  <div className="text-xl font-bold theme-text-primary">{region.pokemonCount}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

