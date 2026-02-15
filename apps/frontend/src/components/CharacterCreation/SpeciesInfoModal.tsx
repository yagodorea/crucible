import { useEffect, useState } from 'react';
import { dataAPI } from '../../services/api';
import type { RaceDetailInfo } from '../../types/character';

interface SpeciesInfoModalProps {
  speciesName: string;
  onClose: () => void;
}

const SOURCE_LABELS: Record<string, string> = {
  'PHB': 'Player\'s Handbook (2014)',
  'XPHB': 'Player\'s Handbook (2024)',
  'ERLW': 'Eberron: Rising from the Last War',
  'EFA': 'Eberron: Forge of the Artificer',
  'EGW': 'Explorer\'s Guide to Wildemount',
  'TDCSR': 'Tal\'Dorei Campaign Setting Reborn',
  'MTF': 'Mordenkainen\'s Tome of Foes',
  'SCAG': 'Sword Coast Adventurer\'s Guide',
  'GGR': 'Guildmasters\' Guide to Ravnica',
  'PSZ': 'Plane Shift: Zendikar',
  'VRGR': 'Van Richten\'s Guide to Ravenloft',
  'VGM': 'Volo\'s Guide to Monsters',
  'LFL': 'Lorwyn: First Light',
  'ID RotF': 'Icewind Dale: Rime of the Frostmaiden',
  'DMG': 'Dungeon Master\'s Guide',
  'EEPC': 'Elemental Evil Player\' Companion',
  'MPMM': 'Mordenkainen Presents: Monsters of the Multiverse',
};

const ABILITY_LABELS: Record<string, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
};

const SIZE_LABELS: Record<string, string> = {
  'S': 'Small',
  'M': 'Medium',
  'L': 'Large',
  'H': 'Huge',
  'G': 'Gargantuan',
};

function getSourceLabel(source: string): string {
  return SOURCE_LABELS[source] || source;
}

const SpeciesInfoModal = ({ speciesName, onClose }: SpeciesInfoModalProps) => {
  const [detail, setDetail] = useState<RaceDetailInfo | null>(null);
  const [selectedSourceIndex, setSelectedSourceIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const data = await dataAPI.getRaceDetail(speciesName);
        setDetail(data);
      } catch {
        setError('Failed to load species details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [speciesName]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={handleBackdropClick}>
        <div className="modal-content">
          <button className="modal-close" onClick={onClose}>&times;</button>
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modal-overlay" onClick={handleBackdropClick}>
        <div className="modal-content">
          <button className="modal-close" onClick={onClose}>&times;</button>
          <div className="error">{error}</div>
        </div>
      </div>
    );
  }

  if (!detail || detail.descriptions.length === 0) return null;

  // Ensure the selected index is within bounds
  const safeIndex = Math.min(selectedSourceIndex, detail.descriptions.length - 1);
  const currentDescription = detail.descriptions[safeIndex]!;

  // Format ability bonuses
  const abilityDisplay = currentDescription.ability?.map(abil => {
    const entries = Object.entries(abil).map(([key, value]) => {
      return `${ABILITY_LABELS[key] || key} +${value}`;
    });
    return entries.join(', ');
  }).join('; ') || 'None';

  // Format size
  const sizeDisplay = currentDescription.size?.map(s => SIZE_LABELS[s] || s).join(', ') || 'Medium';

  // Format speed
  const speedParts: string[] = [];
  if (currentDescription.speed?.walk) speedParts.push(`Walk ${currentDescription.speed.walk} ft.`);
  if (currentDescription.speed?.fly) speedParts.push(`Fly ${currentDescription.speed.fly} ft.`);
  const speedDisplay = speedParts.length > 0 ? speedParts.join(', ') : 'Normal';

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>&times;</button>

        <h2>{detail.name}</h2>

        {detail.descriptions.length > 1 && (
          <div className="modal-section">
            <div className="source-toggle">
              <span>Source: </span>
              {detail.descriptions.map((desc, index) => (
                <button
                  key={desc.source}
                  className={`source-button ${index === selectedSourceIndex ? 'active' : ''}`}
                  onClick={() => setSelectedSourceIndex(index)}
                >
                  {getSourceLabel(desc.source)}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentDescription.description && (
          <div className="modal-section">
            <h3>Description</h3>
            {currentDescription.description.split('\n\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}

        <div className="modal-section">
          <h3> Traits</h3>
          <p><strong>Size:</strong> {sizeDisplay}</p>
          <p><strong>Speed:</strong> {speedDisplay}</p>
          <p><strong>Ability Score Increases:</strong> {abilityDisplay}</p>
        </div>

        {currentDescription.languages && currentDescription.languages.length > 0 && (
          <div className="modal-section">
            <h3>Languages</h3>
            <p>{currentDescription.languages.join(', ')}</p>
          </div>
        )}

        {currentDescription.traits && currentDescription.traits.length > 0 && (
          <div className="modal-section">
            <h3>Traits & Features</h3>
            <ul>
              {currentDescription.traits.map((trait, i) => (
                <li key={i}>{trait}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeciesInfoModal;
