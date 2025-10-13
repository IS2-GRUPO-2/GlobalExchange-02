export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-zinc-900 text-gray-400 py-4 mt-auto border-t border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center text-sm">
          <div className="mb-2 md:mb-0">
            <span className="text-white font-semibold">Global Exchange PY</span>
            <span className="mx-2">|</span>
            <span>© {currentYear} Studen Proyect</span>
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">
              Términos
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Privacidad
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Contacto
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
