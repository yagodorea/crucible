import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { characterAPI } from '../services/api';
import { formatAlignment, type Character } from '../types/character';
import './CharacterDetailsPage.css';

const CharacterDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchCharacter = async () => {
      if (!id) return;
      try {
        const data = await characterAPI.getById(id);
        setCharacter(data);
      } catch (err) {
        setError('Failed to load character');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCharacter();
  }, [id]);

  const handleDelete = async () => {
    if (!id || !character) return;

    if (!confirm(`Are you sure you want to delete ${character.name}?`)) {
      return;
    }

    setDeleting(true);
    try {
      await characterAPI.delete(id);
      navigate('/characters');
    } catch (err) {
      setError('Failed to delete character');
      console.error(err);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="character-details-page">
        <div className="loading">Loading character...</div>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="character-details-page">
        <div className="error">{error || 'Character not found'}</div>
        <Link to="/characters" className="btn btn-primary">Back to Characters</Link>
      </div>
    );
  }

  const abilityScores = character.abilityScores || {};
  const alignment = character.alignment || 'TRUE_NEUTRAL';
  const languages = character.languages || [];
  const modifier = (score: number) => Math.floor((score - 10) / 2);

  return (
    <div className="character-details-page">
      <div className="back-link">
        <Link to="/characters">← Back to Characters</Link>
      </div>

      <div className="character-sheet">
        <div className="character-header">
          <div>
            <h1>{character.name}</h1>
            <div className="character-meta">
              <span className="class-level">Level {character.level} {character.class}</span>
              <span className="separator">•</span>
              <span className="species">{character.species}</span>
              <span className="separator">•</span>
              <span className="background">{character.background}</span>
            </div>
          </div>
          <div className="alignment-badge">
            {formatAlignment(alignment)}
          </div>
        </div>

        <div className="character-body">
          <section className="ability-scores">
            <h2>Ability Scores</h2>
            <div className="scores-grid">
              {['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].map((ability) => {
                const score = abilityScores[ability as keyof typeof abilityScores] || 10;
                const mod = modifier(score);
                const displayName = ability.charAt(0).toUpperCase() + ability.slice(1);
                const shortName = displayName.slice(0, 3);
                return (
                  <div key={ability} className="ability-score">
                    <span className="ability-name">{shortName}</span>
                    <span className="ability-score-value">{score}</span>
                    <span className="ability-modifier">{mod >= 0 ? '+' : ''}{mod}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="character-info">
            <h2>Character Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Character ID</span>
                <span className="info-value">
                  <code>{character.characterId}</code>
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Level</span>
                <span className="info-value">{character.level}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Class</span>
                <span className="info-value">{character.class}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Species</span>
                <span className="info-value">{character.species}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Background</span>
                <span className="info-value">{character.background}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Alignment</span>
                <span className="info-value">
                  {formatAlignment(alignment)}
                </span>
              </div>
            </div>
          </section>

          {languages.length > 0 && (
            <section className="languages">
              <h2>Languages</h2>
              <div className="languages-list">
                {languages.map((language, index) => (
                  <span key={index} className="language-tag">{language}</span>
                ))}
              </div>
            </section>
          )}

          {character.appearance && (
            <section className="appearance">
              <h2>Appearance</h2>
              <p>{character.appearance}</p>
            </section>
          )}

          {character.lore && (
            <section className="lore">
              <h2>Backstory</h2>
              <p>{character.lore}</p>
            </section>
          )}

          {(character.createdAt || character.updatedAt) && (
            <section className="timestamps">
              {character.createdBy && (
                <span>Created by: {character.createdBy}</span>
              )}
              {character.createdAt && (
                <span>Created: {new Date(character.createdAt).toLocaleDateString()}</span>
              )}
              {character.updatedAt && (
                <span>Last Updated: {new Date(character.updatedAt).toLocaleDateString()}</span>
              )}
            </section>
          )}
        </div>

        <div className="character-actions">
          <button
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Character'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CharacterDetailsPage;
