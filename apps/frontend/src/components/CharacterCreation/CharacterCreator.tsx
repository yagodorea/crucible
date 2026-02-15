import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import type { Character } from '../../types/character';
import ClassSelector from './ClassSelector';
import BackgroundSelector from './BackgroundSelector';
import SpeciesSelector from './SpeciesSelector';
import AbilityScoresStep from './AbilityScoresStep';
import DetailsForm from './DetailsForm';
import SourceToggle from './SourceToggle';
import { characterAPI, dataAPI } from '../../services/api';
import { DEFAULT_ENABLED, SOURCES_STORAGE_KEY } from './sourceBooks';
import './CharacterCreator.css';

type Step = 1 | 2 | 3 | 4 | 5;

const STORAGE_KEY = 'dnd-character-draft';

const CharacterCreator = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize step from URL or default to 1
  const urlStep = parseInt(searchParams.get('step') || '1');
  const initialStep = (urlStep >= 1 && urlStep <= 5 ? urlStep : 1) as Step;

  const [currentStep, setCurrentStep] = useState<Step>(initialStep);

  // Load character from localStorage if available
  const [character, setCharacter] = useState<Partial<Character>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { level: 1, languages: [] };
      }
    }
    return { level: 1, languages: [] };
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdCharacterId, setCreatedCharacterId] = useState<string | null>(null);

  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [enabledSources, setEnabledSources] = useState<string[]>(() => {
    const saved = localStorage.getItem(SOURCES_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_ENABLED;
      }
    }
    return DEFAULT_ENABLED;
  });

  // Save character to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(character));
  }, [character]);

  // Fetch available sources on mount
  useEffect(() => {
    dataAPI.getSources().then(setAvailableSources).catch(console.error);
  }, []);

  // Persist enabled sources to localStorage
  useEffect(() => {
    localStorage.setItem(SOURCES_STORAGE_KEY, JSON.stringify(enabledSources));
  }, [enabledSources]);

  // Update URL when step changes
  useEffect(() => {
    setSearchParams({ step: currentStep.toString() });
  }, [currentStep, setSearchParams]);

  const updateCharacter = useCallback((updates: Partial<Character>) => {
    setCharacter((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleAbilityScoresUpdate = useCallback((abilityScores: Character['abilityScores']) => {
    updateCharacter({ abilityScores });
  }, [updateCharacter]);

  const handleSourceToggle = (source: string) => {
    setEnabledSources(prev =>
      prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source]
    );
  };

  const handleClearAllSources = () => {
    setEnabledSources([]);
  };

  const handleSelectAllSources = () => {
    setEnabledSources(availableSources);
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleSubmit = async () => {
    if (!isFormComplete()) return;

    setIsSubmitting(true);
    try {
      const created = await characterAPI.create(character as Omit<Character, 'characterId' | 'createdAt' | 'updatedAt'>);
      setCreatedCharacterId(created.characterId || null);
      // Clear localStorage after successful creation
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to create character:', error);
      alert('Failed to create character. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCharacter = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCharacter({ level: 1, languages: [] });
    setCreatedCharacterId(null);
    setCurrentStep(1);
  };

  const isFormComplete = (): boolean => {
    return !!(
      character.name &&
      character.class &&
      character.background &&
      character.species &&
      character.abilityScores &&
      character.alignment
    );
  };

  const getStepTitle = (): string => {
    switch (currentStep) {
      case 1: return 'Choose a Class';
      case 2: return 'Choose a Background';
      case 3: return 'Choose a Species';
      case 4: return 'Determine Ability Scores';
      case 5: return 'Fill in Details';
      default: return '';
    }
  };

  const renderNavButtons = (position: 'top' | 'bottom') => (
    <div className={`creator-nav creator-nav-${position}`}>
      <button
        onClick={prevStep}
        disabled={currentStep === 1}
        className="btn btn-secondary"
      >
        Previous
      </button>

      {currentStep < 5 ? (
        <button
          onClick={nextStep}
          className="btn btn-primary"
        >
          Next
        </button>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={!isFormComplete() || isSubmitting}
          className="btn btn-success"
        >
          {isSubmitting ? 'Creating...' : 'Create Character'}
        </button>
      )}
    </div>
  );

  if (createdCharacterId) {
    return (
      <div className="character-creator">
        <div className="success-message">
          <h2>Character Created Successfully!</h2>
          <p>Character ID: <strong>{createdCharacterId}</strong></p>
          <p>Save this ID to retrieve your character later.</p>
          <div className="success-actions">
            <button onClick={resetCharacter} className="btn btn-primary">Create Another Character</button>
            <Link to="/characters" className="btn btn-secondary">View All Characters</Link>
            <Link to="/" className="btn btn-secondary">Go Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="character-creator">
      <header className="creator-header">
        <div className="creator-header-top">
          <Link to="/" className="btn-cancel">Cancel</Link>
        </div>
        <h1>D&D Character Creator</h1>
        <div className="step-indicator">
          <span>Step {currentStep} of 5</span>
          <span className="step-title">{getStepTitle()}</span>
        </div>
      </header>

      {availableSources.length > 0 && (
        <SourceToggle
          availableSources={availableSources}
          enabledSources={enabledSources}
          onToggle={handleSourceToggle}
          onClearAll={handleClearAllSources}
          onSelectAll={handleSelectAllSources}
        />
      )}

      {renderNavButtons('top')}

      <div className="creator-content">
        {currentStep === 1 && (
          <ClassSelector
            selectedClass={character.class}
            onSelect={(className) => updateCharacter({ class: className })}
            enabledSources={enabledSources}
          />
        )}

        {currentStep === 2 && (
          <BackgroundSelector
            selectedBackground={character.background}
            onSelect={(background) => updateCharacter({ background })}
            enabledSources={enabledSources}
          />
        )}

        {currentStep === 3 && (
          <SpeciesSelector
            selectedSpecies={character.species}
            onSelect={(species) => updateCharacter({ species })}
            enabledSources={enabledSources}
          />
        )}

        {currentStep === 4 && (
          <AbilityScoresStep
            abilityScores={character.abilityScores}
            onUpdate={handleAbilityScoresUpdate}
          />
        )}

        {currentStep === 5 && (
          <DetailsForm
            character={character}
            onUpdate={updateCharacter}
          />
        )}
      </div>

      <footer className="creator-footer">
      </footer>
    </div>
  );
};

export default CharacterCreator;
