'use client';

interface TypeBadgeProps {
  typeName: string;
  isPrimary?: boolean;
  onClick?: (typeName: string) => void;
}

// Pokemon type colors - will be overridden by theme accents but provide good defaults
const typeColors: Record<string, { bg: string; text: string }> = {
  normal: { bg: '#A8A878', text: '#fff' },
  fire: { bg: '#F08030', text: '#fff' },
  water: { bg: '#6890F0', text: '#fff' },
  electric: { bg: '#F8D030', text: '#000' },
  grass: { bg: '#78C850', text: '#fff' },
  ice: { bg: '#98D8D8', text: '#000' },
  fighting: { bg: '#C03028', text: '#fff' },
  poison: { bg: '#A040A0', text: '#fff' },
  ground: { bg: '#E0C068', text: '#000' },
  flying: { bg: '#A890F0', text: '#fff' },
  psychic: { bg: '#F85888', text: '#fff' },
  bug: { bg: '#A8B820', text: '#fff' },
  rock: { bg: '#B8A038', text: '#fff' },
  ghost: { bg: '#705898', text: '#fff' },
  dragon: { bg: '#7038F8', text: '#fff' },
  dark: { bg: '#705848', text: '#fff' },
  steel: { bg: '#B8B8D0', text: '#000' },
  fairy: { bg: '#EE99AC', text: '#fff' },
};

function normalizeTypeName(typeName: string): string {
  // Remove common prefixes like POKEMONTYPE, POKEMON_TYPE_, TYPE_, etc.
  let normalized = typeName.toUpperCase();
  normalized = normalized.replace(/^POKEMON_TYPE_?/i, '');
  normalized = normalized.replace(/^POKEMONTYPE/i, '');
  normalized = normalized.replace(/^TYPE_?/i, '');
  // Convert to title case for display
  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
}

export function TypeBadge({ typeName, isPrimary = false, onClick }: TypeBadgeProps) {
  const normalizedType = normalizeTypeName(typeName);
  const typeKey = normalizedType.toLowerCase();
  const colors = typeColors[typeKey] || { bg: '#A8A878', text: '#fff' }; // Default to normal type colors
  
  return (
    <span 
      className={`px-2 py-1 rounded text-xs font-medium inline-block ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      style={{ 
        backgroundColor: colors.bg,
        color: colors.text,
        opacity: 0.9,
        textTransform: 'capitalize'
      }}
      onClick={onClick ? (e) => {
        e.stopPropagation();
        onClick(typeName);
      } : undefined}
    >
      {normalizedType}
    </span>
  );
}

