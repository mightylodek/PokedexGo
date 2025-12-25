'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ItemProfileModal } from '../../components/ItemProfileModal';
import { getApiUrl } from '../../lib/api-utils';

interface ItemStats {
  total: number;
  byType: Record<string, number>;
}

interface Item {
  id: string;
  itemKey: string;
  name: string;
  type: string;
  description: string | null;
  features: string | null;
  obtainedFrom: string | null;
  spritePath: string | null;
}

export default function ItemsPage() {
  const [stats, setStats] = useState<ItemStats | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number | 'all'>(20);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [apiUrl, setApiUrl] = useState<string>('');

  // Calculate API URL on client side to ensure window is available
  useEffect(() => {
    setApiUrl(getApiUrl());
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/items/stats`);
      if (!res.ok) {
        throw new Error(`Failed to fetch stats: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch stats');
    }
  }, [apiUrl]);

  // Fetch all items for filtering
  const fetchAllItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${apiUrl}/items?skip=0&take=10000`;
      const res = await fetch(url);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch items: ${res.status} ${res.statusText}. ${errorText}`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setAllItems(data);
      } else {
        console.error('Expected array but got:', typeof data, data);
        setError('Invalid response format: expected array');
      }
    } catch (error) {
      console.error('Error fetching all items:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    if (apiUrl) {
      fetchStats();
      fetchAllItems();
    }
  }, [apiUrl, fetchStats, fetchAllItems]);

  // Apply filters to all items
  const filteredItems = useMemo(() => {
    let filtered = allItems;

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter((item) => item.type === selectedType);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.itemKey.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allItems, selectedType, searchQuery]);

  // Apply pagination to filtered results
  const paginatedItems = useMemo(() => {
    if (pageSize === 'all') {
      return filteredItems;
    }
    const start = page * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  // Update displayed items when filters or pagination change
  useEffect(() => {
    setItems(paginatedItems);
  }, [paginatedItems]);

  // Reset to page 0 when pageSize or filters change
  useEffect(() => {
    setPage(0);
  }, [pageSize, selectedType, searchQuery]);

  const formatItemType = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Component to render item image with placeholder
  const ItemImage = ({ spritePath, name, apiUrl }: { spritePath: string | null; name: string; apiUrl: string }) => {
    const [imageError, setImageError] = useState(false);
    const [imageSrc, setImageSrc] = useState<string | null>(
      spritePath ? (spritePath.startsWith('http') ? spritePath : `${apiUrl}${spritePath}`) : null
    );

    const handleError = () => {
      if (!imageSrc) {
        setImageError(true);
        return;
      }
      // Try alternative URL format
      if (imageSrc.includes('ITEM_')) {
        // Try without ITEM_ prefix
        const altSrc = imageSrc.replace('/ITEM_', '/');
        setImageSrc(altSrc);
      } else {
        // Try with ITEM_ prefix
        const urlParts = imageSrc.split('/');
        const filename = urlParts[urlParts.length - 1];
        urlParts[urlParts.length - 1] = `ITEM_${filename}`;
        setImageSrc(urlParts.join('/'));
      }
      // If retry also fails, show placeholder
      setTimeout(() => setImageError(true), 100);
    };

    return (
      <div className="w-12 h-12 flex items-center justify-center flex-shrink-0 theme-bg-secondary rounded overflow-hidden">
        {imageSrc && !imageError ? (
          <img 
            src={imageSrc} 
            alt={name} 
            className="w-full h-full object-contain max-w-full max-h-full" 
            onError={handleError}
            style={{ maxWidth: '48px', maxHeight: '48px' }}
          />
        ) : (
          <span className="text-xs theme-text-muted">?</span>
        )}
      </div>
    );
  };

  const getAvailableTypes = useMemo(() => {
    const types = new Set(allItems.map((item) => item.type));
    return Array.from(types).sort();
  }, [allItems]);

  if (loading && items.length === 0) {
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
        <h1 className="text-4xl font-bold mb-6 theme-text-primary">Items Catalog</h1>

        {error && (
          <div className="mb-6 p-4 rounded-lg border border-red-500 bg-red-50 dark:bg-red-900/20">
            <p className="text-red-700 dark:text-red-400 font-semibold">Error: {error}</p>
            <button
              onClick={() => {
                setError(null);
                fetchStats();
                fetchAllItems();
              }}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="theme-bg-card rounded-lg theme-shadow p-6 border theme-border">
              <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>
                {stats.total}
              </div>
              <div className="text-sm theme-text-secondary">Total Items</div>
            </div>
            {Object.keys(stats.byType).length > 0 && (
              <div className="theme-bg-card rounded-lg theme-shadow p-6 border theme-border">
                <div className="text-2xl font-bold" style={{ color: 'var(--accent-secondary)' }}>
                  {Object.keys(stats.byType).length}
                </div>
                <div className="text-sm theme-text-secondary">Item Types</div>
              </div>
            )}
          </div>
        )}

        {/* Items List */}
        <div className="theme-bg-card rounded-lg theme-shadow p-6 border theme-border">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <h2 className="text-2xl font-semibold theme-text-primary">Items</h2>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Search */}
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-1 rounded border theme-border theme-bg-card theme-text-primary text-sm flex-1 md:flex-none md:w-48"
              />
              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-1 rounded border theme-border theme-bg-card theme-text-primary text-sm cursor-pointer"
              >
                <option value="all">All Types</option>
                {getAvailableTypes.map((type) => (
                  <option key={type} value={type}>
                    {formatItemType(type)}
                  </option>
                ))}
              </select>
              {/* Page Size */}
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
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                    Obtained From
                  </th>
                </tr>
              </thead>
              <tbody className="theme-bg-card divide-y" style={{ borderColor: 'var(--border-color)' }}>
                {items.map((item) => (
                  <tr key={item.id} className="hover:theme-bg-hover transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium theme-text-primary">
                      <div className="flex items-center gap-3">
                        <ItemImage spritePath={item.spritePath} name={item.name} apiUrl={apiUrl} />
                        <button
                          onClick={() => setSelectedItemId(item.id)}
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
                          {item.name}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm theme-text-secondary">
                      <span className="inline-block px-2 py-1 rounded text-xs theme-bg-secondary">
                        {formatItemType(item.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm theme-text-secondary">
                      {item.description ? (
                        <span className="line-clamp-2">{item.description}</span>
                      ) : (
                        <span className="text-gray-400">No description</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm theme-text-secondary">
                      {item.obtainedFrom || <span className="text-gray-400">Unknown</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length === 0 && (
              <p className="text-center theme-text-muted py-8">
                {allItems.length === 0
                  ? 'No items data yet. Run ingestion to populate.'
                  : 'No items match your filters.'}
              </p>
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
                  color: 'white',
                }}
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={(page + 1) * pageSize >= filteredItems.length}
                className="px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: (page + 1) * pageSize >= filteredItems.length ? 'var(--bg-hover)' : 'var(--accent-primary)',
                  color: 'white',
                }}
              >
                Next
              </button>
            </div>
          )}
          {pageSize === 'all' && filteredItems.length > 0 && (
            <div className="mt-4 text-sm theme-text-secondary text-center">
              Showing all {filteredItems.length} items
            </div>
          )}
          {(selectedType !== 'all' || searchQuery.trim()) && (
            <div className="mt-4 text-sm theme-text-secondary text-center">
              {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''} match your filter
              {selectedType !== 'all' && searchQuery.trim() ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Item Profile Modal */}
      <ItemProfileModal
        itemId={selectedItemId}
        apiUrl={apiUrl}
        onClose={() => setSelectedItemId(null)}
      />
    </div>
  );
}

