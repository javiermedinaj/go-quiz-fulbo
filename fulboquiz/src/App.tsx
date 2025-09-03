
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import {Header} from './components/Header';
import Home from './pages/Home';
import NationalityQuiz from './pages/NationalityQuiz';
import TeamQuiz from './pages/TeamQuiz';
import AgeQuiz from './pages/AgeQuiz';
import BingoGame from './pages/BingoGame';
import Questions from './pages/Questions';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <div>
        <Header /> 
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/nationality-quiz" element={<NationalityQuiz />} />
            <Route path="/team-quiz" element={<TeamQuiz />} />
            <Route path="/age-quiz" element={<AgeQuiz />} />
            <Route path="/bingo-game" element={<BingoGame />} />
            <Route path="/questions" element={<Questions />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
