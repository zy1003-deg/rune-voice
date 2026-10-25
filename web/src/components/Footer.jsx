export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="h-px w-12 bg-hex-gold/20" />
          <div className="w-1.5 h-1.5 rotate-45 bg-hex-gold/30" />
          <div className="h-px w-12 bg-hex-gold/20" />
        </div>
        <p className="text-sm text-hex-text mb-3">英雄联盟语音</p>

        {/* Riot Games official Third Party / Fan Project boilerplate */}
        <p className="text-xs leading-relaxed max-w-3xl mx-auto text-hex-text-dim">
          Rune Voice isn't endorsed by Riot Games and doesn't reflect the views
          or opinions of Riot Games or anyone officially involved in producing
          or managing Riot Games properties.
        </p>
        <p className="text-xs leading-relaxed max-w-3xl mx-auto mt-2 text-hex-text-dim">
          Riot Games and all associated properties are trademarks or registered
          trademarks of Riot Games, Inc.
        </p>

        {/* Project's own License note (MIT scope clarification) */}
        <p className="text-xs leading-relaxed max-w-3xl mx-auto mt-4 text-hex-text-dim/90">
          The MIT License in this repository applies only to the project's
          original source code and project-authored materials. Riot-owned
          assets, audio, images, trademarks, transcripts, and other third-party
          content are not licensed under MIT.
        </p>

        <p className="text-xs mt-4 text-hex-text-dim/80">
          Source code:{' '}
          <a
            href="https://github.com/zy1003-deg/rune-voice"
            className="underline hover:text-hex-gold"
          >
            MIT License
          </a>{' '}
          &middot;{' '}
          <a href="/NOTICE.html" className="underline hover:text-hex-gold">
            NOTICE
          </a>{' '}
          &middot; Operator-supplied data: subject to that operator's own rights
          and licenses.
        </p>
      </div>
    </footer>
  )
}
