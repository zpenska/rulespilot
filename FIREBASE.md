# Firebase Integration Guide

## Overview

Rules Pilot uses Firebase for:
- **Firestore** - Cloud database for storing rules and rule groups
- **Authentication** - User authentication and management
- **Analytics** - Usage tracking and insights

## Firebase Project Setup

Your Firebase project is already configured:
- **Project ID:** `rulesp`
- **Auth Domain:** `rulesp.firebaseapp.com`
- **Storage Bucket:** `rulesp.firebasestorage.app`

## 🔥 Firestore Database Setup

### 1. Enable Firestore

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `rulesp`
3. Navigate to **Firestore Database**
4. Click **Create database**
5. Choose **Start in test mode** (for development)
6. Select your region (choose closest to your users)

### 2. Security Rules (Development)

For development, use these rules (⚠️ **NOT for production**):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all documents (DEVELOPMENT ONLY)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 3. Security Rules (Production)

For production, use authenticated rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Rules collection - authenticated users only
    match /rules/{ruleId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // Rule groups - authenticated users only
    match /ruleGroups/{groupId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### 4. Create Collections

Firestore collections will be created automatically when you add your first rule. The app uses:
- `rules` - Stores individual rules
- `ruleGroups` - Stores rule groups

## 🔐 Authentication Setup

### 1. Enable Email/Password Authentication

1. In Firebase Console → **Authentication**
2. Click **Get started**
3. Go to **Sign-in method** tab
4. Enable **Email/Password**
5. Save

### 2. Create Test User (Optional)

```bash
# In Firebase Console → Authentication → Users
# Click "Add user"
# Email: test@example.com
# Password: TestPassword123!
```

## 📊 Analytics Setup

Analytics is automatically initialized when the app runs in the browser.

To view analytics:
1. Firebase Console → **Analytics**
2. View Dashboard, Events, and User properties

## 💻 Using Firebase in Your Code

### Import Firebase Services

```typescript
import { db, auth, analytics } from './config/firebase'
```

### Using Firestore

```typescript
import { rulesService } from './services/firebase/firestore'

// Create a rule
const newRule = await rulesService.createRule({
  name: 'My Rule',
  description: 'Rule description',
  conditions: [],
  actions: [],
  enabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
})

// Get all rules
const rules = await rulesService.getAllRules()

// Update a rule
await rulesService.updateRule(ruleId, { name: 'Updated Name' })

// Delete a rule
await rulesService.deleteRule(ruleId)
```

### Real-time Sync with Hook

```typescript
import { useFirebaseRules } from './hooks/useFirebaseRules'

function MyComponent() {
  // Automatically syncs Firestore with Zustand store
  useFirebaseRules()

  const rules = useRulesStore((state) => state.rules)
  // Rules are automatically updated in real-time!
}
```

### Using Authentication

```typescript
import { signIn, signUp, signOut } from './services/firebase/auth'

// Sign up
const { user, error } = await signUp('email@example.com', 'password')

// Sign in
const { user, error } = await signIn('email@example.com', 'password')

// Sign out
await signOut()
```

## 🌐 Environment Variables

All Firebase config is in `.env`:

```bash
VITE_FIREBASE_API_KEY=AIzaSyAzVZftNHIhLw2MB2GKRqGz-EO9WJrAucY
VITE_FIREBASE_AUTH_DOMAIN=rulesp.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=rulesp
VITE_FIREBASE_STORAGE_BUCKET=rulesp.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=584903112085
VITE_FIREBASE_APP_ID=1:584903112085:web:4d3a6d1c455424bb14329c
VITE_FIREBASE_MEASUREMENT_ID=G-5EZQ2SBZRL
```

For Vercel deployment, add these to your environment variables.

## 📁 File Structure

```
src/
├── config/
│   └── firebase.ts          # Firebase initialization
├── services/
│   └── firebase/
│       ├── firestore.ts     # Firestore CRUD operations
│       └── auth.ts          # Authentication helpers
├── hooks/
│   └── useFirebaseRules.ts  # Real-time sync hook
└── store/
    └── rulesStore.ts        # Zustand store (syncs with Firestore)
```

## 🚀 Getting Started

1. **Enable Firestore** in Firebase Console
2. **Set test mode** security rules
3. **Enable Email/Password** authentication
4. **Start your app:** `npm run dev`
5. **Create your first rule** - it will automatically save to Firestore!

## 🔍 Debugging

### Check Firestore Console
View your data in real-time:
- Firebase Console → Firestore Database → Data tab

### Check Authentication
View users:
- Firebase Console → Authentication → Users tab

### Check Analytics
View events:
- Firebase Console → Analytics → Events tab

## 📚 Resources

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firebase Analytics](https://firebase.google.com/docs/analytics)
- [Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

## ⚠️ Important Notes

1. **Test Mode Security:** Currently using test mode - anyone can read/write. Update security rules for production!
2. **API Keys:** Firebase API keys in `.env` are safe to expose (they're meant for client-side use)
3. **Billing:** Firebase free tier is generous, but monitor usage in production
4. **Indexes:** Firestore will prompt you to create indexes if needed - follow the console links

## 🔒 Production Checklist

- [ ] Update Firestore security rules to require authentication
- [ ] Enable additional auth providers if needed (Google, GitHub, etc.)
- [ ] Set up Firebase billing alerts
- [ ] Create Firestore indexes for complex queries
- [ ] Enable App Check for additional security
- [ ] Review and optimize security rules
- [ ] Set up backup strategy for Firestore data
