import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import type { Player } from '../services/apiService';

const TeamQuiz = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [loading, setLoading] = useState(true);
  const [correctTeam, setCorrectTeam] = useState('');
  const [streak, setStreak] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const totalQuestions = 10;

  const loadQuestion = async () => {
    setLoading(true);
    try {
      const allPlayers = await apiService.getRandomPlayers(12);
      
      if (allPlayers.length < 6) {
        console.error('No se pudieron cargar suficientes jugadores');
        return;
      }

      // Agrupar jugadores por equipo
      const playersByTeam: { [key: string]: Player[] } = {};
      allPlayers.forEach(player => {
        const team = player.team;
        if (!playersByTeam[team]) {
          playersByTeam[team] = [];
        }
        playersByTeam[team].push(player);
      });

      // Encontrar un equipo con al menos 2 jugadores para la respuesta correcta
      let targetTeam = '';
      let targetPlayers: Player[] = [];
      
      for (const [team, teamPlayers] of Object.entries(playersByTeam)) {
        if (teamPlayers.length >= 2) {
          targetTeam = team;
          targetPlayers = teamPlayers.slice(0, 2);
          break;
        }
      }

      if (!targetTeam) {
        // Si no hay equipos con 2+ jugadores, crear una pregunta con jugadores individuales
        const shuffledPlayers = allPlayers.sort(() => 0.5 - Math.random()).slice(0, 6);
        setPlayers(shuffledPlayers);
        setCorrectTeam('ninguno');
      } else {
        // Agregar jugadores de otros equipos para completar la lista
        const otherPlayers = allPlayers
          .filter(p => p.team !== targetTeam)
          .slice(0, 4);
        
        const questionPlayers = [...targetPlayers, ...otherPlayers]
          .sort(() => 0.5 - Math.random());
        
        setPlayers(questionPlayers);
        setCorrectTeam(targetTeam);
      }

      setSelectedPlayers([]);
      setShowResult(false);
    } catch (error) {
      console.error('Error loading question:', error);
    }
    setLoading(false);
  };

  const handlePlayerClick = (player: Player) => {
    if (showResult) return;

    if (selectedPlayers.some(p => p.name === player.name && p.team === player.team)) {
      setSelectedPlayers(selectedPlayers.filter(p => !(p.name === player.name && p.team === player.team)));
    } else {
      setSelectedPlayers([...selectedPlayers, player]);
    }
  };

  const submitAnswer = () => {
    if (selectedPlayers.length < 2) return;

    setShowResult(true);
    setQuestionsAnswered(questionsAnswered + 1);

    // Verificar si todos los jugadores seleccionados son del mismo equipo
    const teams = [...new Set(selectedPlayers.map(p => p.team))];
    const allSameTeam = teams.length === 1;
    const selectedCorrectTeam = allSameTeam && teams[0] === correctTeam;

    const isCorrect = selectedCorrectTeam || (correctTeam === 'ninguno' && !allSameTeam);
    
    if (isCorrect) {
      setScore(score + 1);
      setStreak(streak + 1);
    } else {
      setStreak(0);
    }

    // Guardar estadísticas
    const stats = {
      totalQuizzes: questionsAnswered + 1,
      averageScore: Math.round(((score + (isCorrect ? 1 : 0)) / (questionsAnswered + 1)) * 100),
      bestStreak: Math.max(streak, streak + (isCorrect ? 1 : 0))
    };
    localStorage.setItem('futbolquiz-stats', JSON.stringify(stats));

    // Avanzar automáticamente después de 2 segundos
    setTimeout(() => {
      if (questionsAnswered + 1 >= totalQuestions) {
        setGameFinished(true);
      } else {
        loadQuestion();
      }
    }, 2000);
  };

  // Función para siguiente pregunta (se mantiene para compatibilidad futura)
  // const nextQuestion = () => {
  //   if (questionsAnswered >= totalQuestions) {
  //     setGameFinished(true);
  //     return;
  //   }
  //   loadQuestion();
  // };

  const restartGame = () => {
    setScore(0);
    setQuestionsAnswered(0);
    setStreak(0);
    setGameFinished(false);
    setShowResult(false);
    loadQuestion();
  };

  const getPlayerCardStyle = (player: Player) => {
    const isSelected = selectedPlayers.some(p => p.name === player.name && p.team === player.team);
    
    if (!showResult) {
      return isSelected 
        ? 'bg-white/10 backdrop-blur-sm border border-blue-500 rounded-xl p-4 cursor-pointer hover:bg-white/15 transition-all duration-200' 
        : 'bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 cursor-pointer hover:bg-white/10 transition-all duration-200';
    }
    
    const isCorrectPlayer = player.team === correctTeam;
    
    if (isSelected && isCorrectPlayer) {
      return 'bg-green-500/20 backdrop-blur-sm border border-green-500 rounded-xl p-4';
    } else if (isSelected && !isCorrectPlayer) {
      return 'bg-red-500/20 backdrop-blur-sm border border-red-500 rounded-xl p-4';
    } else if (!isSelected && isCorrectPlayer) {
      return 'bg-yellow-500/20 backdrop-blur-sm border border-yellow-500 rounded-xl p-4';
    }
    
    return 'bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4';
  };

  useEffect(() => {
    loadQuestion();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white/70 text-lg">Cargando pregunta...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Quiz: Mismo Equipo
              </h1>
              <p className="text-white/70">
                Selecciona los jugadores que juegan en el mismo equipo
              </p>
            </div>
            <div className="flex gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-400">
                  {score}/{questionsAnswered}
                </div>
                <div className="text-white/50 text-sm">Puntuación</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {questionsAnswered}/{totalQuestions}
                </div>
                <div className="text-white/50 text-sm">Progreso</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">
                  {streak}
                </div>
                <div className="text-white/50 text-sm">Racha</div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        {!gameFinished && (
        <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-800 rounded-xl p-6 mb-6">
          <div className="flex items-start space-x-3">
            <div className="text-blue-400 text-xl flex-shrink-0">💡</div>
            <div>
              <h3 className="font-semibold text-blue-300 mb-1">Instrucciones:</h3>
              <p className="text-blue-200">
                Selecciona 2 o más jugadores que jueguen en el mismo equipo. 
                Solo puedes ver el nombre, posición y edad. ¡No hay nombres de equipos!
              </p>
            </div>
          </div>
        </div>
        )}

        {/* Players Grid */}
        {!gameFinished && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {players.map((player, index) => (
            <div
              key={`${player.name}-${player.team}-${index}`}
              className={`${getPlayerCardStyle(player)} relative`}
              onClick={() => handlePlayerClick(player)}
            >
              {/* Player Photo */}
              {player.photo_url && (
                <div className="mb-3">
                  <img 
                    src={player.photo_url} 
                    alt={player.name}
                    className="w-16 h-16 md:w-20 md:h-20 rounded-full mx-auto object-cover border-2 border-white/20"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              {/* Player Info */}
              <div className="text-center space-y-1">
                <h3 className="font-semibold text-white text-sm md:text-base">
                  {player.name}
                </h3>
              </div>

              {/* Selection Indicator */}
              {selectedPlayers.some(p => p.name === player.name && p.team === player.team) && !showResult && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}

              {/* Result Indicators */}
              {showResult && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center">
                  {selectedPlayers.some(p => p.name === player.name && p.team === player.team) && player.team === correctTeam && (
                    <span className="text-green-400 text-lg">✓</span>
                  )}
                  {selectedPlayers.some(p => p.name === player.name && p.team === player.team) && player.team !== correctTeam && (
                    <span className="text-red-400 text-lg">✗</span>
                  )}
                  {!selectedPlayers.some(p => p.name === player.name && p.team === player.team) && player.team === correctTeam && (
                    <span className="text-yellow-400 text-lg">!</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        )}

        {/* Controls */}
        {!showResult && !gameFinished && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
            <p className="text-white/70 mb-4">
              Jugadores seleccionados: <span className="text-blue-400 font-semibold">{selectedPlayers.length}</span>
            </p>
            <button 
              onClick={submitAnswer}
              disabled={selectedPlayers.length < 2}
              className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 ${
                selectedPlayers.length < 2 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
              }`}
            >
              Enviar Respuesta
            </button>
          </div>
        )}

        {/* Result */}
        {showResult && !gameFinished && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
            <div className="mb-4">
              {(() => {
                const teams = [...new Set(selectedPlayers.map(p => p.team))];
                const allSameTeam = teams.length === 1;
                const selectedCorrectTeam = allSameTeam && teams[0] === correctTeam;
                const isCorrect = selectedCorrectTeam || (correctTeam === 'ninguno' && !allSameTeam);

                return (
                  <div className={`text-2xl font-bold mb-4 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                    {isCorrect ? '¡Correcto! 🎉' : '¡Incorrecto! 😞'}
                  </div>
                );
              })()}
            </div>
            
            <p className="text-white/70 mb-6">
              {correctTeam !== 'ninguno' 
                ? `Los jugadores correctos eran los de: ${correctTeam}`
                : 'En esta ronda no había jugadores del mismo equipo'
              }
            </p>
            
            <p className="text-sm text-white/50">
              Avanzando automáticamente en 2 segundos...
            </p>
          </div>
        )}

        {/* Final Results */}
        {gameFinished && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center">
            <div className="text-4xl font-bold text-blue-400 mb-6">
              ¡Quiz Completado! 🏆
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="text-3xl font-bold text-green-400 mb-2">
                  {score}/{totalQuestions}
                </div>
                <div className="text-white/50">Respuestas Correctas</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="text-3xl font-bold text-purple-400 mb-2">
                  {Math.round((score / totalQuestions) * 100)}%
                </div>
                <div className="text-white/50">Porcentaje</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="text-3xl font-bold text-yellow-400 mb-2">
                  {streak}
                </div>
                <div className="text-white/50">Mejor Racha</div>
              </div>
            </div>

            <div className="mb-6">
              {score >= 8 && (
                <p className="text-green-400 text-lg mb-2">¡Excelente! Tienes un gran ojo para los equipos 🌟</p>
              )}
              {score >= 6 && score < 8 && (
                <p className="text-blue-400 text-lg mb-2">¡Muy bien! Conoces bien los equipos ⚽</p>
              )}
              {score >= 4 && score < 6 && (
                <p className="text-yellow-400 text-lg mb-2">¡No está mal! Sigue practicando 💪</p>
              )}
              {score < 4 && (
                <p className="text-orange-400 text-lg mb-2">¡Necesitas conocer mejor los equipos! No te rindas 🎯</p>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={restartGame}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 hover:scale-105"
              >
                Jugar de Nuevo
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-lg border border-white/20 hover:border-white/30 transition-all duration-200"
              >
                Volver al Inicio
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamQuiz;
