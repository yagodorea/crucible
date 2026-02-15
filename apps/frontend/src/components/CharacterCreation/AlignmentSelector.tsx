import type { Alignment } from '../../types/character';

interface AlignmentSelectorProps {
  alignment?: Alignment | '';
  onSelect: (alignment: Alignment) => void;
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

const AlignmentSelector = ({ alignment, onSelect }: AlignmentSelectorProps) => {
  return (
    <div className="alignment-selector">
      <p className="step-description">
        Alignment is a shorthand for your character's moral compass. It represents your character's
        general ethical and moral attitudes.
      </p>

      <div className="alignment-grid">
        {alignments.map((alignmentOption) => (
          <div
            key={alignmentOption.value}
            className={`alignment-option ${alignment === alignmentOption.value ? 'selected' : ''}`}
            onClick={() => onSelect(alignmentOption.value)}
          >
            <h3>{alignmentOption.label}</h3>
          </div>
        ))}
      </div>

      <div className="alignment-help">
        <h4>Alignment Guide:</h4>
        <ul>
          <li><strong>Lawful:</strong> Respects authority, tradition, and order</li>
          <li><strong>Neutral:</strong> Balanced or indifferent to law/chaos</li>
          <li><strong>Chaotic:</strong> Values personal freedom and flexibility</li>
          <li><strong>Good:</strong> Compassionate, altruistic, respects life</li>
          <li><strong>Evil:</strong> Selfish, willing to hurt others for gain</li>
        </ul>
      </div>
    </div>
  );
};

export default AlignmentSelector;
