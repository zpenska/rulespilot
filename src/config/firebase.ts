import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { ENV, getMissingEnvVars } from './env'

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

// Warn if environment variables are missing
const missingVars = getMissingEnvVars()
if (missingVars.length > 0) {
  console.warn(
    `Missing environment variables: ${missingVars.join(', ')}\n` +
    'Firebase features will not work properly. Please add them in Vercel dashboard.'
  )
}

// Initialize Firebase (will use demo values if env vars missing)
const app = initializeApp(firebaseConfig)
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null
const db = getFirestore(app)
const auth = getAuth(app)

if (missingVars.length === 0) {
  console.log('Firebase initialized successfully')
}

export { analytics, db, auth }
export default app
