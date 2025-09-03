import {FaInstagram} from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-black border-t border-white/10 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors duration-200 group"
          >
            <FaInstagram 
              size={20} 
              className="group-hover:scale-110 transition-transform duration-200" 
            />
            <span className="text-sm font-medium">Síguenos en Instagram</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
