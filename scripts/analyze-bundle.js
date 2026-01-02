/**
 * Bundle Size Analysis Script
 * 
 * Analyzes bundle size and provides insights for optimization
 * Run with: node scripts/analyze-bundle.js
 */

const fs = require('fs');
const path = require('path');

console.log('📦 Bundle Size Analysis\n');

// Check if build directory exists
const buildDir = path.join(__dirname, '..', '.expo', 'web', 'build');
const iosBuildDir = path.join(__dirname, '..', 'ios', 'build');
const androidBuildDir = path.join(__dirname, '..', 'android', 'app', 'build');

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return null;
  }
}

function analyzeDirectory(dir, label) {
  if (!fs.existsSync(dir)) {
    console.log(`⚠️  ${label}: Directory not found`);
    return;
  }

  console.log(`\n📁 ${label}:`);
  console.log('─'.repeat(50));

  const files = fs.readdirSync(dir, { withFileTypes: true });
  let totalSize = 0;

  files.forEach((file) => {
    const filePath = path.join(dir, file.name);
    if (file.isFile()) {
      const size = getFileSize(filePath);
      if (size) {
        totalSize += size;
        console.log(`  ${file.name.padEnd(40)} ${formatBytes(size)}`);
      }
    } else if (file.isDirectory()) {
      // Recursively analyze subdirectories
      const subDirPath = path.join(dir, file.name);
      const subFiles = fs.readdirSync(subDirPath, { withFileTypes: true });
      subFiles.forEach((subFile) => {
        if (subFile.isFile()) {
          const subFilePath = path.join(subDirPath, subFile.name);
          const size = getFileSize(subFilePath);
          if (size) {
            totalSize += size;
            console.log(`  ${file.name}/${subFile.name.padEnd(35)} ${formatBytes(size)}`);
          }
        }
      });
    }
  });

  if (totalSize > 0) {
    console.log('─'.repeat(50));
    console.log(`  Total: ${formatBytes(totalSize)}`);
  }
}

// Analyze package.json dependencies
function analyzeDependencies() {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  console.log('\n📦 Dependencies Analysis:');
  console.log('─'.repeat(50));
  
  const deps = Object.keys(packageJson.dependencies || {});
  const devDeps = Object.keys(packageJson.devDependencies || {});
  
  console.log(`  Production dependencies: ${deps.length}`);
  console.log(`  Development dependencies: ${devDeps.length}`);
  console.log(`  Total dependencies: ${deps.length + devDeps.length}`);
  
  // List large/common dependencies
  console.log('\n  Large dependencies to watch:');
  const largeDeps = [
    '@sentry/react-native',
    'react-native-chart-kit',
    'victory-native',
    'zod',
  ];
  
  largeDeps.forEach((dep) => {
    if (deps.includes(dep) || devDeps.includes(dep)) {
      console.log(`    ⚠️  ${dep}`);
    }
  });
}

// Main analysis
console.log('Analyzing bundle size...\n');

analyzeDirectory(buildDir, 'Web Build');
analyzeDirectory(iosBuildDir, 'iOS Build');
analyzeDirectory(androidBuildDir, 'Android Build');

analyzeDependencies();

console.log('\n💡 Optimization Tips:');
console.log('─'.repeat(50));
console.log('  1. Use lazy loading for screens (✅ Implemented)');
console.log('  2. Remove unused dependencies');
console.log('  3. Use tree-shaking for large libraries');
console.log('  4. Consider code splitting for large components');
console.log('  5. Optimize images and assets');
console.log('  6. Use production builds for accurate size');

console.log('\n✅ Analysis complete!\n');

