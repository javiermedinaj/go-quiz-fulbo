
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import NationalityQuiz from './pages/NationalityQuiz';
import TeamQuiz from './pages/TeamQuiz';
import AgeQuiz from './pages/AgeQuiz';
import BingoGame from './pages/BingoGame';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black">
        <Header />
        <main className="pb-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/nationality-quiz" element={<NationalityQuiz />} />
            <Route path="/team-quiz" element={<TeamQuiz />} />
            <Route path="/age-quiz" element={<AgeQuiz />} />
            <Route path="/bingo-game" element={<BingoGame />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
