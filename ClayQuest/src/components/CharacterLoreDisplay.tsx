import type { CharacterData } from '../types/character';
import './CharacterLoreDisplay.css';

interface CharacterLoreDisplayProps {
  characterData: CharacterData;
  showJson?: boolean;
  className?: string;
}

function CharacterLoreDisplay({ characterData, showJson = true, className }: CharacterLoreDisplayProps) {
  return (
    <div className={`character-lore-display ${className || ''}`}>
      <h3 className="character-lore-title">Character Lore</h3>
      <div className="character-data">
        <div className="character-field">
          <span className="field-label">Name:</span>
          <span className="field-value">{characterData.name}</span>
        </div>
        <div className="character-field">
          <span className="field-label">Color:</span>
          <span className="field-value">{characterData.color}</span>
        </div>
        <div className="character-field">
          <span className="field-label">Shape:</span>
          <span className="field-value">{characterData.shape}</span>
        </div>
        <div className="character-field">
          <span className="field-label">Character Traits:</span>
          <div className="traits-list">
            {characterData.characterTraits.map((trait, index) => (
              <span key={index} className="trait-badge">{trait}</span>
            ))}
          </div>
        </div>
        <div className="character-field">
          <span className="field-label">Tone/Voice:</span>
          <span className="field-value">{characterData.tone}</span>
        </div>
        {showJson && (
          <details className="json-view">
            <summary>View JSON</summary>
            <pre className="json-content">{JSON.stringify(characterData, null, 2)}</pre>
          </details>
        )}
      </div>
    </div>
  );
}

export default CharacterLoreDisplay;
