import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Text } from '../components/Text';
import { useAppSelector } from '../hooks/useRedux';
import { selectHistory } from '../store/portfolioSlice';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { getAssetIcon, getAssetColor } from '../utils/assetUtils';
import { formatRelativeDate, formatCurrency } from '../utils/formatUtils';
import { HistoryItem } from '../types';
import EmptyState from '../components/EmptyState';
import { hapticFeedback } from '../utils/haptics';

const HistoryScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const history = useAppSelector(selectHistory);
  const [refreshing, setRefreshing] = useState(false);


  const renderHistoryItem = ({ item }: { item: HistoryItem }) => {
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
  };

  const onRefresh = () => {
    hapticFeedback.light();
    setRefreshing(true);
    // UI-only refresh - history is derived from items, no fetch needed
    setTimeout(() => {
      setRefreshing(false);
      hapticFeedback.success();
    }, 500);
  };

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
          description={t('noHistorySubtitle')}
        />
      ) : (
        <FlatList
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={(item, index) => {
            // Create a unique key combining date, type, item.id, amount, and index
            // This ensures uniqueness even if multiple history items share the same PortfolioItem
            return `${item.date}-${item.type}-${item.item.id}-${item.item.amount}-${index}`;
          }}
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
