import { SymbolView } from 'expo-symbols';

export const FOLDER_ICON_OPTIONS = [
  {
    key: 'folder',
    label: 'Folder',
    symbol: { ios: 'folder.fill', android: 'folder', web: 'folder' },
  },
  {
    key: 'inbox',
    label: 'Inbox',
    symbol: { ios: 'tray.fill', android: 'inbox', web: 'inbox' },
  },
  {
    key: 'work',
    label: 'Work',
    symbol: { ios: 'briefcase.fill', android: 'work', web: 'work' },
  },
  {
    key: 'ideas',
    label: 'Ideas',
    symbol: { ios: 'lightbulb.fill', android: 'lightbulb', web: 'lightbulb' },
  },
  {
    key: 'reading',
    label: 'Reading',
    symbol: { ios: 'book.fill', android: 'menu_book', web: 'menu_book' },
  },
  {
    key: 'favorites',
    label: 'Favorites',
    symbol: { ios: 'heart.fill', android: 'favorite', web: 'favorite' },
  },
  {
    key: 'travel',
    label: 'Travel',
    symbol: { ios: 'airplane', android: 'flight', web: 'flight' },
  },
  {
    key: 'shopping',
    label: 'Shopping',
    symbol: { ios: 'cart.fill', android: 'shopping_cart', web: 'shopping_cart' },
  },
  {
    key: 'home',
    label: 'Home',
    symbol: { ios: 'house.fill', android: 'home', web: 'home' },
  },
  {
    key: 'music',
    label: 'Music',
    symbol: { ios: 'music.note', android: 'music_note', web: 'music_note' },
  },
  {
    key: 'photos',
    label: 'Photos',
    symbol: { ios: 'photo.fill', android: 'photo', web: 'photo' },
  },
  {
    key: 'games',
    label: 'Games',
    symbol: { ios: 'gamecontroller.fill', android: 'sports_esports', web: 'sports_esports' },
  },
  {
    key: 'fitness',
    label: 'Fitness',
    symbol: { ios: 'figure.run', android: 'fitness_center', web: 'fitness_center' },
  },
  {
    key: 'food',
    label: 'Food',
    symbol: { ios: 'fork.knife', android: 'restaurant', web: 'restaurant' },
  },
  {
    key: 'study',
    label: 'Study',
    symbol: { ios: 'graduationcap.fill', android: 'school', web: 'school' },
  },
  {
    key: 'money',
    label: 'Money',
    symbol: { ios: 'dollarsign.circle.fill', android: 'payments', web: 'payments' },
  },
  {
    key: 'code',
    label: 'Code',
    symbol: { ios: 'chevron.left.forwardslash.chevron.right', android: 'code', web: 'code' },
  },
  {
    key: 'star',
    label: 'Star',
    symbol: { ios: 'star.fill', android: 'star', web: 'star' },
  },
] as const;

export type FolderIconKey = (typeof FOLDER_ICON_OPTIONS)[number]['key'];

export function getFolderIcon(icon: string | null | undefined) {
  return FOLDER_ICON_OPTIONS.find((item) => item.key === icon) ?? FOLDER_ICON_OPTIONS[0];
}

export function FolderGlyph({ icon, size = 34, color = '#111111' }: { icon: string; size?: number; color?: string }) {
  const option = getFolderIcon(icon);
  return <SymbolView name={option.symbol} size={size} tintColor={color} style={{ width: size, height: size }} />;
}
