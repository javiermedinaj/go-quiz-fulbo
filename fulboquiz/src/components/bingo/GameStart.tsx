import React from 'react';

interface GameStartProps {
  onStart: () => void;
}

const GameStart: React.FC<GameStartProps> = ({ onStart }) => {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center max-w-2xl mx-auto">
      <div className="text-6xl mb-6">🎯</div>
      <h2 className="text-3xl font-bold text-white mb-4">¡Futbol Bingo!</h2>
      <p className="text-white/70 mb-6 text-lg">
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
      
      <button 
        onClick={onStart} 
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 text-xl hover:scale-105"
      >
        🚀 Comenzar Juego
      </button>
    </div>
  );
};

export default GameStart;
