/**
 * Example usage of CharacterLoreDisplay component
 * This shows how to use the component in a second step or different view
 */

import CharacterLoreDisplay from './CharacterLoreDisplay';
import { CharacterData } from '../types/character';

// Example 1: Basic usage
function ExampleBasic() {
  const characterData: CharacterData = {
    name: "Claybert",
    color: "bright red and blue",
    shape: "round and chubby",
    characterTraits: ["playful", "curious", "adventurous"],
    tone: "energetic and enthusiastic"
  };

  return (
    <div>
      <h2>Step 2: Character Details</h2>
      <CharacterLoreDisplay characterData={characterData} />
    </div>
  );
}

// Example 2: Without JSON view
function ExampleNoJson() {
  const characterData: CharacterData = {
    name: "Squishy",
    color: "pastel pink",
    shape: "irregular blob",
    characterTraits: ["gentle", "shy", "kind"],
    tone: "soft and warm"
  };

  return (
    <div>
      <CharacterLoreDisplay characterData={characterData} showJson={false} />
    </div>
  );
}

// Example 3: With custom styling
function ExampleCustomStyle() {
  const characterData: CharacterData = {
    name: "Spike",
    color: "dark green",
    shape: "tall and pointy",
    characterTraits: ["bold", "confident", "protective"],
    tone: "strong and commanding"
  };

  return (
    <div>
      <CharacterLoreDisplay 
        characterData={characterData} 
        className="card"
      />
    </div>
  );
}

// Example 4: Compact variant
function ExampleCompact() {
  const characterData: CharacterData = {
    name: "Tiny",
    color: "yellow",
    shape: "small and round",
    characterTraits: ["cheerful", "optimistic"],
    tone: "light and bubbly"
  };

  return (
    <div>
      <CharacterLoreDisplay 
        characterData={characterData} 
        className="compact"
      />
    </div>
  );
}

export { ExampleBasic, ExampleNoJson, ExampleCustomStyle, ExampleCompact };
