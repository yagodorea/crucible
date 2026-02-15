import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { characterAPI } from '../services/api';
import type { Character } from '../types/character';
import './CharactersListPage.css';

const CharactersListPage = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const data = await characterAPI.getAll();
        setCharacters(data);
      } catch (err) {
        setError('Failed to load characters');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCharacters();
  }, []);

  if (loading) {
    return (
      <div className="characters-list-page">
        <div className="loading">Loading characters...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="characters-list-page">
        <div className="error">{error}</div>
        <Link to="/" className="btn btn-primary">Go Home</Link>
      </div>
    );
  }

  return (
    <div className="characters-list-page">
      <div className="header">
        <h1>Your Characters</h1>
        <Link to="/create" className="btn btn-primary">Create New Character</Link>
      </div>

      {characters.length === 0 ? (
        <div className="empty-state">
          <p>No characters yet. Create your first character!</p>
          <Link to="/create" className="btn btn-primary">Create Character</Link>
        </div>
      ) : (
        <div className="characters-grid">
          {characters.map((character) => (
            <Link
              key={character.characterId}
              to={`/characters/${character.characterId}`}
              className="character-card"
            >
              <h2>{character.name}</h2>
              <div className="character-details">
                <p><strong>Class:</strong> {character.class}</p>
                <p><strong>Species:</strong> {character.species}</p>
                <p><strong>Background:</strong> {character.background}</p>
                <p><strong>Level:</strong> {character.level}</p>
                <p className="character-id">
                  <strong>ID:</strong> <code>{character.characterId}</code>
                </p>
              </div>
              <div className="alignment-badge">
                {character.alignment.lawChaos} {character.alignment.goodEvil}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="back-link">
        <Link to="/">← Back to Home</Link>
      </div>
    </div>
  );
};

export default CharactersListPage;
