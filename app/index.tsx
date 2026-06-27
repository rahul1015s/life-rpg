import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';

import { theme } from '../constants/theme';
import { getProfile } from '../lib/storage';

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      const profile = await getProfile();
      if (!isMounted) {
        return;
      }

      router.replace((profile ? '/dashboard' : '/onboarding') as Href);
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
