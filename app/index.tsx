import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';

import { theme } from '../constants/theme';
import { getProfile, getWelcomeSeen } from '../lib/storage';

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      const [profile, welcomeSeen] = await Promise.all([getProfile(), getWelcomeSeen()]);
      if (!isMounted) {
        return;
      }

      if (profile) {
        router.replace('/dashboard' as Href);
        return;
      }

      router.replace((welcomeSeen ? '/onboarding' : '/welcome') as Href);
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color={theme.colors.accent} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
});
