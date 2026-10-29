export function readableTextColor(backgroundColor: string) {
  const hex = backgroundColor.trim().replace(/^#/, '');
  const normalized = hex.length === 3 ? hex.split('').map((character) => character.repeat(2)).join('') : hex;
  if (!/^[\da-f]{6}$/i.test(normalized)) return '#111111';

  const red = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const green = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(normalized.slice(4, 6), 16) / 255;
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;

  return luminance < 0.42 ? '#FFFDF5' : '#111111';
}
