/**
 * Example: Using CharacterLoreDisplay in a multi-step flow
 * This demonstrates how to pass character data between steps
 */

import { useState } from 'react';
import CharacterLoreDisplay from './CharacterLoreDisplay';
import type { CharacterData } from '../types/character';
import './StepExample.css';

function StepExample() {
  const [currentStep, setCurrentStep] = useState(1);
  const [characterData, setCharacterData] = useState<CharacterData | null>(null);

  // Example: Simulate receiving character data from step 1 (camera capture)
  const handleStep1Complete = () => {
    // In real app, this would come from CameraCapture component
    const exampleData: CharacterData = {
      name: "Claybert",
      color: "bright red and blue",
      shape: "round and chubby",
      characterTraits: ["playful", "curious", "adventurous"],
      tone: "energetic and enthusiastic"
    };
    setCharacterData(exampleData);
    setCurrentStep(2);
  };

  return (
    <div className="step-example">
      <div className="step-indicator">
        <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
          <span className="step-number">1</span>
          <span className="step-label">Capture & Analyze</span>
        </div>
        <div className="step-connector"></div>
        <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
          <span className="step-number">2</span>
          <span className="step-label">Review Character</span>
        </div>
      </div>

      {currentStep === 1 && (
        <div className="step-content">
          <h2>Step 1: Capture Image</h2>
          <p>Use the camera to capture your clay creation...</p>
          <button onClick={handleStep1Complete} className="btn-primary">
            Simulate: Complete Step 1
          </button>
        </div>
      )}

      {currentStep === 2 && characterData && (
        <div className="step-content">
          <h2>Step 2: Character Lore</h2>
          <p>Review the character details extracted from your clay creation:</p>
          <CharacterLoreDisplay characterData={characterData} className="card" />
          <div className="step-actions">
            <button onClick={() => setCurrentStep(1)} className="btn-secondary">
              Back
            </button>
            <button onClick={() => setCurrentStep(3)} className="btn-primary">
              Continue to Next Step
            </button>
          </div>
        </div>
      )}

      {currentStep === 3 && characterData && (
        <div className="step-content">
          <h2>Step 3: Next Action</h2>
          <p>You can use the character data here for further processing...</p>
          <CharacterLoreDisplay characterData={characterData} showJson={false} className="compact" />
        </div>
      )}
    </div>
  );
}

export default StepExample;
