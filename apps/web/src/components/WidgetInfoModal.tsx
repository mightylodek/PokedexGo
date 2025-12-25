'use client';

import { useEffect, useRef } from 'react';

interface WidgetInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WidgetInfoModal({ isOpen, onClose }: WidgetInfoModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

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
            <h2 className="text-2xl font-bold theme-text-primary">Catalog Statistics</h2>
            <button
              onClick={onClose}
              className="text-2xl theme-text-secondary hover:theme-text-primary transition-colors"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Species */}
            <div className="border-b theme-border pb-4" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>Species</div>
              </div>
              <p className="theme-text-secondary">
                A <strong className="theme-text-primary">Species</strong> represents a unique Pokémon entry in the Pokédex. 
                Each species has a unique National Pokédex number (e.g., #001 Bulbasaur, #025 Pikachu). 
                A species can have multiple forms, but they all share the same base species identity.
              </p>
            </div>

            {/* Forms */}
            <div className="border-b theme-border pb-4" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="text-2xl font-bold" style={{ color: 'var(--accent-secondary)' }}>Forms</div>
              </div>
              <p className="theme-text-secondary">
                A <strong className="theme-text-primary">Form</strong> is a variant of a Pokémon species with different 
                stats, appearance, or abilities. For example, Pikachu has multiple forms (Normal, Cosplay, etc.), 
                and some Pokémon have regional forms (Alolan, Galarian, Hisuian). Each form has its own base stats 
                (Attack, Defense, Stamina) and may have different visual assets.
              </p>
            </div>

            {/* Types */}
            <div className="border-b theme-border pb-4" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="text-2xl font-bold horizons-accent-yellow sv-accent-gold">Types</div>
              </div>
              <p className="theme-text-secondary">
                A <strong className="theme-text-primary">Type</strong> is an elemental classification that determines 
                a Pokémon's strengths and weaknesses in battle. Each Pokémon species has a primary type and optionally 
                a secondary type. Types include Normal, Fire, Water, Grass, Electric, Psychic, and many others. 
                Type matchups determine how effective moves are in battle.
              </p>
            </div>

            {/* Moves */}
            <div className="pb-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-2xl font-bold horizons-accent-blue sv-accent-violet">Moves</div>
              </div>
              <p className="theme-text-secondary">
                A <strong className="theme-text-primary">Move</strong> is an attack or action that a Pokémon can use in battle. 
                Each move has a type, power, energy cost, and other properties that determine its effectiveness. 
                Moves can be learned by multiple Pokémon species and are essential for battle strategy.
              </p>
            </div>
          </div>

          {/* Close Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded font-medium text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

