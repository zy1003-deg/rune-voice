import Icon from './Icon'
export default function Navbar({
  search,
  onSearchChange,
  theme,
  onToggleTheme,
  view,
  onNavigate,
  selectedChampion,
}) {
  return (
    <header className="site-header">
      <div className="nav-inner">
        <button
          className="brand"
          onClick={() => onNavigate('discover')}
          aria-label="英雄联盟语音首页"
        >
          <svg
            width="36"
            height="40"
            viewBox="0 0 36 40"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M18 2 32 10v20l-14 8L4 30V10Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="m18 8 8 12-8 12-8-12Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path d="M18 0v40" stroke="currentColor" />
          </svg>
          <span>
            <strong>英雄联盟语音</strong>
            <small>搜索台词 · 在线播放</small>
          </span>
        </button>
        <nav className="primary-nav" aria-label="主导航">
          {[
            ['discover', '发现'],
            ['heroes', '英雄'],
            ['favorites', '我的收藏'],
          ].map(([key, label]) => (
            <button
              key={key}
              className={
                (selectedChampion ? key === 'heroes' : view === key)
                  ? 'active'
                  : ''
              }
              aria-current={
                (selectedChampion ? key === 'heroes' : view === key)
                  ? 'page'
                  : undefined
              }
              onClick={() => onNavigate(key)}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="nav-tools">
          <label className="search-field">
            <Icon name="search" size={18} />
            <input
              aria-label={
                selectedChampion
                  ? '搜索当前英雄台词'
                  : view === 'favorites'
                    ? '搜索收藏台词'
                    : '搜索英雄、台词'
              }
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={
                selectedChampion
                  ? '搜索当前英雄台词…'
                  : view === 'favorites'
                    ? '搜索收藏台词…'
                    : '搜索英雄、台词…'
              }
            />
            {search && (
              <button
                className="icon-button"
                aria-label="清空搜索"
                onClick={() => onSearchChange('')}
              >
                <Icon name="close" size={16} />
              </button>
            )}
          </label>
          <button
            className="icon-button theme-toggle"
            aria-label={theme === 'dark' ? '切换到浅色主题' : '切换到暗色主题'}
            onClick={onToggleTheme}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
        </div>
      </div>
    </header>
  )
}
