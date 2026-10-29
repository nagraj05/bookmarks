import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { SOURCE_APPS, type SourceKey } from '@/lib/bookmarks';

const BRAND_ICONS: Partial<Record<SourceKey, number>> = {
  facebook: require('../../assets/images/source-icons/facebook.svg'),
  instagram: require('../../assets/images/source-icons/instagram.svg'),
  youtube: require('../../assets/images/source-icons/youtube.svg'),
  reddit: require('../../assets/images/source-icons/reddit.svg'),
  spotify: require('../../assets/images/source-icons/spotify.svg'),
  x: require('../../assets/images/source-icons/x.svg'),
  substack: require('../../assets/images/source-icons/substack.svg'),
  tumblr: require('../../assets/images/source-icons/tumblr.svg'),
  linkedin: require('../../assets/images/source-icons/linkedin.svg'),
  threads: require('../../assets/images/source-icons/threads.svg'),
  tiktok: require('../../assets/images/source-icons/tiktok.svg'),
  pinterest: require('../../assets/images/source-icons/pinterest.svg'),
};

export function SourceIcon({ sourceKey, size = 17 }: { sourceKey: SourceKey; size?: number }) {
  const source = SOURCE_APPS[sourceKey] ?? SOURCE_APPS.other;
  const icon = BRAND_ICONS[sourceKey];

  if (!icon) {
    return (
      <View
        accessibilityLabel={`${source.label} icon`}
        style={[
          styles.dot,
          { backgroundColor: source.color, width: size, height: size, borderRadius: Math.max(4, size * 0.22) },
        ]}
      />
    );
  }
  return (
    <Image
      source={icon}
      style={{ width: size, height: size, borderRadius: Math.max(5, size * 0.22) }}
      contentFit="contain"
      accessibilityLabel={`${source.label} icon`}
    />
  );
}

const styles = StyleSheet.create({
  dot: { width: 8, height: 8, borderRadius: 4 },
});
