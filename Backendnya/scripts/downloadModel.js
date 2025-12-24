// scripts/downloadModel.js
const fs = require('fs');
const path = require('path');
const https = require('https');

// Model options (pilih salah satu):
// tiny.en   - 75MB  - Tercepat, akurasi 70%
// base.en   - 142MB - Sedang, akurasi 80%
// small.en  - 466MB - Akurasi 90%
// large-v3  - 1500MB - Akurasi 97%

const MODEL = 'base.en'; // ← ubah di sini untuk pilih model
const MODEL_URL = `https://raw.githubusercontent.com/ggerganov/whisper.cpp/master/models/ggml-${MODEL}.bin`;

const MODEL_DIR = path.join(__dirname, '../models');
const MODEL_PATH = path.join(MODEL_DIR, `ggml-${MODEL}.bin`);

if (!fs.existsSync(MODEL_DIR)) {
  fs.mkdirSync(MODEL_DIR, { recursive: true });
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📥 Downloading Whisper Model');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📦 Model: ${MODEL}`);
console.log(`📍 URL: ${MODEL_URL}`);
console.log(`💾 Saving to: ${MODEL_PATH}`);
console.log('');

const file = fs.createWriteStream(MODEL_PATH);
let downloadedBytes = 0;

https.get(MODEL_URL, (response) => {
  const totalBytes = parseInt(response.headers['content-length'], 10) || 0;

  response.on('data', (chunk) => {
    downloadedBytes += chunk.length;
    const percent = totalBytes
      ? ((downloadedBytes / totalBytes) * 100).toFixed(1)
      : '...';
    const downloadedMB = (downloadedBytes / 1024 / 1024).toFixed(1);
    const totalMB = totalBytes
      ? (totalBytes / 1024 / 1024).toFixed(1)
      : '?';

    process.stdout.write(
      `\r📊 Progress: ${percent}% (${downloadedMB}MB / ${totalMB}MB)`
    );
  });

  response.pipe(file);

  file.on('finish', () => {
    file.close();
    console.log('\n');
    console.log('✅ Model downloaded successfully!');
    console.log(
      `📏 Size: ${(fs.statSync(MODEL_PATH).size / 1024 / 1024).toFixed(
        1
      )}MB`
    );
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  });
}).on('error', (err) => {
  fs.unlink(MODEL_PATH, () => {});
  console.error('\n❌ Download failed:', err.message);
});
