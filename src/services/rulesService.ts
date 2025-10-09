import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { Rule, RuleExport, AutoWorkflowRulesExport } from '../types/rules'
import { nanoid } from 'nanoid'

const RULES_COLLECTION = 'rules'

/**
 * Rules Service
 * Handles all CRUD operations for rules
 */

/**
 * Generate a unique rule code
 */
const generateRuleCode = (): string => {
  return `RULE${nanoid(8).toUpperCase()}`
}

/**
 * Remove undefined fields from an object
 */
const removeUndefinedFields = <T extends Record<string, any>>(obj: T): Record<string, any> => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value
    }
    return acc
  }, {} as Record<string, any>)
}

/**
 * Create a new rule
 */
export const createRule = async (rule: Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>): Promise<Rule> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please add Firebase environment variables.')
  }

  const id = nanoid()
  const now = new Date().toISOString()

  const newRule: Rule = {
    ...rule,
    id,
    code: rule.code || generateRuleCode(),
    createdAt: now,
    updatedAt: now,
  }

  // Remove undefined fields before saving to Firestore
  const cleanedRule = removeUndefinedFields(newRule)

  const docRef = doc(db, RULES_COLLECTION, id)
  await setDoc(docRef, cleanedRule)

  return newRule
}

/**
 * Get a rule by ID
 */
export const getRule = async (id: string): Promise<Rule | null> => {
  const docRef = doc(db, RULES_COLLECTION, id)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  return docSnap.data() as Rule
}

/**
 * Get all rules
 */
export const getAllRules = async (): Promise<Rule[]> => {
  if (!db) {
    console.warn('Firebase not configured, returning empty rules array')
    return []
  }

  const rulesRef = collection(db, RULES_COLLECTION)
  const q = query(rulesRef, orderBy('updatedAt', 'desc'))
  const snapshot = await getDocs(q)

  return snapshot.docs.map((doc) => doc.data() as Rule)
}

/**
 * Get active rules
 */
export const getActiveRules = async (): Promise<Rule[]> => {
  const rulesRef = collection(db, RULES_COLLECTION)
  const q = query(
    rulesRef,
    where('status', '==', 'active'),
    orderBy('weight', 'desc'),
    orderBy('updatedAt', 'desc')
  )
  const snapshot = await getDocs(q)

  return snapshot.docs.map((doc) => doc.data() as Rule)
}

/**
 * Get inactive rules
 */
export const getInactiveRules = async (): Promise<Rule[]> => {
  const rulesRef = collection(db, RULES_COLLECTION)
  const q = query(
    rulesRef,
    where('status', '==', 'inactive'),
    orderBy('updatedAt', 'desc')
  )
  const snapshot = await getDocs(q)

  return snapshot.docs.map((doc) => doc.data() as Rule)
}

/**
 * Update a rule
 */
export const updateRule = async (id: string, updates: Partial<Rule>): Promise<void> => {
  const docRef = doc(db, RULES_COLLECTION, id)

  const cleanedUpdates = removeUndefinedFields({
    ...updates,
    updatedAt: new Date().toISOString(),
  })

  await setDoc(docRef, cleanedUpdates, { merge: true })
}

/**
 * Delete a rule
 */
export const deleteRule = async (id: string): Promise<void> => {
  const docRef = doc(db, RULES_COLLECTION, id)
  await deleteDoc(docRef)
}

/**
 * Clone a rule
 */
export const cloneRule = async (id: string): Promise<Rule> => {
  const original = await getRule(id)

  if (!original) {
    throw new Error('Rule not found')
  }

  const clonedRule: Omit<Rule, 'id' | 'createdAt' | 'updatedAt'> = {
    ...original,
    ruleDesc: `${original.ruleDesc} (Copy)`,
    code: generateRuleCode(),
    status: 'inactive', // Cloned rules start as inactive
  }

  return createRule(clonedRule)
}

/**
 * Bulk update rules status
 */
export const bulkUpdateStatus = async (
  ruleIds: string[],
  status: 'active' | 'inactive'
): Promise<void> => {
  const batch = writeBatch(db)
  const now = new Date().toISOString()

  ruleIds.forEach((id) => {
    const docRef = doc(db, RULES_COLLECTION, id)
    batch.update(docRef, {
      status,
      updatedAt: now,
    })
  })

  await batch.commit()
}

/**
 * Bulk delete rules
 */
export const bulkDeleteRules = async (ruleIds: string[]): Promise<void> => {
  const batch = writeBatch(db)

  ruleIds.forEach((id) => {
    const docRef = doc(db, RULES_COLLECTION, id)
    batch.delete(docRef)
  })

  await batch.commit()
}

/**
 * Export rule to JSON format (without UI metadata)
 * Ensures correct field ordering for JSON output
 */
