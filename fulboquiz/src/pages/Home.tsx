import { HeroSection, QuizGrid } from '../components/home';

const Home = () => {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <HeroSection />
        <QuizGrid />
      </div>
    </div>
  );
};

export default Home;
