import { useState } from 'react';
import { CORE_SOURCES, SOURCE_LABELS } from './sourceBooks';

interface SourceToggleProps {
  availableSources: string[];
  enabledSources: string[];
  onToggle: (source: string) => void;
}

const SourceToggle = ({ availableSources, enabledSources, onToggle }: SourceToggleProps) => {
  const [showMore, setShowMore] = useState(false);

  const coreSources = availableSources.filter(s => CORE_SOURCES.includes(s));
  const extraSources = availableSources.filter(s => !CORE_SOURCES.includes(s));

  const renderChip = (source: string) => (
    <button
      key={source}
      className={`source-chip ${enabledSources.includes(source) ? 'enabled' : ''}`}
      onClick={() => onToggle(source)}
      title={SOURCE_LABELS[source] || source}
    >
      {source}
    </button>
  );

  return (
    <div className="source-toggle">
      <div className="source-toggle-row">
        {coreSources.map(renderChip)}
        {extraSources.length > 0 && (
          <button
            className="more-sources-toggle"
            onClick={() => setShowMore(!showMore)}
          >
            {showMore ? 'Less Sources' : `More Sources (${extraSources.length})`}
          </button>
        )}
      </div>
      {showMore && (
        <div className="more-sources">
          {extraSources.map(renderChip)}
        </div>
      )}
    </div>
  );
};

export default SourceToggle;
