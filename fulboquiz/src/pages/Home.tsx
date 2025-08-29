import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

const Home = () => {
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    averageScore: 0,
    bestStreak: 0
  });

  useEffect(() => {
    const savedStats = localStorage.getItem('futbolquiz-stats');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  }, []);

  const quizTypes = [
    {
      id: 'bingo-game',
      title: 'Futbol Bingo',
      description: 'Llena el tablero colocando jugadores en las categorías correctas',
      icon: '🎯',
      difficulty: 'Experto',
      estimatedTime: '1 min',
      color: 'from-red-500 to-orange-600',
      hoverColor: 'hover:from-red-600 hover:to-orange-700'
    },
    {
      id: 'nationality-quiz',
      title: 'Quiz de Nacionalidad',
      description: 'Adivina la nacionalidad del jugador viendo su foto',
      icon: '🌍',
      difficulty: 'Fácil',
      estimatedTime: '2-3 min',
      color: 'from-green-500 to-emerald-600',
      hoverColor: 'hover:from-green-600 hover:to-emerald-700'
    },
    {
      id: 'team-quiz',
      title: 'Mismo Equipo',
      description: 'Selecciona jugadores que juegan en el mismo equipo',
      icon: '👥',
      difficulty: 'Medio',
      estimatedTime: '3-4 min',
      color: 'from-blue-500 to-cyan-600',
      hoverColor: 'hover:from-blue-600 hover:to-cyan-700'
    },
    {
      id: 'age-quiz',
      title: 'Adivina la Edad',
      description: 'Estima la edad del jugador con precisión',
      icon: '🎯',
      difficulty: 'Difícil',
      estimatedTime: '4-5 min',
      color: 'from-purple-500 to-pink-600',
      hoverColor: 'hover:from-purple-600 hover:to-pink-700'
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Fácil': return 'text-green-400 bg-green-400/10';
      case 'Medio': return 'text-yellow-400 bg-yellow-400/10';
      case 'Difícil': return 'text-red-400 bg-red-400/10';
      case 'Experto': return 'text-orange-400 bg-orange-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6">
            <span className="text-3xl">⚽</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Quiz
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto">
            q pelota gerson
          </p>
          <p className="text-gray-400 text-lg">
            Juga nenazo
          </p>
        </div>

        {/* Stats Section */}
        {stats.totalQuizzes > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="card text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">{stats.totalQuizzes}</div>
              <div className="text-gray-400">Quizzes Completados</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">{stats.averageScore}%</div>
              <div className="text-gray-400">Promedio</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">{stats.bestStreak}</div>
              <div className="text-gray-400">Mejor Racha</div>
            </div>
          </div>
        )}

        {/* Quiz Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-12">
          {quizTypes.map((quiz) => (
            <Link
              key={quiz.id}
              to={`/${quiz.id}`}
              className="group block"
            >
              <div className="card-hover h-full">
                <div className="relative overflow-hidden rounded-lg mb-6">
                  <div className={`w-full h-32 bg-gradient-to-br ${quiz.color} ${quiz.hoverColor} transition-all duration-300 flex items-center justify-center group-hover:scale-105`}>
                    <span className="text-4xl group-hover:scale-110 transition-transform duration-300">
                      {quiz.icon}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors duration-200">
                      {quiz.title}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(quiz.difficulty)}`}>
                      {quiz.difficulty}
                    </span>
                  </div>
                  
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {quiz.description}
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                    <div className="flex items-center text-gray-500 text-sm">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {quiz.estimatedTime}
                    </div>
                    <div className="text-blue-400 group-hover:text-blue-300 transition-colors duration-200">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card text-center">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-400 text-xl">🏆</span>
            </div>
            <h3 className="font-semibold text-white mb-2">Múltiples Ligas</h3>
            <p className="text-gray-400 text-sm">Premier, La Liga, Bundesliga, Serie A y Ligue 1</p>
          </div>
          
          <div className="card text-center">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-green-400 text-xl">📊</span>
            </div>
            <h3 className="font-semibold text-white mb-2">Estadísticas</h3>
            <p className="text-gray-400 text-sm">Sigue tu progreso y mejora continua</p>
          </div>
          
          <div className="card text-center">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-purple-400 text-xl">⚡</span>
            </div>
            <h3 className="font-semibold text-white mb-2">Tiempo Real</h3>
            <p className="text-gray-400 text-sm">Datos actualizados de jugadores</p>
          </div>
          
          <div className="card text-center">
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-orange-400 text-xl">🎮</span>
            </div>
            <h3 className="font-semibold text-white mb-2">Divertido</h3>
            <p className="text-gray-400 text-sm">Juegos rápidos y entretenidos</p>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default Home;
