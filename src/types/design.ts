export type Sticker = {
  id: number;
  emoji: string;
  left: number;
  top: number;
};

export type Design = {
  message: string;
  font: string;
  fontSize: number;
  color: string;
  background: string;
  align: 'left' | 'center' | 'right';
  stickers: Sticker[];
  musicDataUrl: string;
  musicName: string;
  musicStartTime: number;
  placeholder: string;
};

export const defaultDesign: Design = {
  message: '',
  font: "'Fredoka', sans-serif",
  fontSize: 42,
  color: '#702951',
  background: '#fff7fb',
  align: 'center',
  stickers: [],
  musicDataUrl: '',
  musicName: '',
  musicStartTime: 0,
  placeholder: 'Write your message here...',
};

export function readSharedDesign(search: string): Design {
  const encoded = new URLSearchParams(search).get('design');
  if (!encoded) return defaultDesign;

  try {
    const parsed = JSON.parse(encoded) as Partial<Design>;
    return { ...defaultDesign, ...parsed };
  } catch {
    try {
      const parsed = JSON.parse(decodeURIComponent(encoded)) as Partial<Design>;
      return { ...defaultDesign, ...parsed };
    } catch {
      return defaultDesign;
    }
  }
}
