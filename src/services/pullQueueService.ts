import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { PullQueueConfig } from '../types/rules'
import { DEFAULT_PULL_QUEUE_CONFIG } from '../config/pullQueueConfig'

const PULL_QUEUE_CONFIG_DOC = 'pullQueueConfig'
const CONFIG_COLLECTION = 'config'
const LOCAL_STORAGE_KEY = 'pullQueueConfig'

/**
 * Migrate old config format to new format
 * Old format: departmentOrder: string[]
 * New format: departmentOrder: string[][]
 */
function migrateConfig(config: any): PullQueueConfig {
  // Check if departmentOrder needs migration
  if (config.departmentOrder && Array.isArray(config.departmentOrder)) {
    const firstItem = config.departmentOrder[0]

    // If first item is a string, it's the old format - migrate it
    if (typeof firstItem === 'string') {
      console.log('Migrating old Pull Queue config format to new format')
      return {
        ...config,
        departmentOrder: config.departmentOrder.map((dept: string) => [dept]), // Wrap each dept in an array
      }
    }
  }

  return config as PullQueueConfig
}

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
        const config = migrateConfig(docSnap.data())
        // If migrated, save the new format back
        if (JSON.stringify(config) !== JSON.stringify(docSnap.data())) {
          await savePullQueueConfig(config)
        }
        return config
      }
    } catch (error) {
      console.warn('Failed to load config from Firebase, trying localStorage:', error)
    }
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (stored) {
      const config = migrateConfig(JSON.parse(stored))
      // If migrated, save the new format back
      if (JSON.stringify(config) !== stored) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config))
      }
      return config
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
      console.warn('Failed to save Pull Queue config to Firebase (saved to localStorage):', error)
      // Don't throw - allow graceful degradation to localStorage
    }
  }
}

/**
 * Reset Pull Queue Configuration to defaults
 */
export async function resetPullQueueConfig(): Promise<void> {
  await savePullQueueConfig(DEFAULT_PULL_QUEUE_CONFIG)
}
