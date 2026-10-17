import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { Text } from '../components/Text';
import { useAppSelector, useAppDispatch } from '../hooks/useRedux';
import { selectHistory, selectTotalTLAllWallets, selectWallets, undoHistoryEntry } from '../store/portfolioSlice';
import { DEFAULT_WALLET_ID, normalizeWalletId } from '../utils/walletUtils';
import { Wallet } from '../types';
import { getAllSnapshots, recordDailySnapshot } from '../services/dailySnapshotService';
import { exportHistoryCsvToShare } from '../services/historyExportService';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { getAssetIcon, getAssetColor } from '../utils/assetUtils';
import { formatRelativeDate, formatCurrency, formatDate } from '../utils/formatUtils';
import { HistoryItem } from '../types';
import EmptyState from '../components/EmptyState';
import { hapticFeedback } from '../utils/haptics';
const HISTORY_WALLET_ALL = 'all';

const HistoryScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const history = useAppSelector(selectHistory);
  const wallets = useAppSelector(selectWallets);
  const totalTL = useAppSelector(selectTotalTLAllWallets);
  const [refreshing, setRefreshing] = useState(false);
  const [showDailyTotals, setShowDailyTotals] = useState(false);
  const [historyWalletFilter, setHistoryWalletFilter] = useState<string>(HISTORY_WALLET_ALL);
  const [snapshots, setSnapshots] = useState<{ date: string; totalTl: number }[]>([]);
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  const loadSnapshots = useCallback(async () => {
    if (totalTL > 0) {
      try {
        await recordDailySnapshot(totalTL);
      } catch {
        // Silent fail
      }
    }
    const rows = await getAllSnapshots();
    setSnapshots(rows);
  }, [totalTL]);

  useEffect(() => {
    if (showDailyTotals) {
      loadSnapshots();
    }
  }, [showDailyTotals, loadSnapshots]);

  const walletDisplayName = (wallet: Wallet) =>
    wallet.id === DEFAULT_WALLET_ID ? t('walletsDefaultName') : wallet.name;

  const filteredHistory = useMemo(() => {
    if (historyWalletFilter === HISTORY_WALLET_ALL) {
      return history;
    }
    return history.filter(
      (entry) => normalizeWalletId(entry.item.walletId) === historyWalletFilter
    );
  }, [history, historyWalletFilter]);

  const showWalletFilter = !showDailyTotals && wallets.length > 1;

  const resolveEntryWalletLabel = (entry: HistoryItem): string | null => {
    if (!showWalletFilter || historyWalletFilter !== HISTORY_WALLET_ALL) {
      return null;
    }
    const walletId = normalizeWalletId(entry.item.walletId);
    const wallet = wallets.find((w) => w.id === walletId);
    return wallet ? walletDisplayName(wallet) : null;
  };

  const confirmUndo = (entry: HistoryItem) => {
    if (entry.type === 'update') {
      Alert.alert(t('error'), t('undoUnsupported'));
      return;
    }
    Alert.alert(t('undoTransaction'), t('undoConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('undoTransaction'),
        style: 'destructive',
        onPress: () => {
          dispatch(undoHistoryEntry(entry.id));
          hapticFeedback.success();
        },
      },
    ]);
  };

  const renderRightActions = (entry: HistoryItem) => (
    <TouchableOpacity
      style={styles.undoAction}
      onPress={() => confirmUndo(entry)}
      activeOpacity={0.8}
    >
      <Feather name="rotate-ccw" size={22} color={colors.textPrimary} />
      <Text style={styles.undoText}>{t('undoTransaction')}</Text>
    </TouchableOpacity>
  );

  const renderHistoryItem = ({ item }: { item: HistoryItem }) => {
    const isAdd = item.type === 'add';
    const assetColor = getAssetColor(item.item.type);
    const walletLabel = resolveEntryWalletLabel(item);

    const row = (
      <View style={styles.historyItem}>
        <View style={styles.historyLeft}>
          <View
            style={[
              styles.assetIconContainer,
              {
                backgroundColor: assetColor + '20',
                borderColor: assetColor + '40',
              },
            ]}
          >
            <Text style={[styles.assetIcon, { color: assetColor }]}>
              {getAssetIcon(item.item.type)}
            </Text>
          </View>

          <View style={styles.historyInfo}>
            <Text style={styles.assetType}>{t(`assetTypes.${item.item.type}`)}</Text>
            {walletLabel && (
              <Text style={styles.historyWalletLabel} numberOfLines={1}>
                {walletLabel}
              </Text>
            )}
            {item.description && (
              <Text style={styles.historyDescription} numberOfLines={1}>
                {item.description}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.historyRight}>
          <View style={styles.amountContainer}>
            <View
              style={[
                styles.actionBadge,
                { backgroundColor: isAdd ? colors.success + '20' : colors.error + '20' },
              ]}
            >
              <Feather
                name={isAdd ? 'trending-up' : 'trending-down'}
                size={14}
                color={isAdd ? colors.success : colors.error}
              />
            </View>
            <Text
              style={[styles.historyAmount, { color: isAdd ? colors.success : colors.error }]}
            >
              {isAdd ? '+' : '−'}
              {formatCurrency(
                isNaN(item.item.amount) || !isFinite(item.item.amount) ? 0 : item.item.amount,
                i18n.language
              )}
            </Text>
          </View>
          {item.priceAtTime != null && (
            <Text style={styles.historyPrice}>
              {formatCurrency(item.priceAtTime, i18n.language)} ₺
            </Text>
          )}
          <Text style={styles.historyDate}>
            {formatRelativeDate(item.date, i18n.language, t)}
          </Text>
        </View>
      </View>
    );

    return (
      <Swipeable renderRightActions={() => renderRightActions(item)} overshootRight={false}>
        {row}
      </Swipeable>
    );
  };

  const handleExportCsv = async () => {
    if (isExportingCsv || history.length === 0) {
      return;
    }
    setIsExportingCsv(true);
    hapticFeedback.light();
    try {
      await exportHistoryCsvToShare(filteredHistory, t, i18n.language);
      hapticFeedback.success();
    } catch {
      hapticFeedback.error();
      Alert.alert(t('error'), t('historyExportFailed'));
    } finally {
      setIsExportingCsv(false);
    }
  };

  const onRefresh = () => {
    hapticFeedback.light();
    setRefreshing(true);
    const done = () => {
      setRefreshing(false);
      hapticFeedback.success();
    };
    if (showDailyTotals) {
      loadSnapshots().finally(done);
    } else {
      setTimeout(done, 500);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
              {showDailyTotals ? t('dailyTotalsTitle') : t('historyTitle')}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={2}>
              {showDailyTotals ? t('dailyTotalsSubtitle') : t('historySubtitle')}
            </Text>
          </View>
          <View style={styles.headerActions}>
            {!showDailyTotals && history.length > 0 && (
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={handleExportCsv}
                disabled={isExportingCsv}
              >
                {isExportingCsv ? (
                  <ActivityIndicator size="small" color={colors.primaryStart} />
                ) : (
                  <Feather name="download" size={20} color={colors.primaryStart} />
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.headerToggle}
              onPress={() => {
                hapticFeedback.selection();
                setShowDailyTotals((v) => !v);
              }}
            >
              <Text style={styles.headerToggleText} numberOfLines={1}>
                {showDailyTotals ? t('history') : t('dailyTotalsShort')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {showWalletFilter && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.walletFilterScroll}
            contentContainerStyle={styles.walletFilterContent}
          >
            <TouchableOpacity
              style={[
                styles.walletFilterChip,
                historyWalletFilter === HISTORY_WALLET_ALL && styles.walletFilterChipActive,
              ]}
              onPress={() => {
                hapticFeedback.selection();
                setHistoryWalletFilter(HISTORY_WALLET_ALL);
              }}
            >
              <Text
                style={[
                  styles.walletFilterChipText,
                  historyWalletFilter === HISTORY_WALLET_ALL && styles.walletFilterChipTextActive,
                ]}
              >
                {t('historyWalletAll')}
              </Text>
            </TouchableOpacity>
            {wallets.map((wallet) => (
              <TouchableOpacity
                key={wallet.id}
                style={[
                  styles.walletFilterChip,
                  historyWalletFilter === wallet.id && styles.walletFilterChipActive,
                ]}
                onPress={() => {
                  hapticFeedback.selection();
                  setHistoryWalletFilter(wallet.id);
                }}
              >
                <Text
                  style={[
                    styles.walletFilterChipText,
                    historyWalletFilter === wallet.id && styles.walletFilterChipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {walletDisplayName(wallet)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {showDailyTotals ? (
        snapshots.length === 0 ? (
          <EmptyState
            icon={<Feather name="calendar" size={40} color={colors.textMuted} />}
            title={t('noDailyTotals')}
            description={t('dailyTotalsSubtitle')}
          />
        ) : (
          <FlatList
            data={snapshots}
            keyExtractor={(item) => item.date}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primaryStart}
              />
            }
            renderItem={({ item }) => (
              <View style={styles.snapshotRow}>
                <Text style={styles.snapshotDate}>
                  {formatDate(new Date(item.date + 'T12:00:00'), i18n.language, {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </Text>
                <Text style={styles.snapshotValue}>
                  {formatCurrency(item.totalTl, i18n.language)} ₺
                </Text>
              </View>
            )}
          />
        )
      ) : history.length === 0 ? (
        <EmptyState
          icon={<Feather name="file-text" size={40} color={colors.textMuted} />}
          title={t('noHistory')}
          description={t('noHistorySubtitle')}
        />
      ) : filteredHistory.length === 0 ? (
        <EmptyState
          icon={<Feather name="filter" size={40} color={colors.textMuted} />}
          title={t('noHistory')}
          description={t('historyWalletFilterEmpty')}
        />
      ) : (
        <FlatList
          data={filteredHistory}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primaryStart}
              colors={[colors.primaryStart]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
    minHeight: 88,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  headerTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 0,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerToggle: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    flexShrink: 0,
  },
  headerToggleText: {
    color: colors.primaryStart,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  walletFilterScroll: {
    marginTop: spacing.md,
    maxHeight: 40,
  },
  walletFilterContent: {
    gap: spacing.sm,
    alignItems: 'center',
  },
  walletFilterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    maxWidth: 140,
  },
  walletFilterChipActive: {
    borderColor: colors.primaryStart,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  walletFilterChipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  walletFilterChipTextActive: {
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
  },
  listContainer: {
    padding: spacing.lg,
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  undoAction: {
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 96,
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    marginLeft: spacing.sm,
  },
  undoText: {
    color: colors.textPrimary,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    fontWeight: fontWeight.semibold,
  },
  snapshotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: spacing.sm,
  },
  snapshotDate: {
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  snapshotValue: {
    color: colors.textPrimary,
    fontWeight: fontWeight.bold,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  assetIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    borderWidth: 2,
  },
  assetIcon: {
    fontSize: 22,
    fontWeight: fontWeight.bold,
  },
  historyInfo: {
    flex: 1,
  },
  assetType: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  historyWalletLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  historyDescription: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  actionBadge: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  historyAmount: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  historyPrice: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
    fontWeight: fontWeight.medium,
  },
  historyDate: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});

export default HistoryScreen;
