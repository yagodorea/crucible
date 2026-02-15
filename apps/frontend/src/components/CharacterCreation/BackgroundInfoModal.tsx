import { useEffect, useState } from 'react';
import { dataAPI } from '../../services/api';
import type { BackgroundDetailInfo } from '../../types/character';

interface BackgroundInfoModalProps {
  backgroundName: string;
  onClose: () => void;
}

const SOURCE_LABELS: Record<string, string> = {
  'PHB': 'Player\'s Handbook (2014)',
  'XPHB': 'Player\'s Handbook (2024)',
  'EFA': 'Eberron: Rising from the Last War',
  'EGW': 'Explorer\'s Guide to Wildemount',
  'TDCSR': 'Tal\'Dorei Campaign Setting Reborn',
  'MTF': 'Mordenkainen\'s Tome of Foes',
  'SCAG': 'Sword Coast Adventurer\'s Guide',
  'VRGR': 'Van Richten\'s Guide to Ravenloft',
  'ID RotF': 'Icewind Dale: Rime of the Frostmaiden',
};

const ABILITY_LABELS: Record<string, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
};

function getSourceLabel(source: string): string {
  return SOURCE_LABELS[source] || source;
}

function cleanMarkup(text: string): string {
  return text.replace(/\{@\w+\s+([^|}]+)[^}]*\}/g, '$1');
}

const BackgroundInfoModal = ({ backgroundName, onClose }: BackgroundInfoModalProps) => {
  const [detail, setDetail] = useState<BackgroundDetailInfo | null>(null);
  const [selectedSourceIndex, setSelectedSourceIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFeats, setExpandedFeats] = useState<Set<string>>(new Set());

  const toggleFeat = (featName: string) => {
    setExpandedFeats(prev => {
      const next = new Set(prev);
      if (next.has(featName)) {
        next.delete(featName);
      } else {
        next.add(featName);
      }
      return next;
    });
  };

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const data = await dataAPI.getBackgroundDetail(backgroundName);
        setDetail(data);
      } catch {
        setError('Failed to load background details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [backgroundName]);

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

        {currentDescription.abilityBonuses && currentDescription.abilityBonuses.length > 0 && (
          <div className="modal-section">
            <h3>Ability Score Increases</h3>
            {currentDescription.abilityBonuses.map((bonus, i) => (
              <p key={i}>
                Choose {bonus.count} from: {bonus.from.map(a => ABILITY_LABELS[a] || a).join(', ')}
                {bonus.weights && ` (weights: ${bonus.weights.join(', ')})`}
              </p>
            ))}
          </div>
        )}

        {currentDescription.feats && currentDescription.feats.length > 0 && (
          <div className="modal-section">
            <h3>Feat{(currentDescription.feats.length > 1) ? 's' : ''}</h3>
            {currentDescription.feats.map((feat, i) => (
              <div key={i} className="feat-item">
                <button
                  className="feat-toggle"
                  onClick={() => toggleFeat(feat.name)}
                >
                  <span className={`feat-toggle-icon ${expandedFeats.has(feat.name) ? 'expanded' : ''}`}>▶</span>
                  <span className="feat-name">{feat.name}</span>
                </button>
                {expandedFeats.has(feat.name) && (
                  <p>{feat.description}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {currentDescription.skillProficiencies && currentDescription.skillProficiencies.length > 0 && (
          <div className="modal-section">
            <h3>Skill Proficiencies</h3>
            <p>{currentDescription.skillProficiencies.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}</p>
          </div>
        )}

        {currentDescription.toolProficiencies && currentDescription.toolProficiencies.length > 0 && (
          <div className="modal-section">
            <h3>Tool Proficiencies</h3>
            <p>{currentDescription.toolProficiencies.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')}</p>
          </div>
        )}

        {currentDescription.languages && currentDescription.languages.length > 0 && (
          <div className="modal-section">
            <h3>Languages</h3>
            <p>{currentDescription.languages.join(', ')}</p>
          </div>
        )}

        {currentDescription.equipment && currentDescription.equipment.length > 0 && (
          <div className="modal-section">
            <h3>Equipment</h3>
            <ul>
              {currentDescription.equipment.map((item, i) => (
                <li key={i}>{cleanMarkup(item)}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default BackgroundInfoModal;
