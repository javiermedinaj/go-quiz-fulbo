import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';

interface QuizQuestion {
  gameData: {
    question: string;
    answers: string[];
  };
}

const Questions: React.FC = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [foundAnswers, setFoundAnswers] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [showHints, setShowHints] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); 

  const totalQuestions = 10;

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (!showResult && !gameFinished && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showResult) {
      submitAnswer();
    }
  }, [timeLeft, showResult, gameFinished]);

  useEffect(() => {
    setTimeLeft(120);
  }, [currentQuestionIndex]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const data = await apiService.getQuizQuestions(totalQuestions);
      setQuestions(data.questions);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim();
  };

  const findSuggestions = (input: string) => {
    if (input.length < 2) return [];
    
    const normalizedInput = normalizeText(input);
    const allAnswers = currentQuestion.gameData.answers;
    
    return allAnswers.filter(answer => {
      const normalizedAnswer = normalizeText(answer);
      return normalizedAnswer.includes(normalizedInput) && 
             !foundAnswers.some(found => normalizeText(found) === normalizedAnswer);
    }).slice(0, 5);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    const newSuggestions = findSuggestions(value);
    setSuggestions(newSuggestions);
  };

  const addAnswer = (answer: string) => {
    if (!foundAnswers.includes(answer)) {
      setFoundAnswers(prev => [...prev, answer]);
      setInputValue('');
      setSuggestions([]);
    }
  };

  const removeAnswer = (answer: string) => {
    setFoundAnswers(prev => prev.filter(a => a !== answer));
  };

  const getHint = (answer: string, level: number = 1) => {
    switch (level) {
      case 1: 
        return answer.substring(0, Math.min(3, Math.floor(answer.length / 3))) + '...';
      case 2: 
        return answer.substring(0, Math.min(5, Math.floor(answer.length / 2))) + '...';
      case 3: 
        return answer.substring(0, answer.length - 2) + '..';
      default:
        return answer.substring(0, 2) + '...';
    }
  };

  const submitAnswer = () => {
    setShowResult(true);

    const correctAnswers = currentQuestion.gameData.answers;
    const foundPercentage = foundAnswers.length / correctAnswers.length;
    
    let questionScore = 0;
    if (foundPercentage >= 0.7) questionScore = 1; 
    else if (foundPercentage >= 0.5) questionScore = 0.8; 
    else if (foundPercentage >= 0.3) questionScore = 0.5; 
    else if (foundPercentage >= 0.1) questionScore = 0.2; 

    if (questionScore >= 0.8) {
      setCurrentStreak(prev => prev + 1);
      setStreak(prev => Math.max(prev, currentStreak + 1));
    } else {
      setCurrentStreak(0);
    }

    setScore(prev => prev + questionScore);

    // Auto-avance deshabilitado en BETA - se controla manualmente
    // setTimeout(() => {
    //   nextQuestion();
    // }, 4000);
  };

  const nextQuestion = () => {
    setShowResult(false);
    setFoundAnswers([]);
    setInputValue('');
    setSuggestions([]);
    setShowHints(false);
    
    if (currentQuestionIndex + 1 >= totalQuestions) {
      setGameFinished(true);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const restartGame = () => {
    setCurrentQuestionIndex(0);
    setFoundAnswers([]);
    setInputValue('');
    setSuggestions([]);
    setShowResult(false);
    setScore(0);
    setGameFinished(false);
    setStreak(0);
    setCurrentStreak(0);
    setShowHints(false);
    fetchQuestions();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚽</div>
          <div className="text-xl">Cargando preguntas...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center max-w-md">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold mb-4">Error al cargar</h2>
          <p className="text-white/70 mb-6">{error}</p>
          <button 
            onClick={fetchQuestions}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 hover:scale-105"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❓</div>
          <div className="text-xl">No hay preguntas disponibles</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Quiz de Fútbol
            <span className="text-sm ml-3 bg-orange-500/20 text-orange-400 px-2 py-1 rounded border border-orange-500/30">
              BETA
            </span>
          </h1>
          {!gameFinished && (
            <div className="flex justify-center items-center gap-6 text-sm flex-wrap">
              <span className="bg-blue-600/20 px-3 py-1 rounded-full border border-blue-600/30">
                Pregunta {currentQuestionIndex + 1} de {totalQuestions}
              </span>
              <span className="bg-green-600/20 px-3 py-1 rounded-full border border-green-600/30">
                Puntaje: {Math.round(score * 10) / 10}
              </span>
              {currentStreak > 0 && (
                <span className="bg-yellow-600/20 px-3 py-1 rounded-full border border-yellow-600/30">
                  Racha: {currentStreak}
                </span>
              )}
              <span className={`px-3 py-1 rounded-full border ${
                timeLeft <= 30 ? 'bg-red-600/20 border-red-600/30 text-red-400' : 'bg-purple-600/20 border-purple-600/30'
              }`}>
                ⏱️ {formatTime(timeLeft)}
              </span>
            </div>
          )}
        </div>

        {!gameFinished && (
          <div className="mb-8">
            <div className="bg-white/10 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
              />
            </div>
          </div>
        )}

        {!gameFinished && currentQuestion && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-center">
              {currentQuestion.gameData.question}
            </h2>
            
            <div className="mb-6 text-center">
              <span className="text-white/70 text-sm">
                Total de respuestas posibles: {currentQuestion.gameData.answers.length}
              </span>
            </div>

            <div className="relative mb-6">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Escribe el nombre de un jugador..."
                className="w-full p-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:bg-white/15"
                disabled={showResult}
              />
              
              {suggestions.length > 0 && !showResult && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg max-h-48 overflow-y-auto z-10">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => addAnswer(suggestion)}
                      className="w-full text-left p-3 hover:bg-white/20 transition-colors text-white border-b border-white/10 last:border-b-0"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {foundAnswers.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-green-400">
                  Respuestas encontradas ({foundAnswers.length}/{currentQuestion.gameData.answers.length}):
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {foundAnswers.map((answer, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-green-600/20 border border-green-600/30 rounded-lg p-3"
                    >
                      <span className="text-green-200">{answer}</span>
                      {!showResult && (
                        <button
                          onClick={() => removeAnswer(answer)}
                          className="text-red-400 hover:text-red-300 ml-2"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!showResult && foundAnswers.length < currentQuestion.gameData.answers.length && (
              <div className="text-center mb-6">
                <button
                  onClick={() => setShowHints(!showHints)}
                  className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 border border-yellow-600/30 px-4 py-2 rounded-lg transition-all duration-200"
                >
                  {showHints ? 'Ocultar Pistas' : `Ver Pistas (${currentQuestion.gameData.answers.length - foundAnswers.length} restantes)`}
                </button>
              </div>
            )}

            {showHints && !showResult && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-yellow-400">Pistas:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {currentQuestion.gameData.answers
                    .filter(answer => !foundAnswers.includes(answer))
                    .map((answer, index) => (
                      <div
                        key={index}
                        className="bg-yellow-600/10 border border-yellow-600/20 rounded-lg p-3 text-yellow-200 text-center"
                      >
                        {getHint(answer, Math.min(3, Math.floor(foundAnswers.length / 3) + 1))}
                      </div>
                    ))}
                </div>
              </div>
            )}

            <p className="text-white/50 text-sm text-center">
              Escribe los nombres para autocompletar • Usa las pistas si necesitas ayuda
            </p>
          </div>
        )}

        {!showResult && !gameFinished && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
            <p className="text-white/70 mb-4">
              Respuestas encontradas: <span className="text-blue-400 font-semibold">{foundAnswers.length}</span> de {currentQuestion?.gameData.answers.length || 0}
            </p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={submitAnswer}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 hover:scale-105"
              >
                Enviar Respuesta
              </button>
              {foundAnswers.length === 0 && (
                <button 
                  onClick={() => setShowHints(true)}
                  className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 border border-yellow-600/30 font-bold py-3 px-6 rounded-lg transition-all duration-200"
                >
                  Ver Pistas
                </button>
              )}
              <button 
                onClick={nextQuestion}
                className="bg-gray-600/20 hover:bg-gray-600/30 text-gray-300 border border-gray-600/30 font-bold py-3 px-6 rounded-lg transition-all duration-200"
              >
                Saltar →
              </button>
            </div>
          </div>
        )}

        {showResult && !gameFinished && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
            <div className="mb-4">
              {(() => {
                const correctAnswers = currentQuestion.gameData.answers;
                const foundPercentage = foundAnswers.length / correctAnswers.length;
                let message = '';
                let color = '';
                
                if (foundPercentage >= 0.7) {
                  message = '¡Excelente! 🎉';
                  color = 'text-green-400';
                } else if (foundPercentage >= 0.5) {
                  message = '¡Muy bien! 👏';
                  color = 'text-blue-400';
                } else if (foundPercentage >= 0.3) {
                  message = '¡No está mal! 👍';
                  color = 'text-yellow-400';
                } else {
                  message = '¡Puedes mejorar! 💪';
                  color = 'text-orange-400';
                }

                return (
                  <div className={`text-2xl font-bold mb-4 ${color}`}>
                    {message}
                  </div>
                );
              })()}
            </div>
            
            <div className="mb-6">
              <p className="text-white/70 mb-4">
                Encontraste {foundAnswers.length} de {currentQuestion.gameData.answers.length} respuestas ({Math.round((foundAnswers.length / currentQuestion.gameData.answers.length) * 100)}%)
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {currentQuestion.gameData.answers.map((answer, index) => (
                  <span 
                    key={index}
                    className={`p-2 rounded text-sm ${
                      foundAnswers.includes(answer) 
                        ? 'bg-green-600/30 text-green-200' 
                        : 'bg-red-600/30 text-red-200'
                    }`}
                  >
                    {answer} {foundAnswers.includes(answer) ? '✓' : '✗'}
                  </span>
                ))}
              </div>
            </div>
            
            <p className="text-sm text-white/50 mb-4">
              Modo BETA: Avanza manualmente a la siguiente pregunta
            </p>
            
            <button 
              onClick={nextQuestion}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 hover:scale-105"
            >
              {currentQuestionIndex + 1 >= totalQuestions ? 'Ver Resultados Finales' : 'Siguiente Pregunta'} →
            </button>
          </div>
        )}

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
                <p className="text-green-400 text-lg mb-2">¡Excelente! Eres un experto en fútbol 🌟</p>
              )}
              {score >= 6 && score < 8 && (
                <p className="text-blue-400 text-lg mb-2">¡Muy bien! Tienes buen conocimiento ⚽</p>
              )}
              {score >= 4 && score < 6 && (
                <p className="text-yellow-400 text-lg mb-2">¡No está mal! Sigue aprendiendo 💪</p>
              )}
              {score < 4 && (
                <p className="text-orange-400 text-lg mb-2">¡Hay que estudiar más fútbol! No te rindas 🎯</p>
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
                onClick={() => navigate('/')}
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

export default Questions;
