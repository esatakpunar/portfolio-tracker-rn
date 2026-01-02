import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Text } from '../components/Text';
import EmptyState from '../components/EmptyState';
import { useAppSelector } from '../hooks/useRedux';
import { selectHistory } from '../store/portfolioSlice';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { getAssetIcon, getAssetColor } from '../utils/assetUtils';
import { formatRelativeDate, formatCurrency } from '../utils/formatUtils';
import { HistoryItem } from '../types';

export const HistoryScreen: React.FC = React.memo(() => {
  const { t, i18n } = useTranslation();
  const history = useAppSelector(selectHistory);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // History doesn't need refresh, but we provide pull-to-refresh UX
    // In the future, this could refresh prices or reload history
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  }, []);

  const renderHistoryItem = React.useCallback(({ item }: { item: HistoryItem }) => {
    const isAdd = item.type === 'add';
    const assetColor = getAssetColor(item.item.type);
    
    return (
      <View style={styles.historyItem}>
        <View style={styles.historyLeft}>
          <View style={[
            styles.assetIconContainer,
            { 
              backgroundColor: assetColor + '20',
              borderColor: assetColor + '40',
            }
          ]}>
            <Text style={[styles.assetIcon, { color: assetColor }]}>
              {getAssetIcon(item.item.type)}
            </Text>
          </View>
          
          <View style={styles.historyInfo}>
            <Text style={styles.assetType}>
              {t(`assetTypes.${item.item.type}`)}
            </Text>
            {item.description && (
              <Text style={styles.historyDescription} numberOfLines={1}>
                {item.description}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.historyRight}>
          <View style={styles.amountContainer}>
            <View style={[
              styles.actionBadge,
              { backgroundColor: isAdd ? colors.success + '20' : colors.error + '20' }
            ]}>
              <Text style={[
                styles.actionIcon,
                { color: isAdd ? colors.success : colors.error }
              ]}>
                {isAdd ? '↑' : '↓'}
              </Text>
            </View>
            <Text style={[
              styles.historyAmount,
              { color: isAdd ? colors.success : colors.error }
            ]}>
              {isAdd ? '+' : '−'}{formatCurrency(
                isNaN(item.item.amount) || !isFinite(item.item.amount) ? 0 : item.item.amount,
                i18n.language
              )}
            </Text>
          </View>
          <Text style={styles.historyDate}>
            {formatRelativeDate(item.date, i18n.language, t)}
          </Text>
        </View>
      </View>
    );
  }, [t, i18n.language]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t('historyTitle')}</Text>
          <Text style={styles.headerSubtitle}>{t('historySubtitle')}</Text>
        </View>
      </View>

      {history.length === 0 ? (
        <EmptyState
          icon="📋"
          title={t('noHistory')}
          subtitle={t('noHistorySubtitle')}
        />
      ) : (
        <FlatList
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.item.id || `${item.date}-${item.type}-${item.item.type}`}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={10}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primaryStart}
              colors={[colors.primaryStart]}
              title={t('pullToRefresh')}
              titleColor={colors.textSecondary}
            />
          }
          getItemLayout={(_, index) => {
            // Approximate item height: padding (16*2) + content (~60) + marginBottom (12) = ~104
            const ITEM_HEIGHT = 104;
            return {
              length: ITEM_HEIGHT,
              offset: ITEM_HEIGHT * index,
              index,
            };
          }}
        />
      )}
    </SafeAreaView>
  );
});

HistoryScreen.displayName = 'HistoryScreen';

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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyStateTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyStateSubtitle: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
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
  actionIcon: {
    fontSize: 14,
    fontWeight: fontWeight.bold,
  },
  historyAmount: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  historyDate: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});

export default HistoryScreen;
