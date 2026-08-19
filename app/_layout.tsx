import { Stack, usePathname, useRouter, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useFonts } from 'expo-font';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
// Per-face subpath imports, not package-root imports: the package root is a barrel that
// require()s every weight in the family, and Metro does not tree-shake asset requires --
// so importing from the root bundles all 36 faces instead of the 11 actually used.
import { Anton_400Regular } from '@expo-google-fonts/anton/400Regular';
import { Cinzel_600SemiBold } from '@expo-google-fonts/cinzel/600SemiBold';
import { Cinzel_700Bold } from '@expo-google-fonts/cinzel/700Bold';
import { Manrope_400Regular } from '@expo-google-fonts/manrope/400Regular';
import { Manrope_600SemiBold } from '@expo-google-fonts/manrope/600SemiBold';
import { Manrope_700Bold } from '@expo-google-fonts/manrope/700Bold';
import { NotoSerif_400Regular } from '@expo-google-fonts/noto-serif/400Regular';
import { NotoSerif_600SemiBold } from '@expo-google-fonts/noto-serif/600SemiBold';
import { NotoSerif_700Bold } from '@expo-google-fonts/noto-serif/700Bold';
import { SpaceMono_400Regular } from '@expo-google-fonts/space-mono/400Regular';
import { SpaceMono_700Bold } from '@expo-google-fonts/space-mono/700Bold';

import { LaunchScreen } from '../components/LaunchScreen';
import { BottomNav } from '../components/ui/BottomNav';
import { theme } from '../constants/theme';
import { reminderRoutes } from '../lib/notifications/scheduleQuestReminders';

SplashScreen.preventAutoHideAsync().catch(() => undefined);
SplashScreen.setOptions({
  duration: 450,
  fade: true,
});

function routeForNotificationResponse(response: Notifications.NotificationResponse): Href | null {
  const reminderId = response.notification.request.content.data?.reminderId;
  if (typeof reminderId !== 'string' || !(reminderId in reminderRoutes)) {
    return null;
  }

  return reminderRoutes[reminderId as keyof typeof reminderRoutes] as Href;
}

export default function RootLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const [showLaunch, setShowLaunch] = useState(true);
  const [loaded] = useFonts({
    Anton: Anton_400Regular,
    NotoSerif: NotoSerif_400Regular,
    NotoSerifSemiBold: NotoSerif_600SemiBold,
    NotoSerifBold: NotoSerif_700Bold,
    SpaceMono: SpaceMono_400Regular,
    SpaceMonoBold: SpaceMono_700Bold,
    Cinzel: Cinzel_600SemiBold,
    CinzelBold: Cinzel_700Bold,
    Manrope: Manrope_400Regular,
    ManropeSemiBold: Manrope_600SemiBold,
    ManropeBold: Manrope_700Bold,
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

  useEffect(() => {
    // Cold start: app was launched by tapping a notification.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) {
        return;
      }
      const route = routeForNotificationResponse(response);
      if (route) {
        router.push(route);
      }
    });

    // Warm/background: app was already running when the notification was tapped.
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const route = routeForNotificationResponse(response);
      if (route) {
        router.push(route);
      }
    });

    return () => subscription.remove();
  }, [router]);

  if (!loaded) {
    return null;
  }

  if (showLaunch) {
    return <LaunchScreen />;
  }

  const showBottomNav = pathname !== '/' && pathname !== '/welcome' && pathname !== '/onboarding';

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
