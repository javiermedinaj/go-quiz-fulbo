import { Link } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';

export interface QuizType {
  id: string;
  title: string;
  description: string;
  image: string;
  estimatedTime: string;
  color: string;
  hoverColor: string;
}

interface QuizCardProps {
  quiz: QuizType;
}


const QuizCard = ({ quiz }: QuizCardProps) => {
  return (
    <Link to={`/${quiz.id}`} className="group block">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 h-full hover:bg-white/10 hover:border-white/20 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1">
        <div className="relative overflow-hidden rounded-lg mb-6">
          <div className={`w-full h-42 bg-gradient-to-br ${quiz.color} transition-all duration-300 group-hover:scale-105`}>
            <img 
              src={quiz.image} 
              alt={quiz.title}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-start">
            <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors duration-200">
              {quiz.title}
            </h3>
          </div>
          
          <p className="text-white/70 text-sm leading-relaxed">
            {quiz.description}
          </p>
          
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center text-white/50 text-sm">
              <Clock size={16} className="mr-1" />
              {quiz.estimatedTime}
            </div>
            <div className="text-blue-400 group-hover:text-blue-300 transition-colors duration-200">
              <ArrowRight size={20} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default QuizCard;
