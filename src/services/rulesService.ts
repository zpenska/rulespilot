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
import { Rule, RuleExport, AutoWorkflowRulesExport, RuleType, TATRuleExport, DueDateRulesExport, StandardOperator, CustomOperator } from '../types/rules'
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

  const data = docSnap.data() as Rule
  return {
    ...data,
    ruleType: normalizeRuleType(data.ruleType)
  }
}

/**
 * Normalize rule type - map legacy 'rules' to 'workflow'
 */
function normalizeRuleType(ruleType: string | undefined): RuleType {
  if (ruleType === 'rules') return 'workflow'  // Map legacy 'rules' to 'workflow'
  if (!ruleType) return 'workflow'  // Default undefined/null to 'workflow'
  return ruleType as RuleType
}

/**
 * Get all rules (optionally filtered by rule type)
 */
export const getAllRules = async (ruleType?: RuleType): Promise<Rule[]> => {
  if (!db) {
    console.warn('Firebase not configured, returning empty rules array')
    return []
  }

  const rulesRef = collection(db, RULES_COLLECTION)
  const q = query(rulesRef, orderBy('updatedAt', 'desc'))
  const snapshot = await getDocs(q)

  // Map rules and normalize legacy 'rules' -> 'workflow'
  let rules = snapshot.docs.map((doc) => {
    const data = doc.data() as Rule
    return {
      ...data,
      ruleType: normalizeRuleType(data.ruleType)
    }
  })

  // Filter by ruleType if specified
  if (ruleType) {
    rules = rules.filter((rule) => rule.ruleType === ruleType)
  }

  return rules
}

/**
 * Get active rules (optionally filtered by rule type)
 */
