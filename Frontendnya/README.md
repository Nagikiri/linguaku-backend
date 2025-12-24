# 📱 LinguaKu Frontend (React Native)

Aplikasi mobile pembelajaran bahasa Inggris dengan fitur analisis pronunciation.

## 🛠️ Tech Stack

- **Framework:** React Native with Expo
- **Navigation:** React Navigation
- **State Management:** React Hooks
- **API:** Axios
- **UI:** Custom components with animations

---

## 🚀 Setup Development

### Prerequisites

- Node.js v16+
- Expo CLI
- Android Studio or Xcode (untuk build APK/IPA)

### Installation

1. **Install dependencies**
   ```bash
   cd Frontendnya
   npm install
   ```

2. **Update API URL**
   
   Edit `src/config/api.js`:
   ```javascript
   // Development: Your local IP
   const DEV_API_URL = 'http://192.168.x.x:5000/api';
   
   // Production: Railway URL
   const PROD_API_URL = 'https://linguaku-backend-production.up.railway.app/api';
   ```

3. **Start Expo development server**
   ```bash
   npm start
   ```

4. **Test di Expo Go**
   - Scan QR code dengan Expo Go app
   - Atau press `a` untuk Android emulator

---

## 📦 Build APK untuk Deployment

### Option 1: EAS Build (Recommended)

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**
   ```bash
   eas login
   ```

3. **Configure EAS Build**
   ```bash
   eas build:configure
   ```

4. **Build APK**
   ```bash
   eas build --platform android --profile preview
   ```
   
   - Build akan berjalan di cloud Expo
   - Tunggu 10-15 menit
   - Download APK setelah selesai

5. **Build untuk Production**
   ```bash
   eas build --platform android --profile production
   ```

### Option 2: Local Build (Requires Android Studio)

1. **Generate Android project**
   ```bash
   npx expo prebuild --platform android
   ```

2. **Build APK**
   ```bash
   npx expo run:android --variant release
   ```

3. **Find APK**
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

---

## ⚙️ Configuration Files

### `app.json`
- App name, version, icon
- Android package name: `com.linguaku.app`
- Deep linking scheme: `linguaku://`
- Permissions: RECORD_AUDIO, INTERNET

### `eas.json`
- Build profiles (development, preview, production)
- APK build configuration
- Distribution settings

---

## 🎯 Features

- ✅ User authentication (register, login, logout)
- ✅ Email verification
- ✅ Password reset
- ✅ Practice pronunciation dengan voice recording
- ✅ Real-time feedback dari AI
- ✅ History & statistics
- ✅ Progress tracking
- ✅ Profile management

---

## 📱 Testing

### Test di Expo Go:
```bash
npm start
# Scan QR code
```

### Test APK di Physical Device:
1. Transfer APK ke phone (email, USB, Google Drive)
2. Install APK (allow unknown sources)
3. Test all features

---

## 🚀 Production Deployment

### Before Building:

1. **Update API URL** di `src/config/api.js` dengan Railway URL
2. **Test backend** connection
3. **Update app.json** version number
4. **Generate icons** (icon.png, adaptive-icon.png, splash.png)

### Build & Test:

```bash
# Build preview APK
eas build --platform android --profile preview

# Download APK
# Install on test device
# Test ALL features
```

### Production Build:

```bash
# Final production build
eas build --platform android --profile production
```

---

## 🔧 Troubleshooting

### APK Can't Connect to Backend
- Check API_URL di `src/config/api.js`
- Verify Railway backend is running
- Test: `curl https://your-railway-app.railway.app/api/health`

### Build Failed
- Clear cache: `eas build --clear-cache`
- Check `app.json` configuration
- Verify all dependencies installed

### "Install from Unknown Sources" Error
- Settings → Security → Enable "Unknown Sources"
- Or Settings → Apps → Install Unknown Apps → Enable

---

## 📝 Environment Variables

Frontend tidak memerlukan `.env` file karena menggunakan konfigurasi di `api.js`.

Untuk production, update `PROD_API_URL` di `src/config/api.js` dengan Railway URL actual.

---

## 🎉 Success Criteria

APK ready untuk presentasi ketika:

- ✅ APK installed di physical device
- ✅ Connect ke Railway backend successfully
- ✅ All features working (register, login, practice, etc.)
- ✅ No crashes or errors
- ✅ UI responsive dan smooth
- ✅ Demo account created dengan sample data

---

## 📞 Support

Untuk issues atau pertanyaan, buat issue di GitHub repository.
