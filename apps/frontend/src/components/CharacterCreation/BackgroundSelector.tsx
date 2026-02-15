import { useEffect, useState, useMemo } from 'react';
import { dataAPI } from '../../services/api';
import type { BackgroundInfo } from '../../types/character';
import BackgroundInfoModal from './BackgroundInfoModal';

interface BackgroundSelectorProps {
  selectedBackground?: string;
  onSelect: (background: string) => void;
  enabledSources: string[];
}

const BackgroundSelector = ({ selectedBackground, onSelect, enabledSources }: BackgroundSelectorProps) => {
  const [allBackgrounds, setAllBackgrounds] = useState<BackgroundInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [infoBackgroundName, setInfoBackgroundName] = useState<string | null>(null);

  useEffect(() => {
    const fetchBackgrounds = async () => {
      try {
        const data = await dataAPI.getBackgrounds();
        setAllBackgrounds(data);
      } catch (err) {
        setError('Failed to load backgrounds');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBackgrounds();
  }, []);

  // Filter by enabled sources, then merge duplicates by name
  const backgrounds = useMemo(() => {
    const filtered = allBackgrounds.filter(bg => enabledSources.includes(bg.source));
    const merged = filtered.reduce<Record<string, BackgroundInfo>>((acc, bg) => {
      const existing = acc[bg.name];
      if (existing) {
        const existingSources = existing.source.split(', ');
        if (!existingSources.includes(bg.source)) {
          existing.source = `${existing.source}, ${bg.source}`;
        }
      } else {
        acc[bg.name] = { ...bg };
      }
      return acc;
    }, {});
    return Object.values(merged);
  }, [allBackgrounds, enabledSources]);

  if (loading) return <div className="loading">Loading backgrounds...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="background-selector">
      <p className="step-description">
        Your character's background represents how they spent their years leading up to a life of adventure.
      </p>

      <div className="background-list">
        {backgrounds.map((background) => (
          <div
            key={background.name}
            className={`background-item ${selectedBackground === background.name ? 'selected' : ''}`}
            onClick={() => onSelect(background.name)}
          >
            <div className="background-item-header">
              <h3>{background.name}</h3>
              <button
                className="info-btn"
                title={`More info about ${background.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setInfoBackgroundName(background.name);
                }}
              >
                i
              </button>
            </div>
            <span className="source">{background.source}</span>
          </div>
        ))}
      </div>

      {infoBackgroundName && (
        <BackgroundInfoModal
          backgroundName={infoBackgroundName}
          onClose={() => setInfoBackgroundName(null)}
        />
      )}
    </div>
  );
};

export default BackgroundSelector;