export const exportRuleToJSON = (rule: Rule): RuleExport => {
  // Reorder standardFieldCriteria to match required JSON format
  const standardFieldCriteria = rule.standardFieldCriteria.map((criteria) => {
    const ordered: any = {
      operator: criteria.operator,
      field: criteria.field,
    }

    // Add providerRole if present (must come before values)
    if (criteria.providerRole) {
      ordered.providerRole = criteria.providerRole
    }

    // Add alternateIdType if present (must come before values)
    if (criteria.alternateIdType) {
      ordered.alternateIdType = criteria.alternateIdType
    }

    // Add values last
    ordered.values = criteria.values

    return ordered
  })

  // Reorder customFieldCriteria to match required JSON format
  const customFieldCriteria = rule.customFieldCriteria?.map((criteria) => ({
    operator: criteria.operator,
    association: criteria.association,
    templateId: criteria.templateId,
    values: criteria.values,
  }))

  const exported: RuleExport = {
    ruleDesc: rule.ruleDesc,
    standardFieldCriteria,
    isActive: rule.status === 'active',
    weight: rule.weight ?? 100, // Default weight to 100 if not set
  }

  // Only include customFieldCriteria if it exists and has items
  if (customFieldCriteria && customFieldCriteria.length > 0) {
    exported.customFieldCriteria = customFieldCriteria
  }

  // Only include actions if they exist
  if (rule.actions) {
    exported.actions = rule.actions
  }

  return exported
}

/**
 * Export all rules to JSON
 */
export const exportAllRulesToJSON = async (): Promise<RuleExport[]> => {
  const rules = await getAllRules()
  return rules.map(exportRuleToJSON)
}

/**
 * Export active rules to JSON
 */
export const exportActiveRulesToJSON = async (): Promise<RuleExport[]> => {
  const rules = await getActiveRules()
  return rules.map(exportRuleToJSON)
}

/**
 * Export rules in AUTO_WORKFLOW_RULES format
 */
export const exportAsAutoWorkflowRules = async (
  rules?: Rule[]
): Promise<AutoWorkflowRulesExport> => {
  const rulesToExport = rules || (await getActiveRules())

  return {
    type: 'AUTO_WORKFLOW_RULES',
    rules: rulesToExport.map(exportRuleToJSON),
  }
}

/**
 * Import rules from JSON
 */
export const importRulesFromJSON = async (jsonData: RuleExport[]): Promise<Rule[]> => {
  const importedRules: Rule[] = []

  for (const ruleData of jsonData) {
    try {
      // Convert RuleExport to Rule format
      const ruleToCreate: Partial<Rule> = {
        ruleDesc: ruleData.ruleDesc,
        standardFieldCriteria: ruleData.standardFieldCriteria || [],
        customFieldCriteria: ruleData.customFieldCriteria || [],
        weight: ruleData.weight,
        status: ruleData.isActive ? 'active' : 'inactive',
        actions: ruleData.actions,
      }

      // Create the rule
      const createdRule = await createRule(ruleToCreate as Rule)
      importedRules.push(createdRule)
    } catch (error) {
      console.error('Error importing rule:', ruleData.ruleDesc, error)
      // Continue with other rules even if one fails
    }
  }

  return importedRules
}

/**
 * Search rules
 */
export const searchRules = async (searchTerm: string): Promise<Rule[]> => {
  const allRules = await getAllRules()
  const term = searchTerm.toLowerCase()

  return allRules.filter(
    (rule) =>
      rule.code?.toLowerCase().includes(term) ||
      rule.ruleDesc.toLowerCase().includes(term) ||
      rule.category?.toLowerCase().includes(term)
  )
}

/**
 * Subscribe to rules changes
 */
export const subscribeToRules = (
  callback: (rules: Rule[]) => void,
  statusFilter?: 'active' | 'inactive'
): (() => void) => {
  if (!db) {
    console.warn('Firebase not configured, returning empty rules')
    callback([])
    return () => {}
  }

  const rulesRef = collection(db, RULES_COLLECTION)

  let q = query(rulesRef, orderBy('updatedAt', 'desc'))

  if (statusFilter) {
    q = query(rulesRef, where('status', '==', statusFilter), orderBy('updatedAt', 'desc'))
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const rules = snapshot.docs.map((doc) => doc.data() as Rule)
      callback(rules)
    },
    (error) => {
      console.error('Firestore subscription error:', error)
      callback([])
    }
  )
}

/**
 * Import rules from AUTO_WORKFLOW_RULES format
 */
export const importAutoWorkflowRules = async (
  data: AutoWorkflowRulesExport
): Promise<Rule[]> => {
  if (data.type !== 'AUTO_WORKFLOW_RULES') {
    throw new Error('Invalid format: expected AUTO_WORKFLOW_RULES')
  }

  return importRulesFromJSON(data.rules)
}
