'use client';

import { useEffect, useRef, useState } from 'react';

interface ItemProfileModalProps {
  itemId: string | null;
  apiUrl: string;
  onClose: () => void;
}

interface ItemDetails {
  id: string;
  itemKey: string;
  name: string;
  type: string;
  description: string | null;
  features: string | null;
  obtainedFrom: string | null;
  spritePath: string | null;
}

function ItemImageComponent({ spritePath, name, apiUrl }: { spritePath: string | null; name: string; apiUrl: string }) {
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
    <div className="w-24 h-24 flex items-center justify-center flex-shrink-0 theme-bg-secondary rounded overflow-hidden">
      {imageSrc && !imageError ? (
        <img 
          src={imageSrc} 
          alt={name} 
          className="w-full h-full object-contain max-w-full max-h-full" 
          onError={handleError}
          style={{ maxWidth: '96px', maxHeight: '96px' }}
        />
      ) : (
        <span className="text-lg theme-text-muted">?</span>
      )}
    </div>
  );
}

export function ItemProfileModal({ itemId, apiUrl, onClose }: ItemProfileModalProps) {
  const [item, setItem] = useState<ItemDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!itemId) {
      setItem(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`${apiUrl}/items/${itemId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch item: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setItem(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [itemId, apiUrl]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (itemId) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [itemId, onClose]);

  if (!itemId) {
    return null;
  }

  const formatItemType = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const parseFeatures = (features: string | null) => {
    if (!features) return null;
    try {
      return JSON.parse(features);
    } catch {
      return features;
    }
  };

  const features = parseFeatures(item?.features || null);

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
        className="theme-bg-card rounded-lg theme-shadow-lg border theme-border max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {loading && (
          <div className="p-8 text-center">
            <p className="theme-text-primary">Loading...</p>
          </div>
        )}

        {error && (
          <div className="p-8">
            <p className="text-red-600 dark:text-red-400">Error: {error}</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 rounded theme-bg-secondary theme-text-primary"
            >
              Close
            </button>
          </div>
        )}

        {item && !loading && !error && (
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <ItemImageComponent spritePath={item.spritePath} name={item.name} apiUrl={apiUrl} />
                <div>
                  <h2 className="text-3xl font-bold theme-text-primary mb-2">{item.name}</h2>
                  <div className="inline-block px-3 py-1 rounded-full text-sm font-medium theme-bg-secondary theme-text-secondary">
                    {formatItemType(item.type)}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded hover:theme-bg-hover transition-colors"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 theme-text-secondary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {item.description && (
                <div>
                  <h3 className="text-lg font-semibold theme-text-primary mb-2">Description</h3>
                  <p className="theme-text-secondary">{item.description}</p>
                </div>
              )}

              {features && (
                <div>
                  <h3 className="text-lg font-semibold theme-text-primary mb-2">Features</h3>
                  {typeof features === 'object' ? (
                    <ul className="list-disc list-inside space-y-1 theme-text-secondary">
                      {Object.entries(features).map(([key, value]) => (
                        <li key={key}>
                          <strong>{key}:</strong> {String(value)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="theme-text-secondary">{String(features)}</p>
                  )}
                </div>
              )}

              {item.obtainedFrom && (
                <div>
                  <h3 className="text-lg font-semibold theme-text-primary mb-2">How to Obtain</h3>
                  <p className="theme-text-secondary">{item.obtainedFrom}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

