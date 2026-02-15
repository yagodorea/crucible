import { useEffect, useState } from 'react';
import { dataAPI } from '../../services/api';
import type { RaceInfo } from '../../types/character';

interface SpeciesSelectorProps {
  selectedSpecies?: string;
  onSelect: (species: string) => void;
  enabledSources: string[];
}

const SpeciesSelector = ({ selectedSpecies, onSelect, enabledSources }: SpeciesSelectorProps) => {
  const [races, setRaces] = useState<RaceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const filteredRaces = races.filter(r => enabledSources.includes(r.source));

  if (loading) return <div className="loading">Loading species...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="species-selector">
      <p className="step-description">
        Choose your character's species, which determines certain physical characteristics and natural abilities.
      </p>

      <div className="species-list">
        {filteredRaces.map((race) => (
          <div
            key={race.name}
            className={`species-item ${selectedSpecies === race.name ? 'selected' : ''}`}
            onClick={() => onSelect(race.name)}
          >
            <h3>{race.name}</h3>
            <div className="species-info">
              {race.size && <span className="detail">Size: {race.size.join(', ')}</span>}
              {race.speed?.walk && <span className="detail">Speed: {race.speed.walk} ft.</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpeciesSelector;
