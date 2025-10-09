/**
 * Environment Configuration
 * Validates and exports environment variables
 */

export const ENV = {
  // Firebase
  FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,

  // Anthropic
  ANTHROPIC_API_KEY: import.meta.env.VITE_ANTHROPIC_API_KEY,
}

/**
 * Check if Firebase is configured
 */
export const isFirebaseConfigured = (): boolean => {
  return !!(
    ENV.FIREBASE_API_KEY &&
    ENV.FIREBASE_AUTH_DOMAIN &&
    ENV.FIREBASE_PROJECT_ID &&
    ENV.FIREBASE_STORAGE_BUCKET &&
    ENV.FIREBASE_MESSAGING_SENDER_ID &&
    ENV.FIREBASE_APP_ID
  )
}

/**
 * Check if Anthropic is configured
 */
export const isAnthropicConfigured = (): boolean => {
  return !!ENV.ANTHROPIC_API_KEY
}

/**
 * Get missing environment variables
 */
export const getMissingEnvVars = (): string[] => {
  const missing: string[] = []

  if (!ENV.FIREBASE_API_KEY) missing.push('VITE_FIREBASE_API_KEY')
  if (!ENV.FIREBASE_AUTH_DOMAIN) missing.push('VITE_FIREBASE_AUTH_DOMAIN')
  if (!ENV.FIREBASE_PROJECT_ID) missing.push('VITE_FIREBASE_PROJECT_ID')
  if (!ENV.FIREBASE_STORAGE_BUCKET) missing.push('VITE_FIREBASE_STORAGE_BUCKET')
  if (!ENV.FIREBASE_MESSAGING_SENDER_ID) missing.push('VITE_FIREBASE_MESSAGING_SENDER_ID')
  if (!ENV.FIREBASE_APP_ID) missing.push('VITE_FIREBASE_APP_ID')
  if (!ENV.ANTHROPIC_API_KEY) missing.push('VITE_ANTHROPIC_API_KEY')

  return missing
}
