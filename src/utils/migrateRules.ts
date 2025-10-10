/**
 * Utility script to add ruleType field to existing rules in Firebase
 * Run this once to migrate your existing rules
 */

import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

export async function migrateRulesToAddRuleType() {
  if (!db) {
    console.error('Firebase is not configured')
    return
  }

  try {
    const rulesRef = collection(db, 'rules')
    const snapshot = await getDocs(rulesRef)

    let updated = 0
    let skipped = 0

    console.log(`Found ${snapshot.docs.length} rules to process...`)

    for (const docSnapshot of snapshot.docs) {
      const ruleData = docSnapshot.data()

      // Skip if already has ruleType
      if (ruleData.ruleType) {
        skipped++
        continue
      }

      // Add ruleType='workflow' to all existing rules without it
      const docRef = doc(db, 'rules', docSnapshot.id)
      await updateDoc(docRef, {
        ruleType: 'workflow'
      })

      updated++
      console.log(`Updated rule ${docSnapshot.id} with ruleType='workflow'`)
    }

    console.log(`\nMigration complete!`)
    console.log(`Updated: ${updated} rules`)
    console.log(`Skipped: ${skipped} rules (already had ruleType)`)

    return { updated, skipped }
  } catch (error) {
    console.error('Error migrating rules:', error)
    throw error
  }
}
