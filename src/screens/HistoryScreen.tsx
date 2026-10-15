import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { Text } from '../components/Text';
import { useAppSelector, useAppDispatch } from '../hooks/useRedux';
import { selectHistory, selectTotalTL, undoHistoryEntry } from '../store/portfolioSlice';
import { getAllSnapshots, recordDailySnapshot } from '../services/dailySnapshotService';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { getAssetIcon, getAssetColor } from '../utils/assetUtils';
import { formatRelativeDate, formatCurrency, formatDate } from '../utils/formatUtils';
import { HistoryItem } from '../types';
import EmptyState from '../components/EmptyState';
import { hapticFeedback } from '../utils/haptics';
const HistoryScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const history = useAppSelector(selectHistory);
  const totalTL = useAppSelector(selectTotalTL);
  const [refreshing, setRefreshing] = useState(false);
  const [showDailyTotals, setShowDailyTotals] = useState(false);
  const [snapshots, setSnapshots] = useState<{ date: string; totalTl: number }[]>([]);

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
          <View>
            <Text style={styles.headerTitle}>
              {showDailyTotals ? t('dailyTotalsTitle') : t('historyTitle')}
            </Text>
            <Text style={styles.headerSubtitle}>
              {showDailyTotals ? t('dailyTotalsSubtitle') : t('historySubtitle')}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.headerToggle}
            onPress={() => {
              hapticFeedback.selection();
              setShowDailyTotals((v) => !v);
            }}
          >
            <Text style={styles.headerToggleText}>
              {showDailyTotals ? t('historyTitle') : t('dailyTotalsTitle')}
            </Text>
          </TouchableOpacity>
        </View>
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
      ) : (
        <FlatList
          data={history}
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
  },
  headerToggle: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  headerToggleText: {
    color: colors.primaryStart,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
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
