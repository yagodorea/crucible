import { useEffect, useState } from 'react';
import { dataAPI } from '../../services/api';
import type { ClassInfo } from '../../types/character';
import ClassInfoModal from './ClassInfoModal';

interface ClassSelectorProps {
  selectedClass?: string;
  onSelect: (className: string) => void;
  enabledSources: string[];
}

const ClassSelector = ({ selectedClass, onSelect, enabledSources }: ClassSelectorProps) => {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [infoClassName, setInfoClassName] = useState<string | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const data = await dataAPI.getClasses();
        setClasses(data);
      } catch (err) {
        setError('Failed to load classes');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  const filteredClasses = classes.filter(c => enabledSources.includes(c.source));

  if (loading) return <div className="loading">Loading classes...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="class-selector">
      <p className="step-description">
        Every adventurer is a member of a class. A class broadly describes a character's vocation,
        special talents, and favored tactics.
      </p>

      <div className="class-grid">
        {filteredClasses.map((classInfo) => (
          <div
            key={classInfo.name}
            className={`class-card ${selectedClass === classInfo.name ? 'selected' : ''}`}
            onClick={() => onSelect(classInfo.name)}
          >
            <div className="class-card-header">
              <h3>{classInfo.name}</h3>
              <button
                className="info-btn"
                title={`More info about ${classInfo.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setInfoClassName(classInfo.name);
                }}
              >
                i
              </button>
            </div>
            <div className="class-tags">
              <span className="tag primary-ability">{classInfo.primaryAbility}</span>
              <span className={`tag complexity complexity-${classInfo.complexity.toLowerCase()}`}>
                {classInfo.complexity}
              </span>
            </div>
            {classInfo.hd && (
              <p className="hit-die">Hit Die: d{classInfo.hd.faces}</p>
            )}
          </div>
        ))}
      </div>

      {infoClassName && (
        <ClassInfoModal
          className={infoClassName}
          onClose={() => setInfoClassName(null)}
        />
      )}
    </div>
  );
};

export default ClassSelector;
