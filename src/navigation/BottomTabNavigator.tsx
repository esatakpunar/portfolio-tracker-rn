import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
// Lazy load screens for code splitting
const PortfolioScreen = React.lazy(() => import('../screens/PortfolioScreen'));
const HistoryScreen = React.lazy(() => import('../screens/HistoryScreen'));
const SettingsScreen = React.lazy(() => import('../screens/SettingsScreen'));
import TabIcon from '../components/TabIcon';
import { colors, fontSize, spacing, fontWeight } from '../theme';

const Tab = createBottomTabNavigator();

const BottomTabNavigator: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primaryStart,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
      })}
    >
      <Tab.Screen
        name="Portfolio"
        children={() => (
          <Suspense fallback={<ScreenLoader />}>
            <PortfolioScreen />
          </Suspense>
        )}
        options={{ tabBarLabel: t('portfolio') }}
      />
      <Tab.Screen
        name="History"
        children={() => (
          <Suspense fallback={<ScreenLoader />}>
            <HistoryScreen />
          </Suspense>
        )}
        options={{ tabBarLabel: t('history') }}
      />
      <Tab.Screen
        name="Settings"
        children={() => (
          <Suspense fallback={<ScreenLoader />}>
            <SettingsScreen />
          </Suspense>
        )}
        options={{ tabBarLabel: t('settings') }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.backgroundDark,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    height: 70,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  tabBarLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.xs,
  },
});

export default BottomTabNavigator;
