import { Link } from 'react-router-dom';

const Header = () => {
//   const location = useLocation();

// //   const isActive = (path: string) => {
// //     return location.pathname === path;
// //   };

  return (
    <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">⚽</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Testt prod
            </span>
          </Link>

          {/* <nav className="hidden md:flex space-x-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActive('/')
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
            >
              Inicio
            </Link>
            <Link
              to="/nationality-quiz"
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActive('/nationality-quiz')
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
            >
              Nacionalidad
            </Link>
            <Link
              to="/team-quiz"
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActive('/team-quiz')
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
            >
              Mismo Equipo
            </Link>
            <Link
              to="/age-quiz"
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActive('/age-quiz')
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
            >
              Adivina Edad
            </Link>
          </nav>
          <div className="md:hidden">
            <button className="text-gray-300 hover:text-white p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div> */}
        </div>
      </div>
    </header>
  );
};

export default Header;
