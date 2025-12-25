/**
 * Generate Bulbapedia URL for a Pokemon region
 * @param regionName - The name of the region
 * @returns The Bulbapedia URL for the region, or null if not a valid region
 */
export function getBulbapediaRegionUrl(regionName: string | null): string | null {
  if (!regionName || regionName.toLowerCase() === 'none') {
    return null;
  }

  // Map of region names to their Bulbapedia page names
  // Most regions follow the pattern "{Region}_region", but some have special names
  const regionMap: Record<string, string> = {
    'Kanto': 'Kanto',
    'Johto': 'Johto',
    'Hoenn': 'Hoenn',
    'Sinnoh': 'Sinnoh',
    'Unova': 'Unova',
    'Kalos': 'Kalos',
    'Alola': 'Alola',
    'Galar': 'Galar',
    'Paldea': 'Paldea',
    'Hisui': 'Hisui',
    'Kitakami': 'Kitakami',
    // Handle variations and alternate names
    'Kanto Region': 'Kanto',
    'Johto Region': 'Johto',
    'Hoenn Region': 'Hoenn',
    'Sinnoh Region': 'Sinnoh',
    'Unova Region': 'Unova',
    'Kalos Region': 'Kalos',
    'Alola Region': 'Alola',
    'Galar Region': 'Galar',
    'Paldea Region': 'Paldea',
    'Hisui Region': 'Hisui',
    'Kitakami Region': 'Kitakami',
  };

  // Normalize the region name
  const normalizedName = regionName.trim();
  
  // Check if we have a direct mapping
  if (regionMap[normalizedName]) {
    return `https://bulbapedia.bulbagarden.net/wiki/${regionMap[normalizedName]}_region`;
  }

  // If no mapping, try to construct the URL from the region name
  // Replace spaces with underscores and capitalize properly
  const urlSafeName = normalizedName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('_');

  return `https://bulbapedia.bulbagarden.net/wiki/${urlSafeName}_region`;
}

/**
 * Check if a region name is likely to have a Bulbapedia page
 */
export function hasBulbapediaRegionPage(regionName: string | null): boolean {
  if (!regionName || regionName.toLowerCase() === 'none') {
    return false;
  }
  
  // List of known regions that have Bulbapedia pages
  const knownRegions = [
    'Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Unova', 
    'Kalos', 'Alola', 'Galar', 'Paldea', 'Hisui', 'Kitakami'
  ];
  
  const normalizedName = regionName.trim();
  
  // Check if it's a known region (case-insensitive)
  return knownRegions.some(known => 
    known.toLowerCase() === normalizedName.toLowerCase() ||
    normalizedName.toLowerCase().includes(known.toLowerCase())
  );
}

