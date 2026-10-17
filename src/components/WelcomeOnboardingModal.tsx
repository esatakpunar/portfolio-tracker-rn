import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Text } from './Text';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme';
import { hapticFeedback } from '../utils/haptics';
import {
  OnboardingWelcomeVisual,
  ONBOARDING_WELCOME_SLIDE_COUNT,
  getOnboardingSlideAccent,
} from './onboarding/OnboardingWelcomeVisuals';

const { width } = Dimensions.get('window');
const SLIDE_INDICES = Array.from({ length: ONBOARDING_WELCOME_SLIDE_COUNT }, (_, i) => i);

interface WelcomeOnboardingModalProps {
  visible: boolean;
  onFinish: () => void;
}

const WelcomeOnboardingModal: React.FC<WelcomeOnboardingModalProps> = ({ visible, onFinish }) => {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (visible) {
      setIndex(0);
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, [visible]);

  const finish = () => {
    hapticFeedback.success();
    onFinish();
  };

  const goNext = () => {
    if (index >= ONBOARDING_WELCOME_SLIDE_COUNT - 1) {
      finish();
      return;
    }
    hapticFeedback.light();
    const next = index + 1;
    listRef.current?.scrollToOffset({ offset: next * width, animated: true });
    setIndex(next);
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(Math.max(0, Math.min(i, ONBOARDING_WELCOME_SLIDE_COUNT - 1)));
  };

  const accent = getOnboardingSlideAccent(index);

  const renderSlide = (slideIndex: number) => (
    <View style={[styles.slide, { width }]}>
      <View style={styles.visualArea}>
        <OnboardingWelcomeVisual slideIndex={slideIndex} />
      </View>
      <View style={styles.copyBlock}>
        <View style={[styles.slideBadge, { backgroundColor: accent + '22', borderColor: accent + '44' }]}>
          <Text style={[styles.slideBadgeText, { color: accent }]}>
            {t('onboardingWelcomeStep', {
              current: slideIndex + 1,
              total: ONBOARDING_WELCOME_SLIDE_COUNT,
            })}
          </Text>
        </View>
        <Text style={styles.title}>{t(`onboardingWelcomeTitle${slideIndex + 1}`)}</Text>
        <Text style={styles.body}>{t(`onboardingWelcomeBody${slideIndex + 1}`)}</Text>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.brand}>{t('onboardingWelcomeBrand')}</Text>
          <TouchableOpacity style={styles.skipBtn} onPress={finish} activeOpacity={0.7}>
            <Text style={styles.skipText}>{t('onboardingSkip')}</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          ref={listRef}
          style={styles.list}
          data={SLIDE_INDICES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          keyExtractor={(item) => String(item)}
          renderItem={({ item }) => renderSlide(item)}
        />

        <View style={styles.footer}>
          <View style={styles.dots}>
            {SLIDE_INDICES.map((i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === index && [styles.dotActive, { backgroundColor: accent }],
                ]}
              />
            ))}
          </View>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: accent }]}
            onPress={goNext}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>
              {index === ONBOARDING_WELCOME_SLIDE_COUNT - 1 ? t('onboardingStart') : t('onboardingNext')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  brand: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  list: {
    flex: 1,
  },
  skipBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  skipText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  slide: {
    flex: 1,
  },
  visualArea: {
    flex: 1.15,
    minHeight: 320,
    justifyContent: 'center',
    paddingTop: spacing.sm,
  },
  copyBlock: {
    flex: 0.85,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    justifyContent: 'flex-start',
  },
  slideBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  slideBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.4,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.paginationDotInactive,
  },
  dotActive: {
    width: 22,
  },
  primaryBtn: {
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.medium,
  },
  primaryBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
});

export default WelcomeOnboardingModal;
