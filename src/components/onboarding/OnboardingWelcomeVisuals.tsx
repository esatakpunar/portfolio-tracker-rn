import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text } from '../Text';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../theme';
import { getAssetColor } from '../../utils/assetUtils';
import { AssetType } from '../../types';

const MOCK_ASSETS: { type: AssetType; amount: string; value: string; change: number }[] = [
  { type: '24_ayar', amount: '12,5 g', value: '₺428.400', change: 1.2 },
  { type: 'usd', amount: '2.400', value: '₺82.560', change: 0.4 },
  { type: 'eur', amount: '850', value: '₺31.200', change: -0.3 },
];

const slideAccents = ['#3B82F6', '#F59E0B', '#8B5CF6', '#14B8A6', '#2ECC71'];

export const getOnboardingSlideAccent = (index: number): string =>
  slideAccents[index] ?? colors.accent;

interface VisualProps {
  slideIndex: number;
}

const AmbientGlow: React.FC<{ color: string }> = ({ color }) => (
  <>
    <View style={[styles.glow, styles.glowTop, { backgroundColor: color }]} />
    <View style={[styles.glow, styles.glowBottom, { backgroundColor: color }]} />
  </>
);

const MockAssetRow: React.FC<{
  type: AssetType;
  label: string;
  amount: string;
  value: string;
  change: number;
}> = ({ type, label, amount, value, change }) => {
  const dot = getAssetColor(type);
  const positive = change >= 0;
  return (
    <View style={styles.assetRow}>
      <View style={[styles.assetDot, { backgroundColor: dot }]} />
      <View style={styles.assetMeta}>
        <Text style={styles.assetName} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.assetAmount}>{amount}</Text>
      </View>
      <View style={styles.assetRight}>
        <Text style={styles.assetValue}>{value}</Text>
        <View style={[styles.changePill, { backgroundColor: (positive ? colors.positive : colors.negative) + '22' }]}>
          <Feather
            name={positive ? 'trending-up' : 'trending-down'}
            size={10}
            color={positive ? colors.positive : colors.negative}
          />
          <Text style={[styles.changeText, { color: positive ? colors.positive : colors.negative }]}>
            {positive ? '+' : ''}
            {change.toFixed(1)}%
          </Text>
        </View>
      </View>
    </View>
  );
};

const PortfolioVisual: React.FC = () => {
  const { t } = useTranslation();
  return (
    <View style={styles.stageInner}>
      <View style={[styles.heroCard, shadows.medium]}>
        <Text style={styles.heroLabel}>{t('onboardingMockTotalLabel')}</Text>
        <Text style={styles.heroTotal}>₺1.284.560</Text>
        <View style={styles.currencyDots}>
          {(['TL', 'USD', 'EUR', 'ALTIN'] as const).map((c, i) => (
            <View key={c} style={[styles.currencyDot, i === 0 && styles.currencyDotActive]} />
          ))}
        </View>
        <Text style={styles.heroHint}>{t('onboardingMockSwipeHint')}</Text>
      </View>
      <View style={[styles.listCard, shadows.small]}>
        {MOCK_ASSETS.map((row) => (
          <MockAssetRow
            key={row.type}
            type={row.type}
            label={t(`assetTypes.${row.type}`)}
            amount={row.amount}
            value={row.value}
            change={row.change}
          />
        ))}
      </View>
      <View style={styles.floatingFab}>
        <Feather name="plus" size={22} color={colors.textPrimary} />
      </View>
    </View>
  );
};

const LiveOfflineVisual: React.FC = () => {
  const { t } = useTranslation();
  return (
    <View style={styles.stageInner}>
      <View style={styles.badgeRow}>
        <View style={[styles.statusBadge, { borderColor: colors.positive + '55' }]}>
          <Feather name="refresh-cw" size={14} color={colors.positive} />
          <Text style={[styles.statusBadgeText, { color: colors.positive }]}>
            {t('onboardingMockLivePrices')}
          </Text>
        </View>
        <View style={[styles.statusBadge, { borderColor: colors.accent + '55' }]}>
          <Feather name="wifi-off" size={14} color={colors.accentLight} />
          <Text style={styles.statusBadgeText}>{t('onboardingMockOfflineReady')}</Text>
        </View>
      </View>
      <View style={[styles.heroCard, shadows.medium]}>
        <View style={styles.liveHeader}>
          <Text style={styles.heroLabel}>{t('onboardingMockPricesTitle')}</Text>
          <View style={styles.livePulse}>
            <View style={styles.livePulseDot} />
            <Text style={styles.livePulseText}>{t('onboardingMockUpdating')}</Text>
          </View>
        </View>
        {MOCK_ASSETS.slice(0, 3).map((row) => (
          <View key={row.type} style={styles.priceLine}>
            <Text style={styles.priceLineName}>{t(`assetTypes.${row.type}`)}</Text>
            <Text style={styles.priceLineValue}>
              {row.type === 'usd' ? '₺34,42' : row.type === 'eur' ? '₺36,71' : '₺3.427/g'}
            </Text>
          </View>
        ))}
        <Text style={styles.cacheNote}>{t('onboardingMockCacheNote')}</Text>
      </View>
      <View style={[styles.deviceChip, shadows.small]}>
        <Feather name="smartphone" size={16} color={colors.textSecondary} />
        <Text style={styles.deviceChipText}>{t('onboardingMockOnDevice')}</Text>
      </View>
    </View>
  );
};

