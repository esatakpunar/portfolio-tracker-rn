/**
 * Privacy Policy Screen
 * 
 * Displays privacy policy and GDPR compliance information
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Text } from '../components/Text';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { hapticFeedback } from '../utils/haptics';

interface PrivacyPolicyScreenProps {
  onClose: () => void;
}

export const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = React.memo(({ onClose }) => {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t('privacyPolicy')}</Text>
          <Text style={styles.headerSubtitle}>{t('privacyPolicySubtitle')}</Text>
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => {
            hapticFeedback.light();
            onClose();
          }}
          accessible={true}
          accessibilityLabel={t('close')}
          accessibilityRole="button"
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('privacy.introduction')}</Text>
          <Text style={styles.sectionText}>
            {t('privacy.introductionText')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('privacy.dataCollection')}</Text>
          <Text style={styles.sectionSubtitle}>{t('privacy.localData')}</Text>
          <Text style={styles.sectionText}>
            {t('privacy.localDataText')}
          </Text>
          
          <Text style={styles.sectionSubtitle}>{t('privacy.noDataCollection')}</Text>
          <Text style={styles.sectionText}>
            {t('privacy.noDataCollectionText')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('privacy.dataUsage')}</Text>
          <Text style={styles.sectionText}>
            {t('privacy.dataUsageText')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('privacy.dataStorage')}</Text>
          <Text style={styles.sectionText}>
            {t('privacy.dataStorageText')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('privacy.thirdPartyServices')}</Text>
          <Text style={styles.sectionText}>
            {t('privacy.thirdPartyServicesText')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('privacy.yourRights')}</Text>
          <Text style={styles.sectionText}>
            {t('privacy.yourRightsText')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('privacy.gdprCompliance')}</Text>
          <Text style={styles.sectionText}>
            {t('privacy.gdprComplianceText')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('privacy.contact')}</Text>
          <Text style={styles.sectionText}>
            {t('privacy.contactText')}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t('privacy.lastUpdated')}: {t('privacy.lastUpdatedDate')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
});

PrivacyPolicyScreen.displayName = 'PrivacyPolicyScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glassBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: fontSize.xl,
    color: colors.textPrimary,
    fontWeight: fontWeight.bold,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  sectionSubtitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  footer: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default PrivacyPolicyScreen;

