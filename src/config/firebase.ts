import { initializeApp, FirebaseApp } from 'firebase/app'
import { getAnalytics, Analytics } from 'firebase/analytics'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getAuth, Auth } from 'firebase/auth'
import { ENV, getMissingEnvVars } from './env'

// Check if Firebase is properly configured
const missingVars = getMissingEnvVars()
const isConfigured = missingVars.length === 0

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: ENV.FIREBASE_API_KEY || 'demo-api-key',
  authDomain: ENV.FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: ENV.FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: ENV.FIREBASE_STORAGE_BUCKET || 'demo.appspot.com',
  messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: ENV.FIREBASE_APP_ID || '1:123456789:web:abcdef',
  measurementId: ENV.FIREBASE_MEASUREMENT_ID || 'G-MEASUREMENT',
}

// Only initialize if properly configured, otherwise set to null
let app: FirebaseApp | null = null
let analytics: Analytics | null = null
let db: Firestore | null = null
let auth: Auth | null = null

if (isConfigured) {
  app = initializeApp(firebaseConfig)
  analytics = typeof window !== 'undefined' ? getAnalytics(app) : null
  db = getFirestore(app)
  auth = getAuth(app)
  console.log('Firebase initialized successfully')
} else {
  console.warn(
    `Firebase not configured. Missing: ${missingVars.join(', ')}\n` +
    'App will run in demo mode without persistence. Add Firebase env vars in Vercel to enable database features.'
  )
}

export { analytics, db, auth, isConfigured }
export default app