export const getActiveRules = async (ruleType?: RuleType): Promise<Rule[]> => {
  const rulesRef = collection(db, RULES_COLLECTION)

  const q = query(
    rulesRef,
    where('status', '==', 'active'),
    orderBy('weight', 'desc'),
    orderBy('updatedAt', 'desc')
  )

  const snapshot = await getDocs(q)

  // Map rules and normalize legacy 'rules' -> 'workflow'
  let rules = snapshot.docs.map((doc) => {
    const data = doc.data() as Rule
    return {
      ...data,
      ruleType: normalizeRuleType(data.ruleType)
    }
  })

  // Filter by ruleType if specified
  if (ruleType) {
    rules = rules.filter((rule) => rule.ruleType === ruleType)
  }

  return rules
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
 * Export TAT rule to JSON format (without UI metadata)
 * TAT rules have a different structure focused on due date calculation
 * Note: TAT rules do NOT include operator field - it's implicitly "IN"
 */
export const exportTATRuleToJSON = (rule: Rule): TATRuleExport => {
  // Format standardFieldCriteria for TAT rules (no operator field)
  const standardFieldCriteria = rule.standardFieldCriteria.map((criteria) => {
    const ordered: any = {
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

  // Format customFieldCriteria for TAT rules (no operator, specific field order)
  const customFieldCriteria = rule.customFieldCriteria?.map((criteria) => ({
    values: criteria.values,
    association: criteria.association,
    templateId: criteria.templateId,
  }))

  if (!rule.tatParameters) {
    throw new Error('TAT rule must have tatParameters defined')
  }

  const exported: TATRuleExport = {
    sourceDateTimeField: rule.tatParameters.sourceDateTimeField,
    holidayDates: rule.tatParameters.holidayDates,
    holidayCategory: rule.tatParameters.holidayCategory ?? null,
    clinicalsRequestedResponseThresholdHours: rule.tatParameters.clinicalsRequestedResponseThresholdHours ?? null,
    ruleDesc: rule.ruleDesc,
    customFieldCriteria: customFieldCriteria && customFieldCriteria.length > 0 ? customFieldCriteria : null,
    isActive: rule.status === 'active',
    weight: rule.weight ?? 100,
    unitsOfMeasure: rule.tatParameters.unitsOfMeasure,
    standardFieldCriteria,
    units: rule.tatParameters.units,
    holidayOffset: rule.tatParameters.holidayOffset ?? null,
    dueTime: rule.tatParameters.dueTime ?? null,
    dateOperator: rule.tatParameters.dateOperator ?? null,
    autoExtend: rule.tatParameters.autoExtend ?? false,
    extendStatusReason: rule.tatParameters.extendStatusReason ?? null,
  }

  return exported
}

/**
 * Export workflow rule to JSON format (without UI metadata)
 * Ensures correct field ordering for JSON output
 */
export const exportWorkflowRuleToJSON = (rule: Rule): RuleExport => {
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
 * Export rule to JSON format (without UI metadata)
 * Routes to appropriate export function based on rule type
 */
export const exportRuleToJSON = (rule: Rule): RuleExport | TATRuleExport => {
  if (rule.ruleType === 'tat') {
    return exportTATRuleToJSON(rule)
  }
  return exportWorkflowRuleToJSON(rule)
}

/**
 * Export all rules to JSON
 */
export const exportAllRulesToJSON = async (): Promise<(RuleExport | TATRuleExport)[]> => {
  const rules = await getAllRules()
  return rules.map(exportRuleToJSON)
}

/**
 * Export active rules to JSON
 */
export const exportActiveRulesToJSON = async (): Promise<(RuleExport | TATRuleExport)[]> => {
  const rules = await getActiveRules()
  return rules.map(exportRuleToJSON)
}

/**
 * Export rules in AUTO_WORKFLOW_RULES format
 */
export const exportAsAutoWorkflowRules = async (
  rules?: Rule[]
): Promise<AutoWorkflowRulesExport> => {
  const rulesToExport = rules || (await getActiveRules('workflow'))
  // Filter to only workflow rules
  const workflowRules = rulesToExport.filter(r => r.ruleType === 'workflow' || r.ruleType === 'skills')

  return {
    type: 'AUTO_WORKFLOW_RULES',
    rules: workflowRules.map(exportWorkflowRuleToJSON),
  }
}

/**
 * Export TAT rules in DUE_DATE_RULES format
 */
export const exportAsDueDateRules = async (
  rules?: Rule[]
): Promise<DueDateRulesExport> => {
  const rulesToExport = rules || (await getActiveRules('tat'))
  // Filter to only TAT rules
  const tatRules = rulesToExport.filter(r => r.ruleType === 'tat')

  return {
    rules: tatRules.map(exportTATRuleToJSON),
  }
}

/**
 * Detect if a rule JSON object is in TAT format or Workflow format
 * TAT rules have sourceDateTimeField, units, and unitsOfMeasure
 * Workflow rules have actions or operator in criteria
 */
export const isTATRuleFormat = (rule: any): boolean => {
  // TAT rules have these required TAT-specific fields
  return !!(
    rule.sourceDateTimeField &&
    rule.units !== undefined &&
    rule.unitsOfMeasure
  )
}

/**
 * Import workflow rules from JSON
 */
export const importRulesFromJSON = async (jsonData: RuleExport[]): Promise<Rule[]> => {
  const importedRules: Rule[] = []

  for (const ruleData of jsonData) {
    try {
      // Convert RuleExport to Rule format
      const ruleToCreate: Partial<Rule> = {
        ruleType: 'workflow',
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
 * Import TAT rules from JSON
 * Note: TAT rules don't have operator field in JSON - we add it as "IN" during import
 */
export const importTATRulesFromJSON = async (jsonData: TATRuleExport[]): Promise<Rule[]> => {
  const importedRules: Rule[] = []

  for (const ruleData of jsonData) {
    try {
      // Convert TAT standardFieldCriteria to internal format (add operator)
      const standardFieldCriteria = ruleData.standardFieldCriteria.map((criteria) => ({
        ...criteria,
        operator: 'IN' as StandardOperator, // TAT rules implicitly use IN operator
      }))

      // Convert TAT customFieldCriteria to internal format (add operator)
      const customFieldCriteria = ruleData.customFieldCriteria?.map((criteria) => ({
        association: criteria.association,
        templateId: criteria.templateId,
        operator: 'IN' as CustomOperator, // TAT rules implicitly use IN operator
        values: criteria.values,
      }))

      // Convert TATRuleExport to Rule format
      const ruleToCreate: Partial<Rule> = {
        ruleType: 'tat',
        ruleDesc: ruleData.ruleDesc,
        standardFieldCriteria,
        customFieldCriteria: customFieldCriteria || [],
        weight: ruleData.weight,
        status: ruleData.isActive ? 'active' : 'inactive',
        tatParameters: {
          sourceDateTimeField: ruleData.sourceDateTimeField,
          units: ruleData.units,
          unitsOfMeasure: ruleData.unitsOfMeasure,
          dueTime: ruleData.dueTime,
          holidayDates: ruleData.holidayDates,
          holidayCategory: ruleData.holidayCategory,
          holidayOffset: ruleData.holidayOffset,
          clinicalsRequestedResponseThresholdHours: ruleData.clinicalsRequestedResponseThresholdHours,
          dateOperator: ruleData.dateOperator,
          autoExtend: ruleData.autoExtend,
          extendStatusReason: ruleData.extendStatusReason,
        },
      }

      // Create the rule
      const createdRule = await createRule(ruleToCreate as Rule)
      importedRules.push(createdRule)
    } catch (error) {
      console.error('Error importing TAT rule:', ruleData.ruleDesc, error)
      // Continue with other rules even if one fails
    }
  }

  return importedRules
}

/**
 * Import rules from DUE_DATE_RULES format
 */
export const importDueDateRules = async (
  data: DueDateRulesExport
): Promise<Rule[]> => {
  return importTATRulesFromJSON(data.rules)
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
  statusFilter?: 'active' | 'inactive',
  ruleTypeFilter?: RuleType
): (() => void) => {
  if (!db) {
    console.warn('Firebase not configured, returning empty rules')
    callback([])
    return () => {}
  }

  const rulesRef = collection(db, RULES_COLLECTION)

  // Build query without ruleType filter - we'll filter in memory
  let q
  if (statusFilter) {
    q = query(rulesRef, where('status', '==', statusFilter), orderBy('updatedAt', 'desc'))
  } else {
    q = query(rulesRef, orderBy('updatedAt', 'desc'))
  }

  return onSnapshot(
    q,
    (snapshot) => {
      // Map rules and normalize legacy 'rules' -> 'workflow'
      let rules = snapshot.docs.map((doc) => {
        const data = doc.data() as Rule
        return {
          ...data,
          ruleType: normalizeRuleType(data.ruleType)
        }
      })

      // Filter by ruleType if specified
      if (ruleTypeFilter) {
        rules = rules.filter((rule) => rule.ruleType === ruleTypeFilter)
      }

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
