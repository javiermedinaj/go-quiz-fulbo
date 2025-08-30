import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import type { Player } from '../services/apiService';

interface BingoCategory {
  id: string;
  title: string;
  checkFunction: (player: Player) => boolean;
  filled: boolean;
  playerName?: string;
}

interface GameError {
  playerName: string;
  attemptedCategory: string;
  correctCategories: string[];
}

const BingoGame = () => {
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [bingoBoard, setBingoBoard] = useState<BingoCategory[]>([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [correctPlacements, setCorrectPlacements] = useState(0);
  const [wrongPlacements, setWrongPlacements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [playerQueue, setPlayerQueue] = useState<Player[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [gameErrors, setGameErrors] = useState<GameError[]>([]);

  // Crear el tablero de bingo con categorías claras y específicas
  const createBingoBoard = useCallback((): BingoCategory[] => {
    // Helper to parse age from strings like "06/02/1995 (30)" or plain "22"
    const parseAge = (ageStr?: string): number => {
      if (!ageStr) return NaN;
      // Try parentheses first
      const par = ageStr.match(/\((\d+)\)/);
      if (par && par[1]) return parseInt(par[1], 10);
      // Fallback to any number in the string (e.g., "22")
      const num = ageStr.match(/(\d+)/);
      return num ? parseInt(num[1], 10) : NaN;
    };

    // Helper to normalize nationality and check variants
    const nationalityMatches = (player: Player | undefined, variants: string[]) => {
      const raw = (player?.nationality || '').toLowerCase();
      if (!raw) return false;
      // Remove diacritics (ñ, á, é, etc.) to compare safely
      const norm = raw.normalize('NFD').replace(/\p{Diacritic}/gu, '');
      return variants.some(v => norm.includes(v));
    };

    const categories: BingoCategory[] = [
      // Nacionalidades específicas (aceptar variantes y traducciones)
      {
        id: 'england',
        title: 'Inglaterra',
        checkFunction: (player) => nationalityMatches(player, ['england', 'english', 'inglaterra']),
        filled: false
      },
      {
        id: 'spain',
        title: 'España',
        checkFunction: (player) => nationalityMatches(player, ['spain', 'espana', 'espana', 'espana', 'espanol', 'espanola', 'españa']),
        filled: false
      },
      {
        id: 'france',
        title: 'Francia',
        checkFunction: (player) => nationalityMatches(player, ['france', 'frances', 'francais', 'francais', 'francia', 'french']),
        filled: false
      },
      {
        id: 'germany',
        title: 'Alemania',
        checkFunction: (player) => nationalityMatches(player, ['germany', 'deutschland', 'alemania', 'german']),
        filled: false
      },
      {
        id: 'brazil',
        title: 'Brasil',
        checkFunction: (player) => nationalityMatches(player, ['brazil', 'brasil', 'brazilian', 'brasileiro']),
        filled: false
      },
      {
        id: 'portugal',
        title: 'Portugal',
        checkFunction: (player) => nationalityMatches(player, ['portugal', 'portugues', 'portuguese']),
        filled: false
      },
      // Equipos específicos
      {
        id: 'manchester-city',
        title: 'Manchester City',
        checkFunction: (player) => player.team?.toLowerCase().includes('manchester-city') || player.team?.toLowerCase().includes('manchester city'),
        filled: false
      },
      {
        id: 'real-madrid',
        title: 'Real Madrid',
        checkFunction: (player) => player.team?.toLowerCase().includes('real-madrid') || player.team?.toLowerCase().includes('real madrid'),
        filled: false
      },
      {
        id: 'barcelona',
        title: 'FC Barcelona',
        checkFunction: (player) => player.team?.toLowerCase().includes('barcelona'),
        filled: false
      },
      // Rangos de edad
      {
        id: 'young',
        title: 'Menor de 25',
        checkFunction: (player) => {
          const age = parseAge(player.age);
          return !isNaN(age) && age < 25;
        },
        filled: false
      },
      {
        id: 'veteran',
        title: 'Mayor de 30',
        checkFunction: (player) => {
          const age = parseAge(player.age);
          return !isNaN(age) && age > 30;
        },
        filled: false
      },
      {
        id: 'prime',
        title: '25-30 años',
        checkFunction: (player) => {
          const age = parseAge(player.age);
          return !isNaN(age) && age >= 25 && age <= 30;
        },
        filled: false
      }
    ];

    return categories;
  }, []);

  // Cargar jugadores al inicio (limitado a 30 para mejor rendimiento)
  const loadPlayers = useCallback(async () => {
    setLoading(true);
    try {
      // Usar getRandomPlayers con límite de 30 en lugar de getAllPlayers
      const players = await apiService.getRandomPlayers(30);
      const validPlayers = players.filter(player => 
        player.name && 
        player.nationality && 
        player.team && 
        player.age &&
        player.name.trim() !== '' &&
        player.nationality.trim() !== '' &&
        player.team.trim() !== ''
      );
      
      if (validPlayers.length === 0) {
        throw new Error('No se encontraron jugadores válidos');
      }
      
      // Mezclar jugadores
      const shuffledPlayers = validPlayers.sort(() => 0.5 - Math.random());
      setPlayerQueue(shuffledPlayers);
      
      if (shuffledPlayers.length > 0) {
        setCurrentPlayer(shuffledPlayers[0]);
        setQueueIndex(0);
      }
    } catch (error) {
      console.error('Error loading players:', error);
    }
    setLoading(false);
  }, []);

  // Avanzar al siguiente jugador
  const nextPlayer = useCallback(() => {
    if (queueIndex + 1 < playerQueue.length) {
      setQueueIndex(queueIndex + 1);
      setCurrentPlayer(playerQueue[queueIndex + 1]);
    } else {
      // Si no hay más jugadores, cargar más
      loadPlayers();
    }
  }, [queueIndex, playerQueue, loadPlayers]);

  // Inicializar el juego
  useEffect(() => {
    setBingoBoard(createBingoBoard());
    loadPlayers();
  }, [createBingoBoard, loadPlayers]);

  // Timer del juego
  useEffect(() => {
    let timer: number;
    
    if (gameStarted && !gameFinished && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameStarted) {
      setGameFinished(true);
    }

    return () => clearTimeout(timer);
  }, [timeLeft, gameStarted, gameFinished]);

  // Iniciar el juego
  const startGame = () => {
    setGameStarted(true);
    setTimeLeft(60);
    setScore(0);
    setCorrectPlacements(0);
    setWrongPlacements(0);
    setGameFinished(false);
    setGameErrors([]); // Limpiar errores anteriores
    setBingoBoard(createBingoBoard());
  };

  // Manejar colocación en el tablero
  const handleCategoryClick = (categoryId: string) => {
    if (!gameStarted || gameFinished || !currentPlayer) return;

    const clickedCategory = bingoBoard.find(cat => cat.id === categoryId);
    if (!clickedCategory || clickedCategory.filled) return;

    // We'll build a finalBoard depending on correct/incorrect placement
    let finalBoard = bingoBoard.slice();
    let filledCount = 0;

    // Find the clicked category first
    const target = bingoBoard.find(cat => cat.id === categoryId);
    if (target && !target.filled) {
      const isCorrect = target.checkFunction(currentPlayer);

      if (isCorrect) {
        finalBoard = bingoBoard.map(cat => {
          if (!cat.filled && cat.checkFunction(currentPlayer)) {
            filledCount += 1;
            return { ...cat, filled: true, playerName: currentPlayer.name };
          }
          return cat;
        });

        setCorrectPlacements(prev => prev + filledCount);
        setScore(prev => prev + 10 * filledCount);
      } else {
        // incorrect: mark only the attempted category as filled and record error
        finalBoard = bingoBoard.map(cat => {
          if (cat.id === categoryId) {
            return { ...cat, filled: true, playerName: currentPlayer.name };
          }
          return cat;
        });

        setWrongPlacements(prev => prev + 1);
        setScore(prev => Math.max(0, prev - 5));

        const correctCategories = bingoBoard
          .filter(cat => cat.checkFunction(currentPlayer))
          .map(cat => cat.title);

        const error: GameError = {
          playerName: currentPlayer.name,
          attemptedCategory: clickedCategory.title,
          correctCategories: correctCategories.length > 0 ? correctCategories : [
            ...(currentPlayer.nationality ? [`Nacionalidad: ${currentPlayer.nationality}`] : []),
            ...(currentPlayer.team ? [`Equipo: ${currentPlayer.team}`] : []),
            ...(currentPlayer.age ? [`Edad: ${currentPlayer.age}`] : [])
          ]
        };

        setGameErrors(prev => [...prev, error]);
      }
    }

    setBingoBoard(finalBoard);
    nextPlayer();

    // Verificar si el tablero está completo
    if (finalBoard.every(cat => cat.filled)) {
      setGameFinished(true);
    }
  };

  // Saltar jugador
  const skipPlayer = () => {
    if (!gameStarted || gameFinished) return;
    nextPlayer();
  };

  // Formatear tiempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="card text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400 text-lg">Cargando jugadores...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="card mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                ⚽ Futbol Bingo
              </h1>
              <p className="text-gray-400">
                Coloca a los jugadores en las categorías correctas del tablero
              </p>
            </div>
            
            <div className="flex gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-400">
                  {score}
                </div>
                <div className="text-gray-500 text-sm">Puntos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {correctPlacements}
                </div>
                <div className="text-gray-500 text-sm">Correctos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-400">
                  {wrongPlacements}
                </div>
                <div className="text-gray-500 text-sm">Errores</div>
              </div>
              {gameStarted && !gameFinished && (
                <div>
                  <div className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-red-400' : 'text-yellow-400'}`}>
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-gray-500 text-sm">Tiempo</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {!gameStarted ? (
          // Pantalla de inicio
          <div className="card text-center max-w-2xl mx-auto">
            <div className="text-6xl mb-6">🎯</div>
            <h2 className="text-3xl font-bold text-white mb-4">¡Futbol Bingo!</h2>
            <p className="text-gray-400 mb-6 text-lg">
              Tienes 60 segundos para llenar el tablero. Coloca cada jugador en la categoría correcta.
            </p>
            <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-yellow-300 mb-2">📋 Reglas:</h3>
              <ul className="text-yellow-200 text-sm space-y-1">
                <li>• +10 puntos por colocación correcta</li>
                <li>• -5 puntos por colocación incorrecta</li>
                <li>• Puedes saltar jugadores sin penalización</li>
                <li>• El objetivo es llenar todo el tablero</li>
              </ul>
            </div>
            <button onClick={startGame} className="btn-primary text-xl px-8 py-4">
              🚀 Comenzar Juego
            </button>
          </div>
        ) : gameFinished ? (
          // Pantalla de resultados
          <div className="card text-center max-w-2xl mx-auto">
            <div className="text-6xl mb-6">🏆</div>
            <h2 className="text-3xl font-bold text-white mb-4">¡Juego Terminado!</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="text-3xl font-bold text-blue-400 mb-2">{score}</div>
                <div className="text-gray-400">Puntos Finales</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="text-3xl font-bold text-green-400 mb-2">{correctPlacements}</div>
                <div className="text-gray-400">Correctos</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="text-3xl font-bold text-red-400 mb-2">{wrongPlacements}</div>
                <div className="text-gray-400">Errores</div>
              </div>
            </div>

            <div className="mb-6">
              {correctPlacements >= 10 && (
                <p className="text-green-400 text-lg mb-2">¡Excelente! Eres un maestro del bingo ⚽</p>
              )}
              {correctPlacements >= 7 && correctPlacements < 10 && (
                <p className="text-blue-400 text-lg mb-2">¡Muy bien! Buen conocimiento futbolístico 🎯</p>
              )}
              {correctPlacements >= 4 && correctPlacements < 7 && (
                <p className="text-yellow-400 text-lg mb-2">¡No está mal! Sigue practicando 💪</p>
              )}
              {correctPlacements < 4 && (
                <p className="text-orange-400 text-lg mb-2">¡Puedes mejorar! Inténtalo de nuevo 🔥</p>
              )}
            </div>

            {/* Lista de errores */}
            {gameErrors.length > 0 && (
              <div className="mb-8 bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
                  ❌ Errores Cometidos
                </h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {gameErrors.map((error, index) => (
                    <div key={index} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
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
                              {error.correctCategories.some(cat => cat.startsWith('Nacionalidad:') || cat.startsWith('Equipo:') || cat.startsWith('Edad:')) ? (
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
                            <div className="text-sm text-gray-400">
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
              <button onClick={startGame} className="btn-primary">
                🔄 Jugar de Nuevo
              </button>
              <button onClick={() => window.location.href = '/'} className="btn-secondary">
                🏠 Volver al Inicio
              </button>
            </div>
          </div>
        ) : (
          // Juego en progreso
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Jugador actual */}
            <div className="xl:col-span-1">
              {currentPlayer && (
                <div className="card text-center sticky top-8">
                  <div className="mb-4">
                    <div className="text-sm text-gray-400 mb-2">Jugador Actual:</div>
                    {currentPlayer.photo_url && (
                      <img 
                        src={currentPlayer.photo_url} 
                        alt={currentPlayer.name}
                        className="w-32 h-32 md:w-40 md:h-40 rounded-2xl mx-auto object-cover shadow-2xl border border-gray-700 mb-4"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
                      {currentPlayer.name}
                    </h3>
                    
                    {/* Mostrar información del jugador */}
                    <div className="text-sm text-gray-300 mb-4 space-y-1">
                      {currentPlayer.nationality && (
                        <div>🇫🇷 Nacionalidad: {currentPlayer.nationality}</div>
                      )}
                      {currentPlayer.team && (
                        <div>⚽ Equipo: {currentPlayer.team}</div>
                      )}
                      {currentPlayer.age && (
                        <div>🎂 Edad: {currentPlayer.age}</div>
                      )}
                    </div>
                    
                    {/* Mostrar categorías válidas */}
                    {(() => {
                      const validCategories = bingoBoard
                        .filter(cat => cat.checkFunction(currentPlayer))
                        .map(cat => cat.title);
                      
                      return validCategories.length > 0 ? (
                        <div className="bg-green-900/20 border border-green-800 rounded-lg p-3 mb-4">
                          <div className="text-sm text-green-300 font-medium mb-2">
                            ✅ Categorías válidas:
                          </div>
                          <div className="text-sm text-green-200">
                            {validCategories.join(', ')}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-3 mb-4">
                          <div className="text-sm text-yellow-300">
                            ⚠️ No hay categorías disponibles para este jugador
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  
                  <button 
                    onClick={skipPlayer}
                    className="btn-secondary w-full"
                  >
                    ⏭️ Saltar Jugador
                  </button>
                </div>
              )}
            </div>

            {/* Tablero de Bingo */}
            <div className="xl:col-span-2">
              <div className="card">
                <h3 className="text-xl font-bold text-white mb-6 text-center">Tablero de Bingo</h3>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {bingoBoard.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryClick(category.id)}
                      disabled={category.filled}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-center min-h-[100px] flex flex-col justify-center ${
                        category.filled
                          ? 'bg-green-600 border-green-500 text-white cursor-default'
                          : 'bg-gray-800 hover:bg-gray-700 border-gray-600 hover:border-gray-500 text-gray-100 hover:scale-105 cursor-pointer'
                      }`}
                    >
                      <div className="font-semibold text-sm mb-1">{category.title}</div>
                      {category.filled && category.playerName && (
                        <div className="text-xs text-green-200 mt-1">
                          {category.playerName}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BingoGame;
