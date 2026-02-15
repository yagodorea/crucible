import { useState } from 'react';
import { CORE_SOURCES, SOURCE_LABELS } from './sourceBooks';

interface SourceToggleProps {
  availableSources: string[];
  enabledSources: string[];
  onToggle: (source: string) => void;
  onClearAll: () => void;
  onSelectAll: () => void;
}

const SourceToggle = ({ availableSources, enabledSources, onToggle, onClearAll, onSelectAll }: SourceToggleProps) => {
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

  const hasEnabledSources = enabledSources.length > 0;
  const allSelected = enabledSources.length === availableSources.length;

  return (
    <div className="source-toggle">
      <div className="source-toggle-row">
        {coreSources.map(renderChip)}
        {hasEnabledSources && (
          <button
            className="clear-sources-btn"
            onClick={onClearAll}
          >
            Clear All
          </button>
        )}
        {!allSelected && (
          <button
            className="select-sources-btn"
            onClick={onSelectAll}
          >
            Select All
          </button>
        )}
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
