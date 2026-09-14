import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceApk = path.resolve(__dirname, '../android/app/build/outputs/apk/debug/app-debug.apk');
const targetPaths = [
  path.resolve(__dirname, '../public/PhysioTwin.apk'),
  path.resolve(__dirname, '../../backend/uploads/PhysioTwin.apk'),
  path.resolve(__dirname, '../dist/PhysioTwin.apk')
];

if (fs.existsSync(sourceApk)) {
  const stats = fs.statSync(sourceApk);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
  for (const target of targetPaths) {
    try {
      const dir = path.dirname(target);
      if (fs.existsSync(dir)) {
        fs.copyFileSync(sourceApk, target);
        console.log(`✅ Successfully updated PhysioTwin.apk (${sizeMb} MB) in ${path.relative(path.resolve(__dirname, '../..'), target)}`);
      }
    } catch (err) {
      console.warn(`⚠️ Could not copy to ${target}:`, err.message);
    }
  }
} else {
  console.error(`❌ Source APK not found at: ${sourceApk}`);
  process.exit(1);
}
