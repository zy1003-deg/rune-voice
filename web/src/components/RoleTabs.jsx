import { useMemo } from 'react'
import { motion } from 'framer-motion'

const ROLES = [
  { key: 'all', label: '全部', icon: '🏠' },
  { key: 'assassin', label: '刺客', icon: '🗡️' },
  { key: 'fighter', label: '战士', icon: '⚔️' },
  { key: 'mage', label: '法师', icon: '🔮' },
  { key: 'marksman', label: '射手', icon: '🏹' },
  { key: 'support', label: '辅助', icon: '🛡️' },
  { key: 'tank', label: '坦克', icon: '🪨' },
]

export default function RoleTabs({ activeRole, onRoleChange, champions }) {
  // Count champions per role from data
  const roleCounts = useMemo(() => {
    const counts = { all: champions?.length || 0 }
    if (!champions) return counts
    champions.forEach((c) => {
      const role = c.role || 'unknown'
      counts[role] = (counts[role] || 0) + 1
    })
    return counts
  }, [champions])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="flex justify-center mb-8"
    >
      <div
        className="inline-flex items-center gap-1 p-1 rounded-lg
          bg-hex-navy/50 backdrop-blur-sm border border-hex-gold/10
          overflow-x-auto max-w-full webkit-scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {ROLES.map((role) => (
          <button
            key={role.key}
            onClick={() => onRoleChange(role.key)}
            className={`
              relative px-3 py-2 rounded-md text-xs font-medium
              transition-all duration-300 cursor-pointer whitespace-nowrap
              flex items-center gap-1.5
              ${activeRole === role.key
                ? 'text-hex-gold-light'
                : 'text-hex-text-dim hover:text-hex-text'
              }
            `}
          >
            {activeRole === role.key && (
              <motion.div
                layoutId="roleTabIndicator"
                className="absolute inset-0 rounded-md
                  bg-hex-panel/70 border border-hex-gold/20
                  shadow-[0_0_10px_rgba(200,170,110,0.1)]"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 text-xs">{role.icon}</span>
            <span className="relative z-10">{role.label}</span>
            {roleCounts[role.key] > 0 && (
              <span className="relative z-10 text-[9px] text-hex-text-dim/50">
                {roleCounts[role.key]}
              </span>
            )}
          </button>
        ))}
      </div>
    </motion.div>
  )
}

// Filter champions by role — now data-driven
export function filterByRole(champions, role) {
  if (role === 'all') return champions
  return champions.filter((c) => c.role === role)
}
