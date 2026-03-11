import { useRef, useState } from 'react';
import { IRefPhaserGame, PhaserGame } from './PhaserGame';
import { MainMenu } from './game/scenes/MainMenu';
import { GameUI } from './ui/GameUI';

function App() {
  const phaserRef = useRef<IRefPhaserGame | null>(null);
  const [currentSceneKey, setCurrentSceneKey] = useState<string>('MainMenu');

  const startGame = () => {
    if (phaserRef.current?.scene) {
      const scene = phaserRef.current.scene as MainMenu;
      if (scene.scene?.key === 'MainMenu') {
        scene.changeScene();
      }
    }
  };

  const currentScene = (scene: Phaser.Scene) => {
    setCurrentSceneKey(scene?.scene?.key ?? 'MainMenu');
  };

  const isGameScene = currentSceneKey === 'Game';

  return (
    <div id="app">
      <div className="game-wrapper">
        <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
        <GameUI visible={isGameScene} />
      </div>
      {currentSceneKey === 'MainMenu' && (
        <div className="menu-buttons">
          <button type="button" className="button" onClick={startGame}>
            Start Game
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
