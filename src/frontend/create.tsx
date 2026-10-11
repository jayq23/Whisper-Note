import { useMemo, useState } from 'react';
import type { DragEvent } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/create.css';
import { readSharedDesign } from '../types/design';
import type { Design } from '../types/design';

const stickerOptions = ['🌸', '💌', '✨', '🦋', '🎀', '💖', '🌷', '🧸'];
const musicOptions = [
  { name: 'No music', source: '' },
  { name: 'I knew it, I knew you', source: '/music/song1.mp3'},
];

const fonts = [
  { label: 'Fredoka', value: "'Fredoka', sans-serif" },
  { label: 'Serif', value: "Georgia, serif" },
  { label: 'Handwritten', value: "'Patrick Hand', cursive" },
  { label: 'Clean', value: 'Arial, sans-serif' },
];

function Create() {
  const location = useLocation();
  const [design, setDesign] = useState<Design>(() => readSharedDesign(location.search));
  const [shareLink, setShareLink] = useState('');
  const [draggedSticker, setDraggedSticker] = useState<number | null>(null);

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
    const linkUrl = new URL('/view', document.baseURI);
    linkUrl.searchParams.set('design', JSON.stringify(design));
    const link = linkUrl.toString();
    setShareLink(link);
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // The link remains visible when clipboard access is unavailable.
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
            <audio className="editor-audio" controls src={design.musicDataUrl}>
              Your browser does not support audio playback.
            </audio>
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