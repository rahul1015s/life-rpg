import { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Image, type ImageProps } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type Href, useRouter } from 'expo-router';

import { ChronicleButton } from '../components/chronicle/ChronicleButton';
import { setWelcomeSeen } from '../lib/storage';
import {
  chronicleColors,
  chronicleFontFamily,
  chronicleRadius,
  chronicleSpacing,
  chronicleType,
} from '../theme/chronicle';

type WelcomeSlide = {
  key: string;
  image: ImageProps['source'];
  headline: string;
  body: string;
};

const slides: WelcomeSlide[] = [
  {
    key: 'begin',
    image: require('../assets/images/onboarding/onboarding-01-begin.webp'),
    headline: 'Begin the Chronicle',
    body: 'Every day writes a page. Start tracking yours.',
  },
  {
    key: 'stats',
    image: require('../assets/images/onboarding/onboarding-02-stats.webp'),
    headline: 'Track Your Stats',
    body: 'Discipline, habits, growth — logged as stats, not guilt.',
  },
  {
    key: 'hardmode',
    image: require('../assets/images/onboarding/onboarding-03-hardmode.webp'),
    headline: 'Face Hard Mode',
    body: "Skip a quest, take the debuff. The System doesn't forgive — but it's fair.",
  },
  {
    key: 'rewards',
    image: require('../assets/images/onboarding/onboarding-04-rewards.webp'),
    headline: 'Claim Your Rewards',
    body: 'Complete quests. Level up. Watch the Chronicle grow with you.',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);

  const isLast = index === slides.length - 1;

  function handleMomentumEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    setIndex(Math.max(0, Math.min(next, slides.length - 1)));
  }

  function handleFooterLayout(event: LayoutChangeEvent) {
    setFooterHeight(event.nativeEvent.layout.height);
  }

  async function goToProfileSetup() {
    // Persist before navigating so an abandoned profile form doesn't replay the carousel.
    await setWelcomeSeen(true).catch(() => undefined);
    router.replace('/onboarding' as Href);
  }

  function handleNext() {
    if (isLast) {
      goToProfileSetup();
      return;
    }

    const next = index + 1;
    scrollRef.current?.scrollTo({ x: next * width, animated: true });
    setIndex(next);
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        scrollEventThrottle={16}>
        {slides.map((slide) => (
          <View key={slide.key} style={[styles.slide, { width }]}>
            <Image
              source={slide.image}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              priority="high"
              transition={180}
            />
            <LinearGradient
              colors={['rgba(18, 20, 28, 0.75)', 'transparent']}
              locations={[0, 0.28]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <LinearGradient
              colors={['transparent', 'rgba(18, 20, 28, 0.9)', chronicleColors.bgBase]}
              locations={[0.42, 0.68, 0.95]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View style={[styles.copy, { paddingBottom: footerHeight + chronicleSpacing.lg }]}>
              <Text style={styles.headline}>{slide.headline}</Text>
              <Text style={styles.body}>{slide.body}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <Pressable
        onPress={goToProfileSetup}
        hitSlop={chronicleSpacing.md}
        style={[styles.skip, { top: insets.top + chronicleSpacing.sm }]}>
        <Text style={styles.skipLabel}>Skip</Text>
      </Pressable>

      <View
        onLayout={handleFooterLayout}
        style={[styles.footer, { paddingBottom: insets.bottom + chronicleSpacing.xl }]}>
        <View style={styles.dots}>
          {slides.map((slide, dotIndex) => (
            <View
              key={slide.key}
              style={[styles.dot, dotIndex === index ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>
        <ChronicleButton label={isLast ? 'Get Started' : 'Next'} onPress={handleNext} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: chronicleColors.bgBase,
  },
  slide: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  copy: {
    paddingHorizontal: chronicleSpacing.xl,
    gap: chronicleSpacing.md,
  },
  headline: {
    color: chronicleColors.accentGold,
    fontFamily: chronicleFontFamily.display,
    fontSize: chronicleType.xl,
    lineHeight: 36,
  },
  body: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.body,
    fontSize: chronicleType.md,
    lineHeight: 24,
  },
  skip: {
    position: 'absolute',
    right: chronicleSpacing.lg,
    paddingHorizontal: chronicleSpacing.sm,
    paddingVertical: chronicleSpacing.xs,
  },
  skipLabel: {
    color: chronicleColors.textPrimary,
    fontFamily: chronicleFontFamily.bodySemiBold,
    fontSize: chronicleType.sm,
    letterSpacing: 0.5,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: chronicleSpacing.xl,
    gap: chronicleSpacing.lg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: chronicleSpacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: chronicleRadius.sm,
  },
  dotActive: {
    backgroundColor: chronicleColors.accentGold,
  },
  dotInactive: {
    backgroundColor: chronicleColors.accentGoldMuted,
  },
});
