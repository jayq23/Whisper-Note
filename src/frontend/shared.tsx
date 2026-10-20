import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { readSharedDesign } from '../types/design';
import type { Design } from '../types/design';
import { getSharedDesign } from '../lib/firebase';

const TYPING_INTERVAL_MS = 140;
const floatingHearts = ['♥', '♡', '✦', '♥', '✧', '♡'];
const backgroundParticles = ['·', '✦', '·', '✧', '·', '✦', '·', '♡'];
const sparkles = ['✦', '✧', '✦', '·', '✧'];

function SharedMessage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [design, setDesign] = useState<Design>(() => readSharedDesign(location.search));
  const [loadError, setLoadError] = useState('');
  const messageId = new URLSearchParams(location.search).get('id');
  const [visibleMessage, setVisibleMessage] = useState('');
  const [isMusicStarted, setIsMusicStarted] = useState(!design.musicDataUrl);
  const [isTypingComplete, setIsTypingComplete] = useState(!design.message);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!messageId) return;

    let isCurrent = true;
    void getSharedDesign(messageId)
      .then((loadedDesign) => {
        if (!isCurrent) return;
        if (!loadedDesign) {
          setLoadError('This message could not be found.');
          return;
        }
        setDesign(loadedDesign);
        setIsMusicStarted(!loadedDesign.musicDataUrl);
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setLoadError(error instanceof Error ? error.message : 'Unable to load this message.');
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [messageId]);

  useEffect(() => {
    if (!isMusicStarted) return;
    setVisibleMessage('');
    setIsTypingComplete(false);
    let characterIndex = 0;
    const timer = window.setInterval(() => {
      characterIndex += 1;
      setVisibleMessage(design.message.slice(0, characterIndex));
      if (characterIndex >= design.message.length) {
        window.clearInterval(timer);
        setIsTypingComplete(true);
      }
    }, TYPING_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [design.message, isMusicStarted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !design.musicDataUrl || !isMusicStarted) return;

    audio.load();
    audio.currentTime = design.musicStartTime;
    void audio.play().catch(() => {
      // The recipient already interacted with the play overlay.
    });
  }, [design.musicDataUrl, design.musicStartTime, isMusicStarted]);

  const startMusic = () => {
    setIsMusicStarted(true);
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = design.musicStartTime;
      void audio.play();
    }
  };

  const messageStyle = {
    fontFamily: design.font,
    fontSize: `${design.fontSize}px`,
    color: design.color,
    backgroundColor: design.background,
    textAlign: design.align,
  } as const;

  return (
    <div className="shared-page">
      <div className="background-particles" aria-hidden="true">
        {backgroundParticles.map((particle, index) => (
          <span key={`${particle}-${index}`} style={{ '--particle-index': index } as CSSProperties}>
            {particle}
          </span>
        ))}
      </div>
      <header className="shared-header">
        <span className="shared-brand">Whisper Notes</span>
        <button
          type="button"
          className="make-one-button"
          onClick={() => navigate('/')}
          title="Create your own message"
        >
          Want to make one too?
        </button>
      </header>
      <main className="shared-content">
        {loadError && <p role="alert">{loadError}</p>}
        {!isMusicStarted && (
          <div className="music-intro" role="dialog" aria-modal="true" aria-labelledby="music-intro-title">
            <div className="music-intro-card">
              <span className="music-note" aria-hidden="true">🎵</span>
              <h1 id="music-intro-title">A little surprise for you</h1>
              <p>Press play to open your message with music.</p>
              <button className="music-intro-button" onClick={startMusic}>
                ▶ Play the music
              </button>
            </div>
          </div>
        )}
        <div className={`shared-message ${isMusicStarted ? 'message-visible' : ''} ${isMusicStarted && design.musicDataUrl ? 'music-playing' : ''}`} style={messageStyle}>
          <span className="message-text">
            {visibleMessage}
            {isMusicStarted && !isTypingComplete && <span className="typing-cursor" aria-hidden="true">|</span>}
          </span>
          {design.stickers.map((sticker) => (
            <span
              className={`canvas-sticker sticker-effect sticker-effect-${sticker.id % 3}`}
              key={sticker.id}
              style={{ left: `${sticker.left}%`, top: `${sticker.top}%` }}
            >
              {sticker.emoji}
            </span>
          ))}
          {isTypingComplete && (
            <>
              <div className="floating-hearts" aria-hidden="true">
                {floatingHearts.map((heart, index) => (
                  <span key={`${heart}-${index}`} style={{ '--heart-index': index } as CSSProperties}>
                    {heart}
                  </span>
                ))}
              </div>
              <div className="message-sparkles" aria-hidden="true">
                {sparkles.map((sparkle, index) => (
                  <span key={`${sparkle}-${index}`} style={{ '--sparkle-index': index } as CSSProperties}>
                    {sparkle}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
        {design.musicDataUrl && (
          <div className="shared-music">
            <span>🎵 {design.musicName || 'Your music'}</span>
            <audio
              ref={audioRef}
              aria-label={`Play ${design.musicName || 'message music'}`}
              controls
              loop
              preload="auto"
              src={design.musicDataUrl}
            >
              Your browser does not support audio playback.
            </audio>
          </div>
        )}
      </main>
    </div>
  );
}

export default SharedMessage;
