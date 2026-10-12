import { useMemo, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/create.css';
import { readSharedDesign } from '../types/design';
import type { Design } from '../types/design';
import { saveDesign } from '../lib/firebase';

const stickerOptions = ['🌸', '💌', '✨', '🦋', '🎀', '💖', '🌷', '🧸'];
const musicOptions = [
  { name: 'No music', source: '' },
  { name: 'I knew it, I knew you', source: '/music/song1.mp3'},
  { name: 'The 1', source: '/music/song2.mp3'},
  { name: 'Panaginip', source: '/music/song3.mp3'},
  { name: 'You\'ll be in my heart', source: '/music/song4.mp3'},
  { name: 'La la lost you', source: '/music/song5.mp3' },
  { name: 'The apartment we won\'t share', source: '/music/song6.mp3' },
  { name: 'Backburner', source: '/music/song7.mp3' },
  { name: 'Totoong tayo', source: '/music/song8.mp3' },
  { name: 'I love you, im sorry', source: '/music/song9.mp3' },
  { name: 'GabI', source: '/music/song10.mp3' },
];

const fonts = [
  { label: 'Fredoka', value: "'Fredoka', sans-serif" },
  { label: 'Serif', value: "Georgia, serif" },
  { label: 'Handwritten', value: "'Patrick Hand', cursive" },
  { label: 'Clean', value: 'Arial, sans-serif' },
  { label: 'Quicksand', value: "'Quicksand', sans-serif" },
  { label: 'Lora', value: "'Lora', serif" },
  { label: 'Caveat', value: "'Caveat', cursive" },
  { label: 'Comfortaa', value: "'Comfortaa', sans-serif" },
  { label: 'Playfair Display', value: "'Playfair Display', serif" },
  { label: 'DM Sans', value: "'DM Sans', sans-serif" },
  { label: 'Raleway', value: "'Raleway', sans-serif" },
  { label: 'Pacifico', value: "'Pacifico', cursive" },
  { label: 'Libre Baskerville', value: "'Libre Baskerville', serif" },
  { label: 'Baloo 2', value: "'Baloo 2', cursive" },
];

function Create() {
  const location = useLocation();
  const [design, setDesign] = useState<Design>(() => readSharedDesign(location.search));
  const [shareLink, setShareLink] = useState('');
  const [draggedSticker, setDraggedSticker] = useState<number | null>(null);
  const [musicDuration, setMusicDuration] = useState(0);
  const musicRef = useRef<HTMLAudioElement>(null);

  const updateDesign = <K extends keyof Design>(key: K, value: Design[K]) => {
    setDesign((current) => ({ ...current, [key]: value }));
    setShareLink('');
  };

  const previewStyle = useMemo(
    () => ({
      fontFamily: design.font,
      fontSize: `${design.fontSize}px`,
      color: design.color,
      backgroundColor: design.background,
      textAlign: design.align,
    }),
    [design],
  );

  const generateLink = async () => {
    try {
      const id = await saveDesign(design);
      const linkUrl = new URL('/view', document.baseURI);
      linkUrl.searchParams.set('id', id);
      const link = linkUrl.toString();
      setShareLink(link);
      await navigator.clipboard.writeText(link);
    } catch (error) {
      setShareLink('');
      window.alert(error instanceof Error ? error.message : 'Unable to create a share link.');
    }
  };

  const addSticker = (emoji: string) => {
    setDesign((current) => ({
      ...current,
      stickers: [
        ...current.stickers,
        { id: Date.now(), emoji, left: 50, top: 50 },
      ],
    }));
    setShareLink('');
  };

  const removeSticker = (id: number) => {
    setDesign((current) => ({
      ...current,
      stickers: current.stickers.filter((sticker) => sticker.id !== id),
    }));
    setShareLink('');
  };

  const moveSticker = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const card = event.currentTarget.getBoundingClientRect();
    const left = Math.max(4, Math.min(96, ((event.clientX - card.left) / card.width) * 100));
    const top = Math.max(5, Math.min(95, ((event.clientY - card.top) / card.height) * 100));
    const paletteEmoji = event.dataTransfer.getData('text/sticker');
    const draggedId = Number(event.dataTransfer.getData('text/sticker-id'));

    setDesign((current) => {
      if (paletteEmoji) {
        return {
          ...current,
          stickers: [...current.stickers, { id: Date.now(), emoji: paletteEmoji, left, top }],
        };
      }
      if (Number.isNaN(draggedId)) return current;
      return {
        ...current,
        stickers: current.stickers.map((sticker) =>
          sticker.id === draggedId ? { ...sticker, left, top } : sticker,
        ),
      };
    });
    setDraggedSticker(null);
    setShareLink('');
  };

  return (
    <div className="create-page">
      <header className="editor-header">
        <h1>Create your message</h1>
        <button type="button" className="share-button" onClick={generateLink}>
          Generate share link
        </button>
      </header>

      <main className="editor-layout">
        <section className="design-panel" aria-label="Message design controls">
          <label htmlFor="message">Your message</label>
          <textarea
            id="message"
            placeholder={design.placeholder}
            value={design.message}
            onChange={(event) => updateDesign('message', event.target.value)}
            rows={5}
          />
          <label htmlFor="font">Font</label>
          <select id="font" value={design.font} onChange={(event) => updateDesign('font', event.target.value)}>
            {fonts.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}
          </select>
          <div className="control-row">
            <label htmlFor="font-size">Size</label>
            <output>{design.fontSize}px</output>
          </div>
          <input id="font-size" type="range" min="18" max="80" value={design.fontSize}
            onChange={(event) => updateDesign('fontSize', Number(event.target.value))} />
          <div className="control-row">
            <label htmlFor="text-color">Text color</label>
            <input id="text-color" type="color" value={design.color}
              onChange={(event) => updateDesign('color', event.target.value)} />
          </div>
          <div className="control-row">
            <label htmlFor="background-color">Background</label>
            <input id="background-color" type="color" value={design.background}
              onChange={(event) => updateDesign('background', event.target.value)} />
          </div>
          <div className="alignment-controls" aria-label="Text alignment">
            {(['left', 'center', 'right'] as const).map((alignment) => (
              <button className={design.align === alignment ? 'active' : ''} key={alignment}
                onClick={() => updateDesign('align', alignment)}>
                {alignment[0].toUpperCase() + alignment.slice(1)}
              </button>
            ))}
          </div>
          <label>Stickers</label>
          <div className="sticker-palette" aria-label="Sticker choices">
            {stickerOptions.map((emoji) => (
              <button
                type="button"
                className="sticker-choice"
                draggable
                key={emoji}
                onClick={() => addSticker(emoji)}
                onDragStart={(event) => event.dataTransfer.setData('text/sticker', emoji)}
                title={`Add ${emoji}`}
                aria-label={`Add ${emoji} sticker`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <small className="sticker-hint">Click a sticker to add it, or drag it onto your design.</small>
          {design.stickers.length > 0 && (
            <div className="added-stickers" aria-label="Added stickers">
              <span className="added-stickers-label">Added stickers</span>
              <div className="added-stickers-list">
                {design.stickers.map((sticker) => (
                  <button
                    type="button"
                    className="remove-sticker"
                    key={sticker.id}
                    onClick={() => removeSticker(sticker.id)}
                    title={`Remove ${sticker.emoji} sticker`}
                  >
                    <span aria-hidden="true">{sticker.emoji}</span>
                    <span>Remove</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <label htmlFor="music-choice">Music</label>
          <select
            id="music-choice"
            value={design.musicDataUrl}
            onChange={(event) => {
              const option = musicOptions.find((item) => item.source === event.target.value);
              setDesign((current) => ({
                ...current,
                musicDataUrl: option?.source ?? '',
                musicName: option?.name ?? '',
                musicStartTime: 0,
              }));
              setShareLink('');
            }}
          >
            {musicOptions.map((option) => (
              <option key={option.source} value={option.source}>{option.name}</option>
            ))}
          </select>
          {design.musicName && <small className="sticker-hint">Selected: {design.musicName}</small>}
          {design.musicDataUrl && (
            <>
              <audio
                ref={musicRef}
                className="editor-audio"
                controls
                src={design.musicDataUrl}
                onLoadedMetadata={(event) => setMusicDuration(event.currentTarget.duration)}
              >
                Your browser does not support audio playback.
              </audio>
              <div className="music-start-control">
                <div className="control-row">
                  <label htmlFor="music-start">Lyrics start point</label>
                  <output>{design.musicStartTime.toFixed(1)}s</output>
                </div>
                <input
                  id="music-start"
                  type="range"
                  min="0"
                  max={musicDuration || 0}
                  step="0.1"
                  value={Math.min(design.musicStartTime, musicDuration || 0)}
                  disabled={!musicDuration}
                  onChange={(event) => {
                    const startTime = Number(event.target.value);
                    updateDesign('musicStartTime', startTime);
                    if (musicRef.current) musicRef.current.currentTime = startTime;
                  }}
                />
                <small className="sticker-hint">
                  Choose where the song begins when someone opens your message.
                </small>
              </div>
            </>
          )}
        </section>

        <section className="preview-panel" aria-label="Message preview">
          <p className="preview-label">Live preview</p>
          <div
            className="message-card"
            style={previewStyle}
            onDragOver={(event) => event.preventDefault()}
            onDrop={moveSticker}
          >
            <span className="message-text">{design.message}</span>
            {design.stickers.map((sticker) => (
              <span
                className={`canvas-sticker ${draggedSticker === sticker.id ? 'dragging' : ''}`}
                draggable
                key={sticker.id}
                style={{ left: `${sticker.left}%`, top: `${sticker.top}%` }}
                onDragStart={(event) => {
                  event.dataTransfer.setData('text/sticker-id', String(sticker.id));
                  setDraggedSticker(sticker.id);
                }}
                onDragEnd={() => setDraggedSticker(null)}
              >
                {sticker.emoji}
              </span>
            ))}
          </div>
          {shareLink && (
            <div className="share-result" role="status" aria-live="polite">
              <strong>Link ready — copied to clipboard</strong>
              <input value={shareLink} readOnly aria-label="Generated share link" />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Create;