import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { Card } from '../components/Card';
import { colors, spacing, typography } from '../theme/theme';
import { getSocialFeed, type SocialPost } from '../api/socialFeed';

const platformEmoji: Record<SocialPost['platform'], string> = {
  facebook: '📘',
  instagram: '📸',
};

export default function SocialFeedScreen() {
  const [posts, setPosts] = useState<SocialPost[]>([]);

  useEffect(() => {
    getSocialFeed().then(setPosts);
  }, []);

  return (
    <ScreenContainer>
      <SectionHeader
        title="Social"
        subtitle="Posts pulled from the track's Facebook and Instagram accounts"
      />
      {posts.map((post) => (
        <Card key={post.id}>
          <Text style={styles.author}>
            {platformEmoji[post.platform]} {post.author}
          </Text>
          {post.imageUrl ? <Image source={{ uri: post.imageUrl }} style={styles.image} /> : null}
          <Text style={styles.caption}>{post.caption}</Text>
          <Text style={styles.timestamp}>{new Date(post.postedIso).toLocaleDateString()}</Text>
        </Card>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  author: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  image: { width: '100%', height: 220, borderRadius: 8, marginBottom: spacing.sm },
  caption: { ...typography.body, color: colors.text },
  timestamp: { ...typography.small, color: colors.textMuted, marginTop: spacing.xs },
});
