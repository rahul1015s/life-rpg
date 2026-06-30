import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Anton_400Regular } from '@expo-google-fonts/anton';
import {
  NotoSerif_400Regular,
  NotoSerif_600SemiBold,
  NotoSerif_700Bold,
} from '@expo-google-fonts/noto-serif';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';

import { LaunchScreen } from '../components/LaunchScreen';
import { BottomNav } from '../components/ui/BottomNav';
import { theme } from '../constants/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);
SplashScreen.setOptions({
  duration: 450,
  fade: true,
});

export default function RootLayout() {
  const pathname = usePathname();
  const [showLaunch, setShowLaunch] = useState(true);
  const [loaded] = useFonts({
    Anton: Anton_400Regular,
    NotoSerif: NotoSerif_400Regular,
    NotoSerifSemiBold: NotoSerif_600SemiBold,
    NotoSerifBold: NotoSerif_700Bold,
    SpaceMono: SpaceMono_400Regular,
    SpaceMonoBold: SpaceMono_700Bold,
  });

  useEffect(() => {
    if (!loaded) {
      return;
    }

    SplashScreen.hideAsync().catch(() => undefined);
    const timer = setTimeout(() => {
      setShowLaunch(false);
    }, 1400);

    return () => clearTimeout(timer);
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  if (showLaunch) {
    return <LaunchScreen />;
  }

  const showBottomNav = pathname !== '/' && pathname !== '/onboarding';

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.stackWrap}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.background },
            animation: 'fade',
          }}
        />
      </View>
      {showBottomNav ? <BottomNav /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  stackWrap: {
    flex: 1,
  },
});
