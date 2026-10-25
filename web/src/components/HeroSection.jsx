import { useState } from 'react'
import Icon from './Icon'
import { buildAvatarUrl, buildSplashUrl } from '../utils/audioUrl'
import { quoteId } from '../utils/quotes'

function FeaturedArt({ quote }) {
  const [fallback, setFallback] = useState(false)
  return (
    <img
      className={`featured-art ${fallback ? 'avatar-art' : ''}`}
      src={
        fallback
          ? buildAvatarUrl(quote.championAlias)
          : buildSplashUrl(quote.championAlias)
      }
      alt=""
      onError={(e) => {
        if (!fallback) setFallback(true)
        else e.currentTarget.style.visibility = 'hidden'
      }}
    />
  )
}

function FeaturedCard({
  quote,
  slot,
  quotes,
  onPlay,
  onShuffle,
  playingId,
  isPlaying,
  canShuffle,
}) {
  const main = slot === 0
  const active = playingId === quoteId(quote) && isPlaying
  return (
    <article
      className={`featured-card ${main ? 'featured-main' : 'featured-small'}`}
      aria-label={`推荐台词${slot + 1}`}
      data-quote-id={quoteId(quote)}
    >
      <FeaturedArt key={quote.championAlias} quote={quote} />
      <div className="featured-shade" />
      <div className="featured-content">
        {main && <span className="feature-kicker">精选台词</span>}
        <blockquote
          className={main && quote.text.length > 40 ? 'long-quote' : ''}
        >
          {quote.text}
        </blockquote>
        {main && <span className="gold-rule" />}
        <p className="featured-credit">
          {quote.championName}
          <span> · {quote.skin || '默认皮肤'}</span>
        </p>
        <div className="featured-actions">
          {main ? (
            <button
              className="featured-play"
              onClick={() => onPlay(quote, quotes)}
            >
              <span>
                <Icon
                  name={active ? 'pause' : 'play'}
                  filled={!active}
                  size={24}
                />
              </span>
              {active ? '暂停播放' : '播放台词'}
            </button>
          ) : (
            <button
              className="round-play"
              onClick={() => onPlay(quote, quotes)}
              aria-label={`${active ? '暂停' : '播放'}：${quote.text}`}
            >
              <Icon
                name={active ? 'pause' : 'play'}
                filled={!active}
                size={18}
              />
            </button>
          )}
          <button
            className="shuffle-button"
            disabled={!canShuffle}
            onClick={() => onShuffle(slot)}
            aria-label={`更换第${slot + 1}条推荐`}
          >
            <Icon name="shuffle" size={17} />
            换一条
          </button>
          {main && (
            <div
              className={`decorative-wave ${active ? 'active' : ''}`}
              aria-hidden="true"
            >
              {[
                8, 18, 11, 25, 34, 20, 13, 26, 18, 11, 22, 30, 17, 10, 21, 14,
                8,
              ].map((h, i) => (
                <i
                  key={i}
                  style={{ height: h, animationDelay: `${i * 70}ms` }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

export default function HeroSection({
  quotes,
  indices,
  onShuffle,
  onPlay,
  playingId,
  isPlaying,
  loading,
  error,
  onRetry,
  championCount,
  quoteCount,
}) {
  const visible = indices.map((index) => quotes[index]).filter(Boolean)
  const uniqueCount = new Set(quotes.map(quoteId)).size
  const renderCard = (quote, slot) => (
    <FeaturedCard
      key={slot}
      quote={quote}
      slot={slot}
      quotes={quotes}
      onPlay={onPlay}
      onShuffle={onShuffle}
      playingId={playingId}
      isPlaying={isPlaying}
      canShuffle={uniqueCount > visible.length}
    />
  )
  return (
    <section className="discovery-section" aria-labelledby="discovery-title">
      <div className="discovery-heading">
        <div>
          <h1 id="discovery-title">推荐台词</h1>
        </div>
        <div className="discovery-tools">
          <span className="archive-count">
            {championCount} 位英雄 <span>/</span> {quoteCount.toLocaleString()}{' '}
            条语音
          </span>
          <button
            className="outline-button"
            onClick={() => onShuffle()}
            disabled={uniqueCount < 2}
            aria-label="更换全部推荐"
          >
            <Icon name="shuffle" size={16} />
            换一组
          </button>
        </div>
      </div>
      {visible.length ? (
        <div className="featured-layout">
          {renderCard(visible[0], 0)}
          {visible.length > 1 && (
            <div className="featured-companions">
              {visible
                .slice(1)
                .map((quote, index) => renderCard(quote, index + 1))}
            </div>
          )}
        </div>
      ) : (
        <div className="featured-placeholder" role="status">
          {loading ? (
            '正在加载推荐台词…'
          ) : (
            <>
              <p>{error || '暂时没有推荐台词，可以从下方选择英雄试听。'}</p>
              {error && (
                <button className="outline-button" onClick={onRetry}>
                  重新加载
                </button>
              )}
            </>
          )}
        </div>
      )}
    </section>
  )
}
