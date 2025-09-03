import React from 'react';

interface GameStatsProps {
  score: number;
  correctPlacements: number;
  wrongPlacements: number;
  timeLeft?: number;
  showTimer?: boolean;
}

const GameStats: React.FC<GameStatsProps> = ({ 
  score, 
  correctPlacements, 
  wrongPlacements, 
  timeLeft, 
  showTimer = false 
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex gap-6 text-center">
      <div>
        <div className="text-2xl font-bold text-blue-400">
          {score}
        </div>
        <div className="text-white/50 text-sm">Puntos</div>
      </div>
      
      <div>
        <div className="text-2xl font-bold text-green-400">
          {correctPlacements}
        </div>
        <div className="text-white/50 text-sm">Correctos</div>
      </div>
      
      <div>
        <div className="text-2xl font-bold text-red-400">
          {wrongPlacements}
        </div>
        <div className="text-white/50 text-sm">Errores</div>
      </div>
      
      {showTimer && timeLeft !== undefined && (
        <div>
          <div className={`text-2xl font-bold ${
            timeLeft <= 10 ? 'text-red-400' : 'text-yellow-400'
          }`}>
            {formatTime(timeLeft)}
          </div>
          <div className="text-white/50 text-sm">Tiempo</div>
        </div>
      )}
    </div>
  );
};

export default GameStats;
