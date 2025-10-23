import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { PullQueueConfig } from '../types/rules'
import { DEFAULT_PULL_QUEUE_CONFIG } from '../config/pullQueueConfig'

const PULL_QUEUE_CONFIG_DOC = 'pullQueueConfig'
const CONFIG_COLLECTION = 'config'
const LOCAL_STORAGE_KEY = 'pullQueueConfig'

/**
 * Get Pull Queue Configuration
 * Tries Firebase first, falls back to localStorage, then defaults
 */
export async function getPullQueueConfig(): Promise<PullQueueConfig> {
  // Try Firebase first
  if (db) {
    try {
      const docRef = doc(db, CONFIG_COLLECTION, PULL_QUEUE_CONFIG_DOC)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return docSnap.data() as PullQueueConfig
      }
    } catch (error) {
      console.warn('Failed to load config from Firebase, trying localStorage:', error)
    }
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.warn('Failed to load config from localStorage:', error)
  }

  // Return default config
  return DEFAULT_PULL_QUEUE_CONFIG
}

/**
 * Save Pull Queue Configuration
 * Saves to both Firebase and localStorage for redundancy
 */
export async function savePullQueueConfig(config: PullQueueConfig): Promise<void> {
  // Save to localStorage first (always works)
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config))
  } catch (error) {
    console.error('Failed to save config to localStorage:', error)
  }

  // Try to save to Firebase
  if (db) {
    try {
      const docRef = doc(db, CONFIG_COLLECTION, PULL_QUEUE_CONFIG_DOC)
      await setDoc(docRef, config)
    } catch (error) {
      console.error('Failed to save config to Firebase:', error)
      throw error
    }
  }
}

/**
 * Reset Pull Queue Configuration to defaults
 */
export async function resetPullQueueConfig(): Promise<void> {
  await savePullQueueConfig(DEFAULT_PULL_QUEUE_CONFIG)
}
