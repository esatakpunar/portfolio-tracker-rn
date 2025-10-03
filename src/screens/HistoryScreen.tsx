import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../hooks/useRedux';
import { selectHistory } from '../store/portfolioSlice';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { HistoryItem } from '../types';

const HistoryScreen: React.FC = () => {
  const { t } = useTranslation();
  const history = useAppSelector(selectHistory);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (days === 1) {
      return t('yesterday');
    } else if (days < 7) {
      return `${days} ${t('daysAgo')}`;
    } else {
      return date.toLocaleString('tr-TR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  };

  const getAssetIcon = (type: string): string => {
    const iconMap: Record<string, string> = {
      'tl': '₺',
      'usd': '$',
      'eur': '€',
      'gumus': '₲',
      'tam': '₲',
      'ceyrek': '₲',
      '22_ayar': '₲',
      '24_ayar': '₲',
    };
    return iconMap[type] || '₲';
  };

  const getAssetColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      'tl': '#dc2626',
      'usd': '#10b981',
      'eur': '#3b82f6',
      'gumus': '#6b7280',
      'tam': '#f59e0b',
      'ceyrek': '#f59e0b',
      '22_ayar': '#f59e0b',
      '24_ayar': '#f59e0b',
    };
    return colorMap[type] || colors.primaryStart;
  };

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
              {isAdd ? '+' : '−'}{item.item.amount.toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>
          <Text style={styles.historyDate}>{formatDate(item.date)}</Text>
        </View>
      </View>
    );
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
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
          </View>
          <Text style={styles.emptyStateTitle}>{t('noHistory')}</Text>
          <Text style={styles.emptyStateSubtitle}>
            {t('noHistorySubtitle')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={(item, index) => `${item.date}-${index}`}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
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
