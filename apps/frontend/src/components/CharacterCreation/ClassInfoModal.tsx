import { useEffect, useState, useCallback } from 'react';
import { dataAPI } from '../../services/api';
import type { ClassDetailInfo, SubclassDetailInfo } from '../../types/character';

interface ClassInfoModalProps {
  className: string;
  onClose: () => void;
}

const ABILITY_LABELS: Record<string, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
};

function cleanMarkup(text: string): string {
  return text.replace(/\{@\w+\s+([^|}]+)[^}]*\}/g, '$1');
}

const ClassInfoModal = ({ className, onClose }: ClassInfoModalProps) => {
  const [detail, setDetail] = useState<ClassDetailInfo | null>(null);
  const [subclassDetail, setSubclassDetail] = useState<SubclassDetailInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSubclass, setActiveSubclass] = useState<string | null>(null);
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const data = await dataAPI.getClassDetail(className.toLowerCase());
        setDetail(data);
      } catch {
        setError('Failed to load class details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [className]);

  useEffect(() => {
    if (!activeSubclass) {
      setSubclassDetail(null);
      return;
    }

    setLoading(true);
    setError(null);

    const fetchSubclass = async () => {
      try {
        const data = await dataAPI.getSubclassDetail(className.toLowerCase(), activeSubclass);
        setSubclassDetail(data);
      } catch {
        setError('Failed to load subclass details');
      } finally {
        setLoading(false);
      }
    };

    fetchSubclass();
  }, [activeSubclass, className]);

  const handleBack = useCallback(() => {
    setActiveSubclass(null);
    setError(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeSubclass) {
          handleBack();
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, activeSubclass, handleBack]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const renderClassView = () => {
    if (!detail) return null;

    return (
      <>
        <h2>{detail.name}</h2>

        <div className="modal-tags">
          <span className="tag primary-ability">{detail.primaryAbility}</span>
          <span className={`tag complexity complexity-${detail.complexity.toLowerCase()}`}>
            {detail.complexity} Complexity
          </span>
          {detail.hd && (
            <span className="tag hit-die-tag">d{detail.hd.faces} Hit Die</span>
          )}
        </div>

        {detail.description && (
          <div className="modal-section">
            <h3>Description</h3>
            {detail.description.split('\n\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}

        {detail.proficiency && detail.proficiency.length > 0 && (
          <div className="modal-section">
            <h3>Saving Throw Proficiencies</h3>
            <p>{detail.proficiency.map(p => ABILITY_LABELS[p] || p).join(', ')}</p>
          </div>
        )}

        {detail.startingProficiencies && (
          <div className="modal-section">
            <h3>Starting Proficiencies</h3>
            {detail.startingProficiencies.armor && (
              <p><strong>Armor:</strong> {detail.startingProficiencies.armor.map(
                a => a.charAt(0).toUpperCase() + a.slice(1)
              ).join(', ')}</p>
            )}
            {detail.startingProficiencies.weapons && (
              <p><strong>Weapons:</strong> {detail.startingProficiencies.weapons.map(
                w => w.charAt(0).toUpperCase() + w.slice(1)
              ).join(', ')}</p>
            )}
            {detail.startingProficiencies.skills?.map((skillEntry, i) =>
              skillEntry.choose && (
                <p key={i}>
                  <strong>Skills:</strong> Choose {skillEntry.choose.count} from{' '}
                  {skillEntry.choose.from.map(
                    s => s.charAt(0).toUpperCase() + s.slice(1)
                  ).join(', ')}
                </p>
              )
            )}
          </div>
        )}

        {detail.subclasses.length > 0 && (
          <div className="modal-section">
            <h3>Subclasses</h3>
            <ul className="subclass-list">
              {detail.subclasses.map(sc => (
                <li key={sc}>
                  <button
                    className="subclass-link"
                    onClick={() => setActiveSubclass(sc)}
                  >
                    {sc}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {detail.features.length > 0 && (
          <div className="modal-section">
            <h3>Class Features</h3>
            {(() => {
              const featuresByLevel = detail.features.reduce((acc, feature) => {
                if (!acc[feature.level]) acc[feature.level] = [];
                acc[feature.level].push(feature);
                return acc;
              }, {} as Record<number, typeof detail.features>);

              const toggleFeature = (featureId: string) => {
                setExpandedFeatures(prev => {
                  const next = new Set(prev);
                  if (next.has(featureId)) {
                    next.delete(featureId);
                  } else {
                    next.add(featureId);
                  }
                  return next;
                });
              };

              return Object.entries(featuresByLevel)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([level, features]) => (
                  <div key={level} className="level-features">
                    <h4>Level {level}</h4>
                    {features.map((feature) => {
                      const featureId = `${feature.name}-${feature.level}`;
                      const isExpanded = expandedFeatures.has(featureId);
                      return (
                        <div key={featureId} className="class-feature">
                          <button
                            className="feature-toggle"
                            onClick={() => toggleFeature(featureId)}
                          >
                            <span className={`feature-toggle-icon ${isExpanded ? 'expanded' : ''}`}>▶</span>
                            <span className="feature-name">{feature.name}</span>
                          </button>
                          {isExpanded && (
                            <div className="feature-content">
                              {feature.entries.map((entry, i) => (
                                <p key={i}>{cleanMarkup(entry)}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ));
            })()}
          </div>
        )}
      </>
    );
  };

  const renderSubclassView = () => {
    if (!subclassDetail) return null;

    return (
      <>
        <button className="modal-back" onClick={handleBack}>
          &larr; Back to {detail?.name}
        </button>

        <h2>{subclassDetail.name}</h2>

        {subclassDetail.description && (
          <div className="modal-section">
            <h3>Description</h3>
            {subclassDetail.description.split('\n\n').map((p, i) => (
              <p key={i}>{cleanMarkup(p)}</p>
            ))}
          </div>
        )}

        {subclassDetail.features.length > 0 && (
          <div className="modal-section">
            <h3>Features</h3>
            {subclassDetail.features.map((feature) => (
              <div key={`${feature.name}-${feature.level}`} className="subclass-feature">
                <h4>
                  {feature.name}
                  <span className="feature-level">Level {feature.level}</span>
                </h4>
                {feature.entries.map((entry, i) => (
                  <p key={i}>{cleanMarkup(entry)}</p>
                ))}
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>&times;</button>

        {loading && <div className="loading">Loading...</div>}
        {error && <div className="error">{error}</div>}

        {!loading && !error && (activeSubclass ? renderSubclassView() : renderClassView())}
      </div>
    </div>
  );
};

export default ClassInfoModal;
