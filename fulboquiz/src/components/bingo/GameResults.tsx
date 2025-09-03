import React from 'react';

interface GameError {
  playerName: string;
  attemptedCategory: string;
  correctCategories: string[];
}

interface GameResultsProps {
  score: number;
  correctPlacements: number;
  wrongPlacements: number;
  gameErrors: GameError[];
  onRestart: () => void;
  onGoHome: () => void;
}

const GameResults: React.FC<GameResultsProps> = ({ 
  score, 
  correctPlacements, 
  wrongPlacements, 
  gameErrors,
  onRestart,
  onGoHome
}) => {
  const getPerformanceMessage = () => {
    if (correctPlacements >= 10) {
      return <p className="text-green-400 text-lg mb-2">¡Excelente! Eres un maestro del bingo ⚽</p>;
    }
    if (correctPlacements >= 7) {
      return <p className="text-blue-400 text-lg mb-2">¡Muy bien! Buen conocimiento futbolístico 🎯</p>;
    }
    if (correctPlacements >= 4) {
      return <p className="text-yellow-400 text-lg mb-2">¡No está mal! Sigue practicando 💪</p>;
    }
    return <p className="text-orange-400 text-lg mb-2">¡Puedes mejorar! Inténtalo de nuevo 🔥</p>;
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center max-w-2xl mx-auto">
      <div className="text-6xl mb-6">🏆</div>
      <h2 className="text-3xl font-bold text-white mb-4">¡Juego Terminado!</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="text-3xl font-bold text-blue-400 mb-2">{score}</div>
          <div className="text-white/50">Puntos Finales</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="text-3xl font-bold text-green-400 mb-2">{correctPlacements}</div>
          <div className="text-white/50">Correctos</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="text-3xl font-bold text-red-400 mb-2">{wrongPlacements}</div>
          <div className="text-white/50">Errores</div>
        </div>
      </div>

      <div className="mb-6">
        {getPerformanceMessage()}
      </div>

      {/* Lista de errores */}
      {gameErrors.length > 0 && (
        <div className="mb-8 bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
            ❌ Errores Cometidos
          </h3>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {gameErrors.map((error, index) => (
              <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">⚽</div>
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-1">
                      {error.playerName}
                    </div>
                    <div className="text-sm text-red-400 mb-2">
                      Colocado en: <span className="font-medium">{error.attemptedCategory}</span>
                    </div>
                    {error.correctCategories.length > 0 && (
                      <div className="text-sm text-green-400">
                        {error.correctCategories.some(cat => 
                          cat.startsWith('Nacionalidad:') || 
                          cat.startsWith('Equipo:') || 
                          cat.startsWith('Edad:')
                        ) ? (
                          <div>
                            <div className="font-medium">Información del jugador:</div>
                            {error.correctCategories.map((info, idx) => (
                              <div key={idx} className="ml-2">• {info}</div>
                            ))}
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium">Categorías válidas disponibles:</div>
                            <div className="ml-2">{error.correctCategories.join(', ')}</div>
                          </div>
                        )}
                      </div>
                    )}
                    {error.correctCategories.length === 0 && (
                      <div className="text-sm text-white/50">
                        No se encontraron categorías válidas para este jugador
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button onClick={onRestart} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 hover:scale-105">
          🔄 Jugar de Nuevo
        </button>
        <button onClick={onGoHome} className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-lg border border-white/20 hover:border-white/30 transition-all duration-200">
          🏠 Volver al Inicio
        </button>
      </div>
    </div>
  );
};

export default GameResults;
