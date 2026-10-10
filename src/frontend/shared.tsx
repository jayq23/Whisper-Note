import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { readSharedDesign } from '../types/design';

const TYPING_INTERVAL_MS = 65;

function SharedMessage() {
  const location = useLocation();
  const navigate = useNavigate();
  const design = readSharedDesign(location.search);
  const [visibleMessage, setVisibleMessage] = useState('');
  const [isMusicStarted, setIsMusicStarted] = useState(!design.musicDataUrl);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!isMusicStarted) return;
    setVisibleMessage('');
    let characterIndex = 0;
    const timer = window.setInterval(() => {
      characterIndex += 1;
      setVisibleMessage(design.message.slice(0, characterIndex));
      if (characterIndex >= design.message.length) window.clearInterval(timer);
    }, TYPING_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [design.message, isMusicStarted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !design.musicDataUrl || !isMusicStarted) return;

    audio.load();
    void audio.play().catch(() => {
      // The recipient already interacted with the play overlay.
    });
  }, [design.musicDataUrl, isMusicStarted]);

  const startMusic = () => {
    setIsMusicStarted(true);
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
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
        <div className="shared-message" style={messageStyle}>
          <span className="message-text">{visibleMessage}</span>
          {design.stickers.map((sticker) => (
            <span
              className="canvas-sticker"
              key={sticker.id}
              style={{ left: `${sticker.left}%`, top: `${sticker.top}%` }}
            >
              {sticker.emoji}
            </span>
          ))}
        </div>
        {design.musicDataUrl && (
          <div className="shared-music">
            <span>🎵 {design.musicName || 'Your music'}</span>
            <audio ref={audioRef} controls loop preload="auto" src={design.musicDataUrl}>
              Your browser does not support audio playback.
            </audio>
          </div>
        )}
      </main>
    </div>
  );
}

export default SharedMessage;
