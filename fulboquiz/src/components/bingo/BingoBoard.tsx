import React from 'react';

interface BingoCategory {
  id: string;
  title: string;
  filled: boolean;
  playerName?: string;
}

interface BingoBoardProps {
  categories: BingoCategory[];
  onCategoryClick: (categoryId: string) => void;
  disabled?: boolean;
}

const BingoBoard: React.FC<BingoBoardProps> = ({ 
  categories, 
  onCategoryClick, 
  disabled = false 
}) => {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
      <h3 className="text-xl font-bold text-white mb-6 text-center">
        Tablero de Bingo
      </h3>
      <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryClick(category.id)}
            disabled={category.filled || disabled}
            className={`p-4 rounded-xl border-2 transition-all duration-200 text-center min-h-[100px] flex flex-col justify-center ${
              category.filled
                ? 'bg-green-600 border-green-500 text-white cursor-default'
                : 'bg-white/5 hover:bg-white/10 border-white/20 hover:border-white/30 text-white hover:scale-105 cursor-pointer'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="font-semibold text-sm mb-1">
              {category.title}
            </div>
            {category.filled && category.playerName && (
              <div className="text-xs text-green-200 mt-1">
                {category.playerName}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BingoBoard;
