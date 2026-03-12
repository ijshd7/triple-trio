import { useRef, useState } from 'react';
import { IRefPhaserGame, PhaserGame } from './PhaserGame';
import { MainMenu } from './game/scenes/MainMenu';
import { GameUI } from './ui/GameUI';
import { DeckSelectUI } from './ui/DeckSelectUI';

type AIDifficulty = 'easy' | 'hard';

function App() {
  const phaserRef = useRef<IRefPhaserGame | null>(null);
  const [currentSceneKey, setCurrentSceneKey] = useState<string>('MainMenu');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('easy');

  const startGame = () => {
    if (phaserRef.current?.scene) {
      const scene = phaserRef.current.scene as MainMenu;
      if (scene.scene?.key === 'MainMenu') {
        scene.changeScene(difficulty);
      }
    }
  };

  const currentScene = (scene: Phaser.Scene) => {
    setCurrentSceneKey(scene?.scene?.key ?? 'MainMenu');
  };

  const isGameScene = currentSceneKey === 'Game';
  const isDeckSelectScene = currentSceneKey === 'DeckSelect';

  return (
    <div id="app">
      <div className="game-wrapper">
        <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
        <GameUI visible={isGameScene} />
        {isDeckSelectScene && <DeckSelectUI />}
      </div>
      {currentSceneKey === 'MainMenu' && (
        <div className="menu-buttons">
          <div className="difficulty-selector">
            <label htmlFor="difficulty">AI Difficulty:</label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as AIDifficulty)}
              className="difficulty-select"
            >
              <option value="easy">Easy</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <button type="button" className="button" onClick={startGame}>
            Start Game
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
