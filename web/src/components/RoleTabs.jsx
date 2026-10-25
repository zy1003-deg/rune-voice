const ROLES = [
  ['all', '全部'],
  ['fighter', '战士'],
  ['mage', '法师'],
  ['assassin', '刺客'],
  ['marksman', '射手'],
  ['tank', '坦克'],
  ['support', '辅助'],
]
export default function RoleTabs({ activeRole, onRoleChange, champions }) {
  return (
    <div className="role-tabs" role="group" aria-label="按职业筛选英雄">
      {ROLES.map(([key, label]) => (
        <button
          key={key}
          aria-pressed={activeRole === key}
          className={activeRole === key ? 'active' : ''}
          onClick={() => onRoleChange(key)}
        >
          {label}
          <span>
            {key === 'all'
              ? champions.length
              : champions.filter((c) => c.role === key).length}
          </span>
        </button>
      ))}
    </div>
  )
}
export const filterByRole = (champions, role) =>
  role === 'all' ? champions : champions.filter((c) => c.role === role)
