const HeroSection = () => {
  return (
    <div className="text-center mb-16">
      <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-8">
        <span className="text-blue-400 text-sm font-medium">⚡ Nuevo</span>
        <span className="text-white/70 text-sm">Futbol Bingo disponible</span>
      </div>
      
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white">
        Futbol Quiz
      </h1>
      
      <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8 leading-relaxed">
        Pon a prueba tus conocimientos de fútbol con nuestros emocionantes quizzes. 
        Desde nacionalidades hasta equipos, desafía tu memoria futbolística.
      </p>
      
      <div className="flex flex-wrap justify-center gap-6 text-sm text-white/50">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <span>5 Ligas Principales</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          <span>Datos Actualizados</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
          <span>Múltiples Formatos</span>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
