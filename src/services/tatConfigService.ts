import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { TATConfig } from '../types/rules'
import { DEFAULT_TAT_CONFIG } from '../config/tatConfig'

const TAT_CONFIG_DOC = 'tatConfig'
const CONFIG_COLLECTION = 'config'
const LOCAL_STORAGE_KEY = 'tatConfig'

/**
 * Get TAT Configuration
 * Tries Firebase first, falls back to localStorage, then defaults
 */
export async function getTATConfig(): Promise<TATConfig> {
  // Try Firebase first
  if (db) {
    try {
      const docRef = doc(db, CONFIG_COLLECTION, TAT_CONFIG_DOC)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return docSnap.data() as TATConfig
      }
    } catch (error) {
      console.warn('Failed to load TAT config from Firebase, trying localStorage:', error)
    }
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.warn('Failed to load TAT config from localStorage:', error)
  }

  // Return default config
  return DEFAULT_TAT_CONFIG
}

/**
 * Save TAT Configuration
 * Saves to both Firebase and localStorage for redundancy
 */
export async function saveTATConfig(config: TATConfig): Promise<void> {
  // Save to localStorage first (always works)
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config))
  } catch (error) {
    console.error('Failed to save TAT config to localStorage:', error)
  }

  // Try to save to Firebase
  if (db) {
    try {
      const docRef = doc(db, CONFIG_COLLECTION, TAT_CONFIG_DOC)
      await setDoc(docRef, config)
    } catch (error) {
      console.error('Failed to save TAT config to Firebase:', error)
      throw error
    }
  }
}

/**
 * Reset TAT Configuration to defaults
 */
export async function resetTATConfig(): Promise<void> {
  await saveTATConfig(DEFAULT_TAT_CONFIG)
}
