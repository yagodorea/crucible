import { useEffect, useState, useMemo } from 'react';
import { dataAPI } from '../../services/api';
import type { RaceInfo } from '../../types/character';
import SpeciesInfoModal from './SpeciesInfoModal';

interface SpeciesSelectorProps {
  selectedSpecies?: string;
  onSelect: (species: string) => void;
  enabledSources: string[];
}

const SpeciesSelector = ({ selectedSpecies, onSelect, enabledSources }: SpeciesSelectorProps) => {
  const [races, setRaces] = useState<RaceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [infoSpeciesName, setInfoSpeciesName] = useState<string | null>(null);

  useEffect(() => {
    const fetchRaces = async () => {
      try {
        const data = await dataAPI.getRaces();
        setRaces(data);
      } catch (err) {
        setError('Failed to load species');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRaces();
  }, []);

  // Filter by enabled sources, then merge duplicates by name
  const species = useMemo(() => {
    const filtered = races.filter(r => enabledSources.includes(r.source));
    const merged = filtered.reduce<Record<string, RaceInfo>>((acc, race) => {
      const existing = acc[race.name];
      if (existing) {
        const existingSources = existing.source.split(', ');
        if (!existingSources.includes(race.source)) {
          existing.source = `${existing.source}, ${race.source}`;
        }
      } else {
        acc[race.name] = { ...race };
      }
      return acc;
    }, {});
    return Object.values(merged);
  }, [races, enabledSources]);

  if (loading) return <div className="loading">Loading species...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="species-selector">
      <p className="step-description">
        Choose your character's species, which determines certain physical characteristics and natural abilities.
      </p>

      <div className="species-list">
        {species.map((race) => (
          <div
            key={race.name}
            className={`species-item ${selectedSpecies === race.name ? 'selected' : ''}`}
            onClick={() => onSelect(race.name)}
          >
            <div className="species-item-header">
              <h3>{race.name}</h3>
              <button
                className="info-btn"
                title={`More info about ${race.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setInfoSpeciesName(race.name);
                }}
              >
                i
              </button>
            </div>
            <div className="species-info">
              {race.size && <span className="detail">Size: {race.size.join(', ')}</span>}
              {race.speed?.walk && <span className="detail">Speed: {race.speed.walk} ft.</span>}
            </div>
          </div>
        ))}
      </div>

      {infoSpeciesName && (
        <SpeciesInfoModal
          speciesName={infoSpeciesName}
          onClose={() => setInfoSpeciesName(null)}
        />
      )}
    </div>
  );
};

export default SpeciesSelector;
