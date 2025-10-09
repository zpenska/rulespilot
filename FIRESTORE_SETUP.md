# Firestore Setup Guide

## Problem: 400 Errors from Firestore

The 400 errors you're seeing mean Firestore security rules are blocking access. Here's how to fix it:

## Step 1: Enable Firestore in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **rulesp**
3. Click **Firestore Database** in the left sidebar
4. If you see "Create database":
   - Click **Create database**
   - Choose **Start in production mode** or **Test mode**
   - Select your region (preferably same as your Vercel deployment)

## Step 2: Update Firestore Security Rules

The app needs to read/write to two collections: `rules` and `dictionaries`.

### Option A: Use Firebase Console UI

1. In Firebase Console → Firestore Database
2. Click the **Rules** tab
3. Replace the rules with the content from `firestore.rules` in this repo
4. Click **Publish**

### Option B: Use Firebase CLI

```bash
# Install Firebase CLI if you haven't
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firestore (if not already done)
firebase init firestore

# Deploy the rules
firebase deploy --only firestore:rules
```

## Step 3: Verify Firestore is Working

1. Refresh your app at https://rulespilot.vercel.app
2. The warning banner should disappear
3. Dictionaries will auto-upload on first load
4. Create a test rule and verify it saves

## Dictionaries Auto-Upload

The app automatically uploads dictionaries to Firestore on first load:

1. **On app startup**, it checks if Firestore has dictionaries
2. **If empty**, it loads from CSV files in `/public/dictionaries/`
3. **Auto-uploads** to Firestore for persistence
4. **Caches** in memory for fast lookups

### CSV Files Currently Loaded:
- `/public/dictionaries/states.csv`
- `/public/dictionaries/specialties.csv`
- (Add more CSV files as needed)

### Manual Dictionary Upload (if needed)

If you need to manually re-upload dictionaries:

```typescript
// In browser console on your app:
import { refreshDictionaries } from './src/services/dictionaryService'
await refreshDictionaries()
console.log('Dictionaries uploaded to Firestore!')
```

Or create a one-time script:

```bash
# Create upload script
cat > uploadDictionaries.ts << 'EOF'
import { refreshDictionaries } from './src/services/dictionaryService'

async function upload() {
  try {
    await refreshDictionaries()
    console.log('✅ Dictionaries uploaded successfully')
  } catch (error) {
    console.error('❌ Upload failed:', error)
  }
}

upload()
EOF

# Run it
npx tsx uploadDictionaries.ts
```

## Step 4: Production Security Rules (Important!)

The current `firestore.rules` allows all access (`if true`). **Update this before production:**

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Only authenticated users can read/write
    match /rules/{ruleId} {
      allow read, write: if request.auth != null;
    }

    match /dictionaries/{dictionaryId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

## Troubleshooting

### Still seeing 400 errors?

1. **Check Firestore is enabled**: Firebase Console → Firestore Database → should show collections, not "Create database"
2. **Check rules are deployed**: Rules tab should show your custom rules
3. **Check browser console**: Look for specific error messages
4. **Try incognito mode**: Clear cache and try again

### Dictionaries not loading?

1. **Check CSV files exist**: `/public/dictionaries/*.csv`
2. **Check browser console**: Look for "Dictionaries initialized" or errors
3. **Check Firestore**: Firebase Console → Firestore Database → should see `dictionaries` collection
4. **Manual refresh**: Run `refreshDictionaries()` in browser console

### Environment Variables

Verify all Firebase env vars are set in Vercel:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID` (should be "rulesp")
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

## Next Steps

1. Fix Firestore security rules (see Step 2 above)
2. Refresh the app - dictionaries will auto-upload
3. Create a test rule to verify persistence
4. Update security rules for production (Step 4)
