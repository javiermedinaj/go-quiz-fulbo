import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import type { Player } from '../services/apiService';

const NationalityQuiz = () => {
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const totalQuestions = 10;

  const loadQuestion = async () => {
    setLoading(true);
    try {
      const players = await apiService.getRandomPlayers(20);
      
      // Filtrar jugadores con foto
      const playersWithPhoto = players.filter(player => player.photo_url);
      
      if (playersWithPhoto.length === 0) {
        console.error('No se encontraron jugadores con foto');
        return;
      }

      const randomPlayer = playersWithPhoto[Math.floor(Math.random() * playersWithPhoto.length)];
      setCurrentPlayer(randomPlayer);

      // Obtener nacionalidades para las opciones
      const allNationalities = [...new Set(players.map(p => p.nationality).filter(Boolean))];
      const correctNationality = randomPlayer.nationality;
      
      // Crear opciones (3 incorrectas + 1 correcta)
      const incorrectOptions = allNationalities
        .filter(nationality => nationality !== correctNationality)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      
      const allOptions = [...incorrectOptions, correctNationality]
        .sort(() => 0.5 - Math.random());
      
      setOptions(allOptions);
      setSelectedAnswer('');
      setShowResult(false);
    } catch (error) {
      console.error('Error loading question:', error);
    }
    setLoading(false);
  };

  const handleAnswerSelect = (answer: string) => {
    if (showResult) return;
    
    setSelectedAnswer(answer);
    setShowResult(true);
    setQuestionsAnswered(questionsAnswered + 1);

    const isCorrect = answer === currentPlayer?.nationality;
    
    if (isCorrect) {
      setScore(score + 1);
      setStreak(streak + 1);
      if (streak + 1 > bestStreak) {
        setBestStreak(streak + 1);
      }
    } else {
      setStreak(0);
    }

    // Guardar estadísticas
    const stats = {
      totalQuizzes: questionsAnswered + 1,
      averageScore: Math.round(((score + (isCorrect ? 1 : 0)) / (questionsAnswered + 1)) * 100),
      bestStreak: Math.max(bestStreak, streak + (isCorrect ? 1 : 0))
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

  const getOptionStyle = (option: string) => {
    if (!showResult) {
      return 'bg-white/5 hover:bg-white/10 border-white/20 hover:border-white/30 text-white';
    }
    
    if (option === currentPlayer?.nationality) {
      return 'bg-green-600 border-green-500 text-white';
    }
    
    if (option === selectedAnswer && option !== currentPlayer?.nationality) {
      return 'bg-red-600 border-red-500 text-white';
    }
    
    return 'bg-white/5 border-white/10 text-white/50';
  };

  useEffect(() => {
    loadQuestion();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-4xl mx-auto px-4 py-12">
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Quiz de Nacionalidad
              </h1>
              <p className="text-white/70">
                ¿De qué país es este jugador?
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

        {/* Player Card */}
        {currentPlayer && !gameFinished && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-8 text-center">
            <div className="mb-6">
              {currentPlayer.photo_url && (
                <div className="relative inline-block">
                  <img 
                    src={currentPlayer.photo_url} 
                    alt="Jugador"
                    className="w-32 h-32 md:w-48 md:h-48 rounded-2xl mx-auto object-cover shadow-2xl border border-white/20"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {currentPlayer.name}
              </h2>
            </div>
          </div>
        )}

        {/* Options */}
        {!gameFinished && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(option)}
              disabled={showResult}
              className={`p-4 md:p-6 rounded-xl border-2 transition-all duration-200 font-medium text-lg ${getOptionStyle(option)} ${
                !showResult ? 'hover:scale-105 cursor-pointer' : 'cursor-default'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{option}</span>
                {showResult && option === currentPlayer?.nationality && (
                  <span className="text-xl">✓</span>
                )}
                {showResult && option === selectedAnswer && option !== currentPlayer?.nationality && (
                  <span className="text-xl">✗</span>
                )}
              </div>
            </button>
          ))}
        </div>
        )}

        {/* Result */}
        {showResult && !gameFinished && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
            <div className={`text-2xl font-bold mb-4 ${
              selectedAnswer === currentPlayer?.nationality ? 'text-green-400' : 'text-red-400'
            }`}>
              {selectedAnswer === currentPlayer?.nationality ? '¡Correcto! 🎉' : '¡Incorrecto! 😞'}
            </div>
            
            {selectedAnswer !== currentPlayer?.nationality && (
              <p className="text-white/70 mb-6">
                La respuesta correcta era: <span className="text-green-400 font-semibold">{currentPlayer?.nationality}</span>
              </p>
            )}
            
            <p className="text-sm text-white/50">
              {questionsAnswered >= totalQuestions ? 'Mostrando resultados...' : 'Avanzando automáticamente en 2 segundos...'}
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
                  {bestStreak}
                </div>
                <div className="text-white/50">Mejor Racha</div>
              </div>
            </div>

            <div className="mb-6">
              {score >= 8 && (
                <p className="text-green-400 text-lg mb-2">¡Excelente! Eres un experto en fútbol 🌟</p>
              )}
              {score >= 6 && score < 8 && (
                <p className="text-blue-400 text-lg mb-2">¡Muy bien! Tienes buenos conocimientos ⚽</p>
              )}
              {score >= 4 && score < 6 && (
                <p className="text-yellow-400 text-lg mb-2">¡No está mal! Sigue practicando 💪</p>
              )}
              {score < 4 && (
                <p className="text-orange-400 text-lg mb-2">¡Necesitas más práctica! No te rindas 🎯</p>
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

export default NationalityQuiz;