const WalletsGoalsVisual: React.FC = () => {
  const { t } = useTranslation();
  const wallets = [t('onboardingMockWalletMain'), t('onboardingMockWalletSavings'), t('onboardingMockWalletFx')];
  return (
    <View style={styles.stageInner}>
      <View style={styles.walletRow}>
        {wallets.map((name, i) => (
          <View key={name} style={[styles.walletChip, i === 1 && styles.walletChipActive]}>
            <Feather name="folder" size={12} color={i === 1 ? colors.accentLight : colors.textMuted} />
            <Text style={[styles.walletChipText, i === 1 && styles.walletChipTextActive]} numberOfLines={1}>
              {name}
            </Text>
          </View>
        ))}
      </View>
      <View style={[styles.goalCard, shadows.medium]}>
        <View style={styles.goalHeader}>
          <Feather name="target" size={18} color={colors.warning} />
          <Text style={styles.goalTitle}>{t('onboardingMockGoalTitle')}</Text>
        </View>
        <Text style={styles.goalAmount}>₺1.500.000</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '68%' }]} />
        </View>
        <Text style={styles.goalProgress}>{t('onboardingMockGoalProgress', { percent: 68 })}</Text>
      </View>
      <View style={[styles.listCard, shadows.small]}>
        <MockAssetRow
          type="ceyrek"
          label={t('assetTypes.ceyrek')}
          amount="8 adet"
          value="₺186.400"
          change={0.9}
        />
        <MockAssetRow type="tl" label={t('assetTypes.tl')} amount="₺42.000" value="₺42.000" change={0} />
      </View>
    </View>
  );
};

