const { withEntitlementsPlist } = require('expo/config-plugins');

/**
 * expo-widgets always writes aps-environment even when enablePushNotifications is false.
 * Remove it from entitlements so App Store profiles without Push Notifications work.
 */
function withStripWidgetPushEntitlement(config) {
  return withEntitlementsPlist(config, (config) => {
    delete config.modResults['aps-environment'];
    return config;
  });
}

module.exports = withStripWidgetPushEntitlement;
