# 🎯 LinguaKu - Language Learning Platform

Monorepo for LinguaKu, an AI-powered language learning application with speech recognition and pronunciation assessment.

## 📁 Project Structure

```
ProjectIPPLLinguaKu/
├── Backendnya/          # Node.js Backend (Express + MongoDB)
│   ├── server.js
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── AIConnector/     # Python AI Service
│
├── Frontendnya/         # React Native Mobile App (Expo)
│   ├── App.js
│   ├── src/
│   └── android/
│
├── .gitignore          # Monorepo gitignore
└── README.md           # This file
```

## 🚀 Quick Start

### Backend Setup

```bash
cd Backendnya
npm install
cp .env.example .env  # Configure your environment variables
npm start
```

**Environment Variables Required:**
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT token secret
- `CLOUDINARY_*` - Cloudinary credentials for file uploads
- `GEMINI_API_KEY` - Google Gemini AI API key
- `EMAIL_*` - Email service configuration

### Frontend Setup

```bash
cd Frontendnya
npm install
npx expo start
```

**For Android Build:**
```bash
eas build --platform android --profile production
```

## 🛠️ Technology Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Authentication:** Passport.js (Local + Google OAuth)
- **File Upload:** Cloudinary
- **AI Integration:** Google Gemini API
- **Speech Processing:** OpenAI Whisper (Python service)

### Frontend
- **Framework:** React Native 0.76.5
- **SDK:** Expo 54
- **Navigation:** React Navigation 7
- **State Management:** React Hooks + Async Storage
- **UI:** Custom components with Expo Blur & Linear Gradient
- **Speech Recognition:** Expo Speech Recognition

### AI Service
- **Language:** Python 3.11
- **Speech-to-Text:** OpenAI Whisper
- **Framework:** Flask/FastAPI
- **Deployment:** Docker container

## 🌐 Deployment

### Backend → Railway
1. Connect this repo to Railway
2. Set root directory: `Backendnya`
3. Configure environment variables
4. Deploy automatically on push to `main` branch

**Railway Configuration:**
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd Backendnya && npm install"
  },
  "deploy": {
    "startCommand": "cd Backendnya && npm start",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### Frontend → EAS Build (Expo)
1. Configure EAS in `Frontendnya/eas.json`
2. Build APK:
   ```bash
   cd Frontendnya
   eas build --platform android --profile production
   ```
3. Submit to Google Play Store (optional):
   ```bash
   eas submit --platform android
   ```

## 📱 Features

### User Features
- 🔐 User authentication (Email + Google OAuth)
- 📚 Interactive language learning materials
- 🎤 Speech recognition and pronunciation practice
- 📊 Progress tracking and statistics
- ⭐ Achievement system
- 📝 Learning history

### Technical Features
- 🔒 JWT-based authentication
- 🌐 RESTful API architecture
- 📤 File upload with Cloudinary
- 🤖 AI-powered feedback using Gemini
- 🎯 Real-time speech scoring
- 📧 Email verification system
- 🔄 Rate limiting for API protection

## 🔧 Development

### Run Backend in Development
```bash
cd Backendnya
npm run dev  # Uses nodemon for auto-reload
```

### Run Frontend in Development
```bash
cd Frontendnya
expo start
# Press 'a' for Android
# Press 'i' for iOS
```

### Testing
```bash
# Backend tests
cd Backendnya
npm test

# Test specific modules
node tests/test-db.js
node tests/test-email-registration.js
```

## 📋 Environment Variables

### Backend (.env)
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
GEMINI_API_KEY=...
EMAIL_USER=...
EMAIL_PASS=...
FRONTEND_URL=https://your-app-url.com
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### Frontend (.env)
```env
API_URL=https://your-backend-url.railway.app
EXPO_PUBLIC_API_URL=https://your-backend-url.railway.app
```

## 🐛 Troubleshooting

### Kotlin/KSP Build Error (Android)
If you encounter: `Can't find KSP version for Kotlin version '1.9.24'`

**Solution:** Already fixed in this repo!
- ✅ `android/settings.gradle` declares Kotlin 2.0.21
- ✅ `android/build.gradle` forces Kotlin 2.0.21 across modules
- ✅ `android/gradle.properties` sets `kotlinVersion=2.0.21`

### MongoDB Connection Issues
- Verify `MONGODB_URI` is correct
- Check IP whitelist in MongoDB Atlas
- Test connection: `node tests/test-db.js`

### Expo Build Fails
- Clear cache: `eas build --clear-cache`
- Verify `app.json` configuration
- Check EAS project ID is correct

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Team

Developed by IPPL Team for LinguaKu Language Learning Platform.

## 📞 Support

For issues and questions:
- Create an issue in this repository
- Contact: [Your contact information]

---

**Made with ❤️ for language learners worldwide**
