import QuizCard, { type QuizType } from './QuizCard';

const quizTypes: QuizType[] = [
  {
    id: 'bingo-game',
    title: 'Futbol Bingo',
    description: 'bingo',
    image: '/paqueta.png',
    estimatedTime: '1 min',
    color: 'from-red-100 to-orange-100',
    hoverColor: 'hover:from-red-600 hover:to-orange-100'
  },
  {
    id: 'nationality-quiz',
    title: 'Nacionalidad',
    description: 'de donde soy?',
    image: '/nationality.png',
    estimatedTime: '2-3 min',
    color: 'from-green-100 to-emerald-100',
    hoverColor: 'hover:from-green-600 hover:to-emerald-700'
  },
  {
    id: 'team-quiz',
    title: 'Mismo Equipo',
    description: 'mismo equipo',
    image: '/sarachi.png',
    estimatedTime: '3-4 min',
    color: 'from-blue-100 to-cyan-100',
    hoverColor: 'hover:from-blue-600 hover:to-cyan-700'
  },
  {
    id: 'age-quiz',
    title: 'Adivinaedad',
    description: 'q tan viejo soy',
    image: '/pepesand.png',
    estimatedTime: '4-5 min',
    color: 'from-purple-100 to-pink-100',
    hoverColor: 'hover:from-purple-600 hover:to-pink-700'
  },
  {
    id: 'questions',
    title: '¿?',
    description: 'conocimiento general',
    image: '/mono.png',
    estimatedTime: '5-10 min',
    color: 'from-yellow-100 to-amber-100',
    hoverColor: 'hover:from-yellow-600 hover:to-amber-700'
  }
];

const QuizGrid = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-8 mb-12">
      {quizTypes.map((quiz) => (
        <QuizCard key={quiz.id} quiz={quiz} />
      ))}
    </div>
  );
};

export default QuizGrid;