const HistoryInsightsVisual: React.FC = () => {
  const { t } = useTranslation();
  const events = [
    { icon: 'plus-circle' as const, color: colors.positive, title: t('onboardingMockHistoryAdd'), sub: '+12,5 g · 24 Ayar' },
    { icon: 'minus-circle' as const, color: colors.negative, title: t('onboardingMockHistoryRemove'), sub: '-500 USD' },
    { icon: 'edit-3' as const, color: colors.accent, title: t('onboardingMockHistoryUpdate'), sub: t('assetTypes.eur') },
  ];
  return (
    <View style={styles.stageInner}>
      <View style={[styles.historyCard, shadows.medium]}>
        <View style={styles.historyHeader}>
          <Feather name="clock" size={16} color={colors.textSecondary} />
          <Text style={styles.historyTitle}>{t('history')}</Text>
        </View>
        {events.map((ev) => (
          <View key={ev.title} style={styles.historyRow}>
            <View style={[styles.historyIcon, { backgroundColor: ev.color + '22' }]}>
              <Feather name={ev.icon} size={14} color={ev.color} />
            </View>
            <View style={styles.historyMeta}>
              <Text style={styles.historyEvent}>{ev.title}</Text>
              <Text style={styles.historySub}>{ev.sub}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={[styles.insightCard, shadows.small]}>
        <Text style={styles.insightLabel}>{t('onboardingMockInsightLabel')}</Text>
        <View style={styles.insightBars}>
          {[72, 48, 28, 18].map((h, i) => (
            <View key={i} style={[styles.insightBar, { height: h, opacity: 0.35 + i * 0.15 }]} />
          ))}
        </View>
        <Text style={styles.insightCaption}>{t('onboardingMockInsightCaption')}</Text>
      </View>
    </View>
  );
};

const SecureReadyVisual: React.FC = () => {
  const { t } = useTranslation();
  const tiles = [
    { icon: 'lock' as const, label: t('onboardingMockTileLock'), color: colors.accent },
    { icon: 'download' as const, label: t('onboardingMockTileBackup'), color: colors.warning },
    { icon: 'shield' as const, label: t('onboardingMockTilePrivate'), color: colors.positive },
  ];
  return (
    <View style={styles.stageInner}>
      <View style={styles.tileGrid}>
        {tiles.map((tile) => (
          <View key={tile.label} style={[styles.secureTile, shadows.small]}>
            <View style={[styles.secureIconWrap, { backgroundColor: tile.color + '22' }]}>
              <Feather name={tile.icon} size={22} color={tile.color} />
            </View>
            <Text style={styles.secureTileLabel}>{tile.label}</Text>
          </View>
        ))}
      </View>
      <View style={[styles.tabMock, shadows.medium]}>
        {(
          [
            { icon: 'briefcase', label: t('portfolio'), active: true },
            { icon: 'file-text', label: t('history'), active: false },
            { icon: 'bar-chart-2', label: t('markets'), active: false },
            { icon: 'settings', label: t('appSettings'), active: false },
          ] as const
        ).map((tab) => (
          <View key={tab.label} style={styles.tabMockItem}>
            <Feather name={tab.icon} size={18} color={tab.active ? colors.accentLight : colors.textMuted} />
            <Text style={[styles.tabMockLabel, tab.active && styles.tabMockLabelActive]}>{tab.label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.readyBanner}>
        <Feather name="zap" size={16} color={colors.warning} />
        <Text style={styles.readyBannerText}>{t('onboardingMockReadyBanner')}</Text>
      </View>
    </View>
  );
};

const visualBySlide = [
  PortfolioVisual,
  LiveOfflineVisual,
  WalletsGoalsVisual,
  HistoryInsightsVisual,
  SecureReadyVisual,
];

export const OnboardingWelcomeVisual: React.FC<VisualProps> = ({ slideIndex }) => {
  const accent = getOnboardingSlideAccent(slideIndex);
  const Visual = visualBySlide[slideIndex] ?? PortfolioVisual;
  return (
    <View style={styles.stage}>
      <AmbientGlow color={accent} />
      <Visual />
    </View>
  );
};

export const ONBOARDING_WELCOME_SLIDE_COUNT = visualBySlide.length;

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  stageInner: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    alignItems: 'stretch',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.14,
  },
  glowTop: {
    top: -80,
    right: -60,
  },
  glowBottom: {
    bottom: -40,
    left: -80,
    opacity: 0.08,
  },
  heroCard: {
    backgroundColor: colors.cardBackgroundElevated,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
  },
  heroLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
  },
  heroTotal: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  currencyDots: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  currencyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.paginationDotInactive,
  },
  currencyDotActive: {
    width: 18,
    backgroundColor: colors.accent,
  },
  heroHint: {
    marginTop: spacing.sm,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  listCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  assetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  assetDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  assetMeta: {
    flex: 1,
    minWidth: 0,
  },
  assetName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  assetAmount: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  assetRight: {
    alignItems: 'flex-end',
  },
  assetValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  changePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginTop: 2,
  },
  changeText: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
  },
  floatingFab: {
    position: 'absolute',
    top: -8,
    right: spacing.lg + 8,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.buttonPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.large,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  liveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  livePulse: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.positive,
  },
  livePulseText: {
    fontSize: fontSize.xs,
    color: colors.positive,
    fontWeight: fontWeight.medium,
  },
  priceLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  priceLineName: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  priceLineValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  cacheNote: {
    marginTop: spacing.md,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  deviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  deviceChipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  walletRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  walletChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  walletChipActive: {
    borderColor: colors.accent + '66',
    backgroundColor: colors.accent + '18',
  },
  walletChipText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
    flexShrink: 1,
  },
  walletChipTextActive: {
    color: colors.accentLight,
  },
  goalCard: {
    backgroundColor: colors.cardBackgroundElevated,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  goalTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  goalAmount: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.divider,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.warning,
  },
  goalProgress: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  historyCard: {
    backgroundColor: colors.cardBackgroundElevated,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    gap: spacing.md,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  historyTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyMeta: {
    flex: 1,
  },
  historyEvent: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  historySub: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  insightCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
  },
  insightLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  insightBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    height: 72,
    marginBottom: spacing.sm,
  },
  insightBar: {
    flex: 1,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.accent,
  },
  insightCaption: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  tileGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secureTile: {
    flex: 1,
    backgroundColor: colors.cardBackgroundElevated,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  secureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secureTileLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  tabMock: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
  },
  tabMockItem: {
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  tabMockLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  tabMockLabelActive: {
    color: colors.accentLight,
  },
  readyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.warning + '18',
    borderWidth: 1,
    borderColor: colors.warning + '44',
  },
  readyBannerText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
});
