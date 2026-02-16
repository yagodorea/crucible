import { useState, useEffect } from 'react';
import type { AbilityScores } from '../../types/character';

interface AbilityScoresStepProps {
  abilityScores?: AbilityScores;
  onUpdate: (scores: AbilityScores) => void;
}

// D&D 5e Point Buy costs (score -> point cost)
const POINT_BUY_COSTS: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

const TOTAL_POINTS = 27;
const MIN_SCORE = 8;
const MAX_SCORE = 15;
const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

const AbilityScoresStep = ({ abilityScores, onUpdate }: AbilityScoresStepProps) => {
  const defaultScores: AbilityScores = {
    strength: 8,
    dexterity: 8,
    constitution: 8,
    intelligence: 8,
    wisdom: 8,
    charisma: 8,
  };

  const [scores, setScores] = useState<AbilityScores>(abilityScores || defaultScores);

  // Sync local state with prop when it changes (e.g., from localStorage)
  useEffect(() => {
    if (abilityScores) {
      setScores(abilityScores);
    }
  }, [abilityScores]);

  // Calculate point cost for a single score
  const getPointCost = (score: number): number => {
    return POINT_BUY_COSTS[score] ?? 0;
  };

  // Calculate total points used
  const calculatePointsUsed = (currentScores: AbilityScores): number => {
    return Object.values(currentScores).reduce(
      (total, score) => total + getPointCost(score),
      0
    );
  };

  const pointsUsed = calculatePointsUsed(scores);
  const pointsRemaining = TOTAL_POINTS - pointsUsed;

  const handleScoreChange = (ability: keyof AbilityScores, value: number) => {
    // Clamp value to valid range
    const clampedValue = Math.max(MIN_SCORE, Math.min(MAX_SCORE, value));

    // Calculate what the new point total would be
    const testScores = { ...scores, [ability]: clampedValue };
    const newPointsUsed = calculatePointsUsed(testScores);

    // Only allow the change if we don't exceed the point limit
    if (newPointsUsed <= TOTAL_POINTS) {
      setScores(testScores);
      onUpdate(testScores);
    }
  };

  const applyStandardArray = () => {
    const abilities: Array<keyof AbilityScores> = [
      'strength',
      'dexterity',
      'constitution',
      'intelligence',
      'wisdom',
      'charisma',
    ];
    const newScores = abilities.reduce((acc, ability, index) => {
      acc[ability] = STANDARD_ARRAY[index] || 8;
      return acc;
    }, {} as AbilityScores);
    setScores(newScores);
    onUpdate(newScores);
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
        Distribute 27 points using the point buy system (scores from 8-15), or use the standard array.
      </p>

      <div className="point-buy-info">
        <div className="points-display">
          <strong>Points:</strong> {pointsUsed} / {TOTAL_POINTS}
          <span className={pointsRemaining < 0 ? 'points-over' : pointsRemaining === 0 ? 'points-perfect' : 'points-remaining'}>
            {' '}({pointsRemaining} remaining)
          </span>
        </div>
        <button
          type="button"
          onClick={applyStandardArray}
          className="btn btn-secondary"
        >
          Apply Standard Array (15, 14, 13, 12, 10, 8)
        </button>
      </div>

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
              min={MIN_SCORE}
              max={MAX_SCORE}
              value={scores[key]}
              onChange={(e) => handleScoreChange(key, parseInt(e.target.value) || MIN_SCORE)}
              className="ability-input"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AbilityScoresStep;
