import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import type { Player } from '../services/apiService';

const AgeQuiz = () => {
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [options, setOptions] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actualAge, setActualAge] = useState<number | null>(null);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const totalQuestions = 10;

  const parseAge = (ageString: string): number | null => {
    if (!ageString) return null;
    
    // Buscar patrones como "24/01/1996 (29)" o "(29)"
    const matches = ageString.match(/\((\d+)\)/);
    if (matches) {
      return parseInt(matches[1]);
    }
    
    // Si es solo un número
    const numMatch = ageString.match(/^\d+$/);
    if (numMatch) {
      return parseInt(ageString);
    }
    
    return null;
  };

  const loadQuestion = async () => {
    setLoading(true);
    try {
      const players = await apiService.getRandomPlayers(20);
      
      // Filtrar jugadores que tengan edad válida y foto
      const validPlayers = players.filter(player => {
        const age = parseAge(player.age);
        return age && age > 16 && age < 45 && player.photo_url;
      });

      if (validPlayers.length === 0) {
        console.error('No se pudieron encontrar jugadores con edad válida');
        return;
      }

      const randomPlayer = validPlayers[Math.floor(Math.random() * validPlayers.length)];
      const realAge = parseAge(randomPlayer.age);
      
      if (!realAge) {
        console.error('No se pudo obtener la edad del jugador');
        return;
      }

      setCurrentPlayer(randomPlayer);
      setActualAge(realAge);
      
      // Generar opciones realistas (edad real + 3 opciones cercanas)
      const generateOptions = (correctAge: number): number[] => {
        const options = [correctAge];
        const range = [-4, -3, -2, -1, 1, 2, 3, 4]; // Diferencias posibles
        
        // Agregar opciones dentro de un rango realista
        while (options.length < 4) {
          const randomDiff = range[Math.floor(Math.random() * range.length)];
          const newAge = correctAge + randomDiff;
          
          // Asegurar que la edad esté en un rango válido y no se repita
          if (newAge >= 17 && newAge <= 42 && !options.includes(newAge)) {
            options.push(newAge);
          }
        }
        
        return options.sort(() => 0.5 - Math.random()); // Mezclar opciones
      };

      setOptions(generateOptions(realAge));
      setSelectedAnswer(null);
      setShowResult(false);
      setPoints(0);
    } catch (error) {
      console.error('Error loading question:', error);
    }
    setLoading(false);
  };

  const handleAnswerSelect = (selectedAge: number) => {
    if (showResult || !actualAge) return;

    setSelectedAnswer(selectedAge);
    setShowResult(true);
    setQuestionsAnswered(questionsAnswered + 1);

    // Calcular puntos basado en qué tan cerca estuvo
    const difference = Math.abs(selectedAge - actualAge);
    let earnedPoints = 0;
    
    if (difference === 0) {
      earnedPoints = 10; // Edad exacta
    } else if (difference === 1) {
      earnedPoints = 8; // Muy cerca
    } else if (difference === 2) {
      earnedPoints = 6; // Cerca
    } else if (difference <= 3) {
      earnedPoints = 4; // Aceptable
    } else if (difference <= 5) {
      earnedPoints = 2; // Lejos pero algo
    }
    // difference > 5 = 0 puntos

    setPoints(earnedPoints);
    setScore(score + earnedPoints);

    if (earnedPoints > 0) {
      setStreak(streak + 1);
    } else {
      setStreak(0);
    }

    // Guardar estadísticas
    const stats = {
      totalQuizzes: questionsAnswered + 1,
      averageScore: Math.round(((score + earnedPoints) / ((questionsAnswered + 1) * 10)) * 100),
      bestStreak: Math.max(streak, streak + (earnedPoints > 0 ? 1 : 0))
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

  const getDifferenceMessage = () => {
    if (!actualAge || selectedAnswer === null) return { message: '', color: '', points: 0 };
    
    const difference = Math.abs(selectedAnswer - actualAge);
    
    if (difference === 0) {
      return { message: '¡Exacto! 🎯', color: 'text-green-400', points: 10 };
    } else if (difference === 1) {
      return { message: '¡Muy cerca! 🔥', color: 'text-green-400', points: 8 };
    } else if (difference === 2) {
      return { message: 'Cerca 👍', color: 'text-yellow-400', points: 6 };
    } else if (difference <= 3) {
      return { message: 'Aceptable 👌', color: 'text-yellow-400', points: 4 };
    } else if (difference <= 5) {
      return { message: 'Un poco lejos 😅', color: 'text-orange-400', points: 2 };
    } else {
      return { message: 'Muy lejos 😱', color: 'text-red-400', points: 0 };
    }
  };

  const getOptionStyle = (option: number) => {
    if (!showResult) {
      return 'bg-gray-800 hover:bg-gray-700 border-gray-600 hover:border-gray-500 text-gray-100 hover:scale-105';
    }
    
    if (option === actualAge) {
      return 'bg-green-600 border-green-500 text-white';
    }
    
    if (option === selectedAnswer && option !== actualAge) {
      return 'bg-red-600 border-red-500 text-white';
    }
    
    return 'bg-gray-800 border-gray-600 text-gray-400';
  };

  useEffect(() => {
    loadQuestion();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="card text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400 text-lg">Cargando pregunta...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="card mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Quiz de Edad
              </h1>
              <p className="text-gray-400">
                ¿Cuántos años tiene este jugador?
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
                  {questionsAnswered}/{totalQuestions}
                </div>
                <div className="text-gray-500 text-sm">Progreso</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">
                  {streak}
                </div>
                <div className="text-gray-500 text-sm">Racha</div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        {!gameFinished && (
        <div className="card mb-6 bg-purple-900/20 border-purple-800">
          <div className="flex items-start space-x-3">
            <div className="text-purple-400 text-xl flex-shrink-0">🎯</div>
            <div>
              <h3 className="font-semibold text-purple-300 mb-1">Sistema de Puntuación:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-purple-200">
                <div>Exacto: <span className="text-green-400 font-semibold">10 pts</span></div>
                <div>±1 año: <span className="text-green-400 font-semibold">8 pts</span></div>
                <div>±2 años: <span className="text-yellow-400 font-semibold">6 pts</span></div>
                <div>±3 años: <span className="text-yellow-400 font-semibold">4 pts</span></div>
                <div>±4-5 años: <span className="text-orange-400 font-semibold">2 pts</span></div>
                <div>+5 años: <span className="text-red-400 font-semibold">0 pts</span></div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Player Card */}
        {currentPlayer && !gameFinished && (
          <div className="card mb-8 text-center">
            <div className="mb-6">
              {currentPlayer.photo_url && (
                <div className="relative inline-block">
                  <img 
                    src={currentPlayer.photo_url} 
                    alt="Jugador"
                    className="w-32 h-32 md:w-48 md:h-48 rounded-2xl mx-auto object-cover shadow-2xl border border-gray-700"
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
        {!showResult && !gameFinished && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(option)}
                className={`p-6 rounded-xl border-2 transition-all duration-200 font-medium text-2xl ${getOptionStyle(option)} cursor-pointer`}
              >
                <div className="flex items-center justify-center">
                  <span>{option} años</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Result */}
        {showResult && !gameFinished && (
          <div className="card text-center">
            <div className="mb-6">
              <div className={`text-3xl font-bold mb-2 ${getDifferenceMessage().color}`}>
                {getDifferenceMessage().message}
              </div>
              <div className="text-xl text-gray-300 mb-4">
                Tu respuesta: <span className="text-blue-400 font-semibold">{selectedAnswer} años</span>
              </div>
              <div className="text-xl text-gray-300 mb-4">
                Edad real: <span className="text-green-400 font-semibold">{actualAge} años</span>
              </div>
              <div className="text-2xl font-bold text-purple-400">
                +{points} puntos
              </div>
            </div>
            
            <p className="text-sm text-gray-500">
              {questionsAnswered >= totalQuestions ? 'Mostrando resultados...' : 'Avanzando automáticamente en 2 segundos...'}
            </p>
          </div>
        )}

        {/* Final Results */}
        {gameFinished && (
          <div className="card text-center">
            <div className="text-4xl font-bold text-blue-400 mb-6">
              ¡Quiz Completado! 🏆
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="text-3xl font-bold text-green-400 mb-2">
                  {score}/{totalQuestions * 10}
                </div>
                <div className="text-gray-400">Puntos Totales</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="text-3xl font-bold text-purple-400 mb-2">
                  {Math.round((score / (totalQuestions * 10)) * 100)}%
                </div>
                <div className="text-gray-400">Precisión</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="text-3xl font-bold text-yellow-400 mb-2">
                  {streak}
                </div>
                <div className="text-gray-400">Mejor Racha</div>
              </div>
            </div>

            <div className="mb-6">
              {score >= 80 && (
                <p className="text-green-400 text-lg mb-2">¡Increíble! Tienes un ojo excepcional para las edades 🌟</p>
              )}
              {score >= 60 && score < 80 && (
                <p className="text-blue-400 text-lg mb-2">¡Muy bien! Tienes buen ojo para calcular edades ⚽</p>
              )}
              {score >= 40 && score < 60 && (
                <p className="text-yellow-400 text-lg mb-2">¡No está mal! Sigue practicando 💪</p>
              )}
              {score < 40 && (
                <p className="text-orange-400 text-lg mb-2">¡Las edades son difíciles! No te rindas 🎯</p>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={restartGame}
                className="btn-primary"
              >
                Jugar de Nuevo
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="btn-secondary"
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

export default AgeQuiz;
