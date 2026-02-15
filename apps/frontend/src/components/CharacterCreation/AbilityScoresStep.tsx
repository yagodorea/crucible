import { useState, useEffect } from 'react';
import type { AbilityScores } from '../../types/character';

interface AbilityScoresStepProps {
  abilityScores?: AbilityScores;
  onUpdate: (scores: AbilityScores) => void;
}

const AbilityScoresStep = ({ abilityScores, onUpdate }: AbilityScoresStepProps) => {
  const defaultScores: AbilityScores = {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  };

  const [scores, setScores] = useState<AbilityScores>(abilityScores || defaultScores);

  // Sync local state with prop when it changes (e.g., from localStorage)
  useEffect(() => {
    if (abilityScores) {
      setScores(abilityScores);
    }
  }, [abilityScores]);

  // Only notify parent when scores actually change from user interaction
  useEffect(() => {
    // Don't call onUpdate on initial mount if we already have abilityScores from props
    if (abilityScores) return;
    onUpdate(scores);
  }, [scores, onUpdate, abilityScores]);

  const handleScoreChange = (ability: keyof AbilityScores, value: number) => {
    setScores((prev) => ({
      ...prev,
      [ability]: Math.max(1, Math.min(20, value)),
    }));
  };

  const abilities: Array<{ key: keyof AbilityScores; label: string; description: string }> = [
    { key: 'strength', label: 'Strength', description: 'Physical power' },
    { key: 'dexterity', label: 'Dexterity', description: 'Agility and reflexes' },
    { key: 'constitution', label: 'Constitution', description: 'Endurance and health' },
    { key: 'intelligence', label: 'Intelligence', description: 'Reasoning and memory' },
    { key: 'wisdom', label: 'Wisdom', description: 'Awareness and insight' },
    { key: 'charisma', label: 'Charisma', description: 'Force of personality' },
  ];

  return (
    <div className="ability-scores-step">
      <p className="step-description">
        Much of what your character does in the game depends on the character's six abilities.
        Use the standard array (15, 14, 13, 12, 10, 8) or set custom values (8-15 recommended for level 1).
      </p>

      <div className="ability-scores-grid">
        {abilities.map(({ key, label, description }) => (
          <div key={key} className="ability-score-item">
            <label htmlFor={key}>
              <div className="ability-header">
                <span className="ability-name">{label}</span>
                <span className="ability-modifier">
                  {scores[key] >= 10 ? '+' : ''}
                  {Math.floor((scores[key] - 10) / 2)}
                </span>
              </div>
              <span className="ability-description">{description}</span>
            </label>
            <input
              id={key}
              type="number"
              min="1"
              max="20"
              value={scores[key]}
              onChange={(e) => handleScoreChange(key, parseInt(e.target.value) || 10)}
              className="ability-input"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AbilityScoresStep;
