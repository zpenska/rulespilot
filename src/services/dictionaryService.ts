import {
  collection,
  doc,
  setDoc,
  getDocs,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { DictionaryItem, Dictionary } from '../types/rules'
import { loadAllDictionaries } from '../utils/csvParser'

const DICTIONARIES_COLLECTION = 'dictionaries'

/**
 * Dictionary Service
 * Handles loading, caching, and retrieving dictionary data
 */
class DictionaryService {
  private cache: Dictionary = {}
  private isInitialized = false

  /**
   * Initialize dictionaries - load from Firebase or CSV
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Try to load from Firebase first
      const hasData = await this.loadFromFirebase()

      if (!hasData) {
        // If no data in Firebase, load from CSV and upload
        console.log('No dictionaries in Firebase, loading from CSV...')
        await this.loadFromCSVAndUpload()
      }

      this.isInitialized = true
    } catch (error) {
      console.error('Error initializing dictionaries:', error)
      // Fallback to CSV only
      await this.loadFromCSVOnly()
    }
  }

  /**
   * Load dictionaries from Firebase
   */
  private async loadFromFirebase(): Promise<boolean> {
    if (!db) {
      console.warn('Firebase not configured, skipping Firebase load')
      return false
    }

    try {
      const dictRef = collection(db, DICTIONARIES_COLLECTION)
      const snapshot = await getDocs(dictRef)

      if (snapshot.empty) {
        return false
      }

      snapshot.docs.forEach((doc) => {
        this.cache[doc.id] = doc.data().items as DictionaryItem[]
      })

      return true
    } catch (error) {
      console.error('Error loading from Firebase:', error)
      return false
    }
  }

  /**
   * Load from CSV and upload to Firebase
   */
  private async loadFromCSVAndUpload(): Promise<void> {
    const dictionaries = await loadAllDictionaries()

    // Upload to Firebase
    const uploadPromises = Object.entries(dictionaries).map(async ([key, items]) => {
      const docRef = doc(db, DICTIONARIES_COLLECTION, key)
      await setDoc(docRef, {
        key,
        items,
        updatedAt: new Date().toISOString(),
      })
    })

    await Promise.all(uploadPromises)

    this.cache = dictionaries
  }

  /**
   * Load from CSV only (fallback)
   */
  private async loadFromCSVOnly(): Promise<void> {
    this.cache = await loadAllDictionaries()
  }

  /**
   * Get dictionary items by key
   */
  async getDictionary(key: string): Promise<DictionaryItem[]> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    return this.cache[key] || []
  }

  /**
   * Get active dictionary items by key
   */
  async getActiveDictionary(key: string): Promise<DictionaryItem[]> {
    const items = await this.getDictionary(key)
    return items.filter((item) => item.active)
  }

  /**
   * Get all dictionaries
   */
  async getAllDictionaries(): Promise<Dictionary> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    return this.cache
  }

  /**
   * Refresh dictionaries from CSV and update Firebase
   */
  async refresh(): Promise<void> {
    await this.loadFromCSVAndUpload()
    this.isInitialized = true
  }

  /**
   * Add or update a dictionary item
   */
  async updateDictionary(key: string, items: DictionaryItem[]): Promise<void> {
    const docRef = doc(db, DICTIONARIES_COLLECTION, key)
    await setDoc(docRef, {
      key,
      items,
      updatedAt: new Date().toISOString(),
    })

    this.cache[key] = items
  }

  /**
   * Get dictionary options for a field
   * Returns formatted options for dropdowns
   */
  async getDictionaryOptions(
    dictionaryKey: string
  ): Promise<Array<{ value: string; label: string }>> {
    const items = await getActiveDictionary(dictionaryKey)
    return items.map((item) => ({
      value: item.code,
      label: item.description || item.code,
    }))
  }

  /**
   * Search dictionary items
   */
  async searchDictionary(
    key: string,
    searchTerm: string
  ): Promise<DictionaryItem[]> {
    const items = await getDictionary(key)
    const term = searchTerm.toLowerCase()

    return items.filter(
      (item) =>
        item.code.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term)
    )
  }
}

// Export singleton instance
const dictionaryService = new DictionaryService()

// Export convenience functions
export const initializeDictionaries = () => dictionaryService.initialize()
export const getDictionary = (key: string) => dictionaryService.getDictionary(key)
export const getActiveDictionary = (key: string) =>
  dictionaryService.getActiveDictionary(key)
export const getAllDictionaries = () => dictionaryService.getAllDictionaries()
export const refreshDictionaries = () => dictionaryService.refresh()
export const updateDictionary = (key: string, items: DictionaryItem[]) =>
  dictionaryService.updateDictionary(key, items)
export const getDictionaryOptions = (dictionaryKey: string) =>
  dictionaryService.getDictionaryOptions(dictionaryKey)
export const searchDictionary = (key: string, searchTerm: string) =>
  dictionaryService.searchDictionary(key, searchTerm)

export default dictionaryService
