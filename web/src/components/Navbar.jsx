import { motion } from 'framer-motion'

export default function Navbar({ search, onSearchChange, theme, onToggleTheme }) {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50
        bg-hex-dark/80 backdrop-blur-md
        border-b border-hex-gold/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <HextechLogo />
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-hex-gold-light tracking-wider uppercase leading-tight">
              Rune Voice
            </h1>
            <p className="text-[9px] text-hex-text-dim tracking-[0.15em] uppercase">
              符文之声
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-hex-text-dim flex-shrink-0"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="搜索英雄、台词..."
              className="w-full pl-10 pr-4 py-2 rounded-lg text-sm
                bg-hex-navy/60 border border-hex-gold/10
                text-hex-text placeholder-hex-text-dim/50
                outline-none transition-all duration-300
                focus:border-hex-gold/40 focus:shadow-[0_0_15px_rgba(200,170,110,0.15)]"
            />
            {search && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-hex-text-dim hover:text-hex-gold transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? '切换到浅色主题' : '切换到暗色主题'}
            title={theme === 'dark' ? '浅色主题' : '暗色主题'}
            className="theme-toggle"
          >
            {theme === 'dark' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.36-6.36l-.71.71M6.34 17.66l-.71.71m12.02 0l-.71-.71M6.34 6.34l-.71-.71M12 7a5 5 0 100 10 5 5 0 000-10z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          <span className="hidden md:inline text-[10px] text-hex-text-dim tracking-wider uppercase">
            Runeterra
          </span>
          <div className="w-2 h-2 rounded-full bg-hex-cyan animate-pulse" />
        </div>
      </div>
    </motion.nav>
  )
}

function HextechLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
      <path d="M18 2L32.39 10V26L18 34L3.61 26V10L18 2Z"
        stroke="#C8AA6E" strokeWidth="1.5" fill="none" opacity="0.7" />
      <path d="M18 8L27.12 13.25V23.75L18 29L8.88 23.75V13.25L18 8Z"
        stroke="#0AC8B9" strokeWidth="1" fill="none" opacity="0.5" />
      <path d="M18 12L23 18L18 24L13 18Z" fill="url(#hexCoreGrad)" opacity="0.8" />
      <line x1="18" y1="2" x2="18" y2="8" stroke="#C8AA6E" strokeWidth="0.8" opacity="0.4" />
      <line x1="18" y1="29" x2="18" y2="34" stroke="#C8AA6E" strokeWidth="0.8" opacity="0.4" />
      <defs>
        <linearGradient id="hexCoreGrad" x1="13" y1="12" x2="23" y2="24">
          <stop offset="0%" stopColor="#0AC8B9" />
          <stop offset="100%" stopColor="#C8AA6E" />
        </linearGradient>
      </defs>
    </svg>
  )
}
