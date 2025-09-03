interface UserStats {
  totalQuizzes: number;
  averageScore: number;
  bestStreak: number;
}

interface StatsSectionProps {
  stats: UserStats;
}

const StatsSection = ({ stats }: StatsSectionProps) => {
  if (stats.totalQuizzes === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 text-center hover:bg-slate-800/70 transition-all duration-300">
        <div className="text-3xl font-bold text-blue-400 mb-2">{stats.totalQuizzes}</div>
        <div className="text-slate-400">Quizzes Completados</div>
      </div>
      
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 text-center hover:bg-slate-800/70 transition-all duration-300">
        <div className="text-3xl font-bold text-green-400 mb-2">{stats.averageScore}%</div>
        <div className="text-slate-400">Promedio</div>
      </div>
      
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 text-center hover:bg-slate-800/70 transition-all duration-300">
        <div className="text-3xl font-bold text-purple-400 mb-2">{stats.bestStreak}</div>
        <div className="text-slate-400">Mejor Racha</div>
      </div>
    </div>
  );
};

export default StatsSection;
