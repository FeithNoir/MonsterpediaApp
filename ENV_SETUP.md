# Environment Variables Setup Guide

This project uses environment variables to store sensitive Firebase configuration.

## Setup Instructions

1. **Copy the template file**:
   ```bash
   cp .env.template .env
   ```

2. **Fill in your Firebase credentials** in the `.env` file:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings > General
   - Scroll down to "Your apps" section
   - Copy the configuration values

3. **Never commit `.env`** to version control:
   - The `.env` file is already in `.gitignore`
   - Only commit `.env.template` with placeholder values

## Important Notes

### For Development
- The `.env` file is used locally during development
- Angular doesn't natively support `.env` files
- You'll need to manually copy values to `src/environments/environment.development.ts`

### For Production (GitHub Pages)

> ⚠️ **CRITICAL**: Environment variables in frontend applications are **NOT SECRET**!

When you build your Angular app for production:
```bash
ng build --configuration production
```

The Firebase configuration gets compiled into the JavaScript bundle and is **visible to anyone** who inspects your website's code.

**This is normal and expected** for frontend applications. Firebase security is handled by:
1. **Firebase Security Rules** (server-side)
2. **API Key restrictions** in Google Cloud Console
3. **Authorized domains** in Firebase Console

### Recommended Deployment

Instead of GitHub Pages, consider using **Firebase Hosting**:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase Hosting
firebase init hosting

# Build and deploy
ng build --configuration production
firebase deploy
```

**Benefits of Firebase Hosting**:
- Automatic SSL certificates
- CDN distribution
- Easy integration with Firebase services
- Custom domain support
- Rollback capabilities

### GitHub Pages Limitations

If you still want to use GitHub Pages:
1. Build your app: `ng build --configuration production`
2. The `dist/` folder contains your static files
3. Deploy the contents of `dist/monsterpedia-app/` to GitHub Pages
4. Your Firebase config will be visible in the compiled JavaScript (this is OK)

**Security is maintained through**:
- Firebase Security Rules (protect your database)
- Firebase Authentication (verify users)
- API restrictions in Google Cloud Console

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `FIREBASE_API_KEY` | Firebase API key | `AIzaSyC...` |
| `FIREBASE_AUTH_DOMAIN` | Authentication domain | `myapp.firebaseapp.com` |
| `FIREBASE_PROJECT_ID` | Project identifier | `myapp-12345` |
| `FIREBASE_STORAGE_BUCKET` | Storage bucket URL | `myapp.appspot.com` |
| `FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID | `123456789` |
| `FIREBASE_APP_ID` | App identifier | `1:123:web:abc` |
| `PRODUCTION` | Production flag | `true` or `false` |

## Troubleshooting

**Q: My app can't connect to Firebase**
- Check that all values in `.env` are correct
- Verify values are copied to `src/environments/environment.development.ts`
- Ensure Firebase project is active

**Q: Is it safe to deploy with Firebase config visible?**
- Yes! Frontend apps always expose API keys
- Security is enforced by Firebase Security Rules
- Restrict your API key in Google Cloud Console

**Q: How do I protect my database?**
- Implement Firebase Security Rules
- Validate user authentication
- Check user roles and permissions
- See the project's `walkthrough.md` for security examples
