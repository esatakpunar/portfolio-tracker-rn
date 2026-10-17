/**
 * expo-widgets adds aps-environment even when enablePushNotifications is false.
 * Patch after install so EAS npm ci gets the fix (config-plugin order cannot remove it reliably).
 */
const fs = require('fs');
const path = require('path');

const target = path.join(
  __dirname,
  '../node_modules/expo-widgets/plugin/build/ios/withPushNotifications.js'
);

if (!fs.existsSync(target)) {
  process.exit(0);
}

const want = `const withPushNotifications = (config, props) => (0, config_plugins_1.withInfoPlist)((0, config_plugins_1.withEntitlementsPlist)(config, (mod) => {
    if (props.enablePushNotifications) {
        mod.modResults['aps-environment'] = 'production';
    }
    else {
        delete mod.modResults['aps-environment'];
    }
    return mod;
}), (mod) => {`;

let src = fs.readFileSync(target, 'utf8');
if (src.includes('if (props.enablePushNotifications)')) {
  process.exit(0);
}

const needle = `const withPushNotifications = (config, props) => (0, config_plugins_1.withInfoPlist)((0, config_plugins_1.withEntitlementsPlist)(config, (mod) => {
    mod.modResults['aps-environment'] = 'development';
    return mod;
}), (mod) => {`;

if (!src.includes(needle)) {
  console.warn('patch-expo-widgets-push: unexpected withPushNotifications.js — skip');
  process.exit(0);
}

src = src.replace(needle, want);
fs.writeFileSync(target, src);
