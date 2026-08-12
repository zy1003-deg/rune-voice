import { motion } from 'framer-motion'

export default function HeroSection({ onSurprise, championCount, quoteCount }) {
  return (
    <section className="relative pt-24 pb-8 text-center overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-16 left-1/4 w-64 h-64 opacity-[0.03]">
          <svg viewBox="0 0 100 100" fill="none">
            <path d="M50 5L93.3 27.5V72.5L50 95L6.7 72.5V27.5L50 5Z"
              stroke="#C8AA6E" strokeWidth="0.5" />
          </svg>
        </div>
        <div className="absolute top-24 right-1/4 w-48 h-48 opacity-[0.04]">
          <svg viewBox="0 0 100 100" fill="none">
            <path d="M50 5L93.3 27.5V72.5L50 95L6.7 72.5V27.5L50 5Z"
              stroke="#0AC8B9" strokeWidth="0.5" />
          </svg>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Subtitle */}
        <p className="text-[10px] tracking-[0.3em] uppercase text-hex-cyan mb-3 glow-cyan-text">
          League of Legends Voice Archives
        </p>

        {/* Main title */}
        <h2 className="text-2xl md:text-4xl font-bold text-hex-gold-light mb-2 glow-gold-text font-display">
          符文之声
        </h2>


        {/* Stats */}
        <div className="flex items-center justify-center gap-6 mb-6">
          {championCount > 0 && (
            <div className="stat-badge">
              <svg className="w-3.5 h-3.5 text-hex-gold/60" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              <span className="text-hex-text">{championCount}</span> 位英雄
            </div>
          )}
          {quoteCount > 0 && (
            <div className="stat-badge">
              <svg className="w-3.5 h-3.5 text-hex-cyan/60" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
              </svg>
              <span className="text-hex-text">{quoteCount.toLocaleString()}</span> 条语音
            </div>
          )}
        </div>

        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-hex-gold/30" />
          <div className="w-1.5 h-1.5 rotate-45 bg-hex-gold/40" />
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-hex-gold/30" />
        </div>

        {/* Surprise Me Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={onSurprise}
          className="hextech-btn px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest
            inline-flex items-center gap-2 cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
          </svg>
          随机一条·经典台词
        </motion.button>
      </motion.div>
    </section>
  )
}
