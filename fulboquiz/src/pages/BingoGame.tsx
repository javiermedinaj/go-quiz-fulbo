import React from 'react';
import { useBingoGame } from '../hooks/useBingoGame';

import {
  BingoBoard,
  CurrentPlayer,
  GameStats,
  GameStart,
  GameResults
} from '../components/bingo';

const BingoGame: React.FC = () => {
  const {
    currentPlayer,
    bingoBoard,
    timeLeft,
    gameStarted,
    gameFinished,
    score,
    correctPlacements,
    wrongPlacements,
    loading,
    gameErrors,
    

    startGame,
    handleCategoryClick,
    skipPlayer
  } = useBingoGame();

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white/70 text-lg">Cargando jugadores...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                ⚽ Futbol Bingo
              </h1>
              <p className="text-white/70">
                Coloca a los jugadores en las categorías correctas del tablero
              </p>
            </div>
            
            <GameStats
              score={score}
              correctPlacements={correctPlacements}
              wrongPlacements={wrongPlacements}
              timeLeft={timeLeft}
              showTimer={gameStarted && !gameFinished}
            />
          </div>
        </div>

        {!gameStarted ? (
          <GameStart onStart={startGame} />
        ) : gameFinished ? (
          <GameResults
            score={score}
            correctPlacements={correctPlacements}
            wrongPlacements={wrongPlacements}
            gameErrors={gameErrors}
            onRestart={startGame}
            onGoHome={() => window.location.href = '/'}
          />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-1">
              {currentPlayer && (
                <CurrentPlayer
                  player={currentPlayer}
                  onSkip={skipPlayer}
                  disabled={gameFinished}
                />
              )}
            </div>

            <div className="xl:col-span-2">
              <BingoBoard
                categories={bingoBoard}
                onCategoryClick={handleCategoryClick}
                disabled={gameFinished}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BingoGame;
