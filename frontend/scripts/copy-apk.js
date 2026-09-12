import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceApk = path.resolve(__dirname, '../android/app/build/outputs/apk/debug/app-debug.apk');
const targetApk = path.resolve(__dirname, '../public/PhysioTwin.apk');

if (fs.existsSync(sourceApk)) {
  const stats = fs.statSync(sourceApk);
  fs.copyFileSync(sourceApk, targetApk);
  console.log(`✅ Successfully updated PhysioTwin.apk (${(stats.size / (1024 * 1024)).toFixed(2)} MB) in public/`);
} else {
  console.error(`❌ Source APK not found at: ${sourceApk}`);
  process.exit(1);
}
