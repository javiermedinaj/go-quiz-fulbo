import React from 'react';
import type { Player } from '../../services/apiService';

interface CurrentPlayerProps {
  player: Player;
  onSkip: () => void;
  disabled?: boolean;
}

const CurrentPlayer: React.FC<CurrentPlayerProps> = ({ 
  player, 
  onSkip, 
  disabled = false 
}) => {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center sticky top-8">
      <div className="mb-4">
        <div className="text-sm text-white/70 mb-2">Jugador Actual:</div>
        
        {player.photo_url && (
          <img 
            src={player.photo_url} 
            alt={player.name}
            className="w-32 h-32 md:w-40 md:h-40 rounded-2xl mx-auto object-cover shadow-2xl border border-white/20 mb-4"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
        
        <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
          {player.name}
        </h3>
      </div>
      
      <button 
        onClick={onSkip}
        disabled={disabled}
        className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-4 rounded-lg border border-white/20 hover:border-white/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ⏭️ Saltar Jugador
      </button>
    </div>
  );
};

export default CurrentPlayer;
