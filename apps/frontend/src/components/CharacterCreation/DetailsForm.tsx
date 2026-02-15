import { useState, useEffect } from 'react';
import { type Character, type Alignment, formatAlignment } from '../../types/character';
import { dataAPI } from '../../services/api';

interface DetailsFormProps {
  character: Partial<Character>;
  onUpdate: (updates: Partial<Character>) => void;
}

const alignments: { value: Alignment; label: string }[] = [
  { value: 'LAWFUL_GOOD', label: 'Lawful Good' },
  { value: 'LAWFUL_NEUTRAL', label: 'Lawful Neutral' },
  { value: 'LAWFUL_EVIL', label: 'Lawful Evil' },
  { value: 'NEUTRAL_GOOD', label: 'Neutral Good' },
  { value: 'TRUE_NEUTRAL', label: 'True Neutral' },
  { value: 'NEUTRAL_EVIL', label: 'Neutral Evil' },
  { value: 'CHAOTIC_GOOD', label: 'Chaotic Good' },
  { value: 'CHAOTIC_NEUTRAL', label: 'Chaotic Neutral' },
  { value: 'CHAOTIC_EVIL', label: 'Chaotic Evil' },
];

const DetailsForm = ({ character, onUpdate }: DetailsFormProps) => {
  const [name, setName] = useState(character.name || '');
  const [alignment, setAlignment] = useState<Alignment | ''>(character.alignment || '');
  const [appearance, setAppearance] = useState(character.appearance || '');
  const [lore, setLore] = useState(character.lore || '');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(character.languages || ['Common']);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const langs = await dataAPI.getLanguages();
        setAvailableLanguages(langs);
      } catch (error) {
        console.error('Failed to fetch languages:', error);
      }
    };
    fetchLanguages();
  }, []);

  useEffect(() => {
    onUpdate({
      name,
      alignment: alignment || undefined,
      appearance: appearance || undefined,
      lore: lore || undefined,
      languages: selectedLanguages,
    });
  }, [name, alignment, appearance, lore, selectedLanguages, onUpdate]);

  const toggleLanguage = (language: string) => {
    setSelectedLanguages(prev => {
      if (prev.includes(language)) {
        return prev.length > 1 ? prev.filter(l => l !== language) : prev;
      }
      return [...prev, language];
    });
  };

  return (
    <div className="details-form">
      <p className="step-description">
        Fill in the final details about your character to bring them to life!
      </p>

      <div className="form-group">
        <label htmlFor="name">Character Name *</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter character name"
          className="form-input"
          required
        />
      </div>

      <div className="form-group">
        <label>Alignment *</label>
        <div className="alignment-grid" style={{ marginTop: '8px' }}>
          {alignments.map((alignmentOption) => (
            <div
              key={alignmentOption.value}
              className={`alignment-option ${alignment === alignmentOption.value ? 'selected' : ''}`}
              onClick={() => setAlignment(alignmentOption.value)}
            >
              <h3>{alignmentOption.label}</h3>
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="languages">Languages</label>
      </div>
      <div className="multiselect-container" style={{ position: 'relative' }}>
        <div
          id="languages"
          className="form-input multiselect-display"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          style={{
            minHeight: '42px',
            padding: '8px 12px',
            cursor: 'pointer',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            background: 'white'
          }}
        >
          {selectedLanguages.map(lang => (
            <span
              key={lang}
              className="language-tag"
              style={{
                background: '#4a5568',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onClick={(e) => {
                e.stopPropagation();
                toggleLanguage(lang);
              }}
            >
              {lang}
              <span style={{ cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>×</span>
            </span>
          ))}
          {selectedLanguages.length === 0 && (
            <span style={{ color: '#999' }}>Select languages...</span>
          )}
        </div>

        {isDropdownOpen && (
          <div
            className="multiselect-dropdown"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              maxHeight: '250px',
              overflowY: 'auto',
              background: 'white',
              border: '1px solid #ccc',
              borderRadius: '4px',
              marginTop: '4px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              zIndex: 1000
            }}
            onMouseLeave={() => setIsDropdownOpen(false)}
          >
            {availableLanguages.map(lang => (
              <div
                key={lang}
                className="multiselect-option"
                onClick={() => toggleLanguage(lang)}
                style={{
                  padding: '10px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: selectedLanguages.includes(lang) ? '#f0f4ff' : 'white'
                }}
                onMouseEnter={(e) => {
                  if (!selectedLanguages.includes(lang)) {
                    e.currentTarget.style.background = '#f8f9fa';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selectedLanguages.includes(lang)) {
                    e.currentTarget.style.background = 'white';
                  }
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedLanguages.includes(lang)}
                  onChange={() => {}}
                  style={{ pointerEvents: 'none' }}
                />
                <span>{lang}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="form-group" style={{ marginTop: '16px' }}>
        <label htmlFor="appearance">Appearance</label>
        <textarea
          id="appearance"
          value={appearance}
          onChange={(e) => setAppearance(e.target.value)}
          placeholder="Describe your character's physical appearance..."
          className="form-textarea"
          rows={4}
        />
      </div>

      <div className="form-group">
        <label htmlFor="lore">Background Story</label>
        <textarea
          id="lore"
          value={lore}
          onChange={(e) => setLore(e.target.value)}
          placeholder="Tell your character's story..."
          className="form-textarea"
          rows={6}
        />
      </div>

      <div className="character-summary">
        <h3>Character Summary</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <strong>Class:</strong> {character.class || 'Not selected'}
          </div>
          <div className="summary-item">
            <strong>Background:</strong> {character.background || 'Not selected'}
          </div>
          <div className="summary-item">
            <strong>Species:</strong> {character.species || 'Not selected'}
          </div>
          <div className="summary-item">
            <strong>Alignment:</strong> {alignment ? formatAlignment(alignment) : 'Not selected'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsForm;
