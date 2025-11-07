import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
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
import { calculateAtoms } from '../utils/ruleUtils'

const RULES_COLLECTION = 'rules'

/**
 * Rules Service
 * Handles all CRUD operations for rules
 */

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

  // Calculate atoms if not provided
  const atoms = rule.atoms ?? calculateAtoms(rule)

  const newRule: Rule = {
    ...rule,
    id,
    atoms,
    createdAt: now,
    updatedAt: now,
  } as Rule

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

  // Recalculate atoms if criteria fields are being updated
  let atoms = updates.atoms
  if (updates.standardFieldCriteria !== undefined || updates.customFieldCriteria !== undefined) {
    // If criteria are being updated, recalculate atoms
    atoms = calculateAtoms({
      standardFieldCriteria: updates.standardFieldCriteria,
      customFieldCriteria: updates.customFieldCriteria,
    })
  }

  const cleanedUpdates = removeUndefinedFields({
    ...updates,
    ...(atoms !== undefined && { atoms }),
    updatedAt: new Date().toISOString(),
  })

  await setDoc(docRef, cleanedUpdates, { merge: true })
}

/**
 * Delete a rule
 */
export const deleteRule = async (id: string): Promise<void> => {
  if (!db) {
    throw new Error('Firebase not configured. Cannot delete rule.')
  }
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
    code: `${original.code}-COPY`,
    ruleDesc: `${original.ruleDesc} (Copy)`,
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
  if (!db) {
    throw new Error('Firebase not configured. Cannot delete rules.')
  }
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
    ruleDesc: rule.ruleDesc,
    sourceDateTimeField: rule.tatParameters.sourceDateTimeField,
    holidayDates: rule.tatParameters.holidayDates,
    holidayCategory: rule.tatParameters.holidayCategory ?? null,
    clinicalsRequestedResponseThresholdHours: rule.tatParameters.clinicalsRequestedResponseThresholdHours ?? null,
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
  // Also transform operator names for engine compatibility
  const standardFieldCriteria = rule.standardFieldCriteria.map((criteria) => {
    // Transform operator names
    let operator = criteria.operator
    if (operator === 'GREATER_THAN_OR_EQUAL_TO') {
      operator = 'GREATER_THAN_OR_EQUAL' as any
    }

    const ordered: any = {
      operator,
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

  // Include hintsAction if this is a hints rule - transform to generateWorkflowMessage
  if (rule.hints) {
    // Map color to messageType
    let messageType: 'INFO' | 'WARNING' | 'IMPORTANT' = 'INFO'
    if (rule.hints.color === 'RED') {
      messageType = 'IMPORTANT'
    } else if (rule.hints.color === 'YELLOW') {
      messageType = 'WARNING'
    } else if (rule.hints.color === 'BLUE' || rule.hints.color === 'GREEN') {
      messageType = 'INFO'
    }

    // Add generateWorkflowMessage action
    (exported as any).actions = {
      generateWorkflowMessage: {
        message: rule.hints.message,
        messageType,
      }
    }

    // Add WORKFLOW_STEP criteria based on context array
    if (rule.hints.context && rule.hints.context.length > 0) {
      const workflowStepValues: string[] = []
      const hasMemberDemographics = rule.hints.context.includes('MEMBER_DEMOGRAPHICS')

      for (const ctx of rule.hints.context) {
        switch (ctx) {
          case 'MEMBER_DEMOGRAPHICS':
            workflowStepValues.push('MEMBER')
            break
          case 'PROVIDER_DEMOGRAPHICS':
            workflowStepValues.push('PROVIDER')
            break
          case 'SERVICES':
            workflowStepValues.push('SERVICE')
            break
          case 'DIAGNOSIS':
            workflowStepValues.push('DIAGNOSIS')
            break
          case 'BUSINESS_ENTERPRISE_CATEGORIES':
            // Only add MEMBER if MEMBER_DEMOGRAPHICS is not already in the context
            if (!hasMemberDemographics) {
              workflowStepValues.push('MEMBER')
            }
            break
        }
      }

      // Add WORKFLOW_STEP criteria if we have any values
      if (workflowStepValues.length > 0) {
        standardFieldCriteria.push({
          operator: 'IN',
          field: 'WORKFLOW_STEP' as any,
          values: workflowStepValues,
        })
      }
    }
  }

  // Include actions if they exist - transform for engine format
  // Note: If hints are present, they take precedence (hints and actions should be mutually exclusive)
  if (rule.actions && Object.keys(rule.actions).length > 0 && !rule.hints) {
    const transformedActions: any = {}

    // Transform departmentRouting -> reassign
    if (rule.actions.departmentRouting) {
      transformedActions.reassign = {
        departmentCode: rule.actions.departmentRouting.departmentCode,
      }
    }

    // Transform createTask -> createTasks (array)
    if (rule.actions.createTask) {
      const task = rule.actions.createTask
      transformedActions.createTasks = [{
        typeCode: task.taskType,
        reasonCode: task.taskReason,
        units: task.daysUntilDue || 0,
        unitsUomCode: 'DAYS',
        calculationField: 'REQUEST_DUE_DATE',
        priorityCode: 'MEDIUM',
        ...(task.taskOwner && { ownerDepartmentCode: task.taskOwner }),
      }]
    }

    // Keep other actions as-is
    if (rule.actions.generateLetters) {
      transformedActions.generateLetters = rule.actions.generateLetters
    }
    if (rule.actions.close) {
      transformedActions.close = rule.actions.close
    }
    if (rule.actions.createCMReferral) {
      transformedActions.createCMReferral = rule.actions.createCMReferral
    }
    if (rule.actions.transferOwnership) {
      transformedActions.transferOwnership = rule.actions.transferOwnership
    }
    if (rule.actions.createProgram) {
      transformedActions.createProgram = rule.actions.createProgram
    }

    // Transform createAppealTasks - ensure units is numeric
    if (rule.actions.createAppealTasks) {
      transformedActions.createAppealTasks = rule.actions.createAppealTasks.map(task => ({
        ...task,
        units: typeof task.units === 'string' ? parseInt(task.units, 10) : task.units,
      }))
    }

    exported.actions = transformedActions
  }

  // Include workflow-specific fields
  if (rule.triggerEvents && rule.triggerEvents.length > 0) {
    exported.triggerEvents = rule.triggerEvents
  }

  if (rule.requestTypeFilter) {
    exported.requestTypeFilter = rule.requestTypeFilter
  }

  if (rule.fireOnce !== undefined) {
    exported.fireOnce = rule.fireOnce
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
  const workflowRules = rulesToExport.filter(r => r.ruleType === 'workflow')

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
 * Export workflow rules for Workflow tab (tab-specific export)
 */
export const exportWorkflowRulesForTab = async (): Promise<AutoWorkflowRulesExport> => {
  const rules = await getActiveRules('workflow')
  return exportAsAutoWorkflowRules(rules)
}

/**
 * Export hints rules for Hints tab (tab-specific export)
 */
export const exportHintsRulesForTab = async (): Promise<RuleExport[]> => {
  const rules = await getAllRules()
  const hintsRules = rules.filter(r => r.ruleType === 'hints')
  return hintsRules.map(exportWorkflowRuleToJSON)
}

/**
 * Export TAT rules for TAT tab (tab-specific export)
 */
export const exportTATRulesForTab = async (): Promise<DueDateRulesExport> => {
  const rules = await getActiveRules('tat')
  return exportAsDueDateRules(rules)
}

/**
 * Export global rules and skills (Workflow + Hints + Skills in one JSON)
 * TAT is excluded as it has a different format
 */
export const exportGlobalRulesAndSkills = async (): Promise<Array<any>> => {
  // Get all rules
  const allRules = await getAllRules()

  // Filter and export workflow rules
  const workflowRules = allRules
    .filter(r => r.ruleType === 'workflow')
    .map(exportWorkflowRuleToJSON)

  // Filter and export hints rules
  const hintsRules = allRules
    .filter(r => r.ruleType === 'hints')
    .map(exportWorkflowRuleToJSON)

  // Combine workflow and hints rules into a single rules array
  const allExportedRules = [...workflowRules, ...hintsRules]

  // Return array format with AUTO_WORKFLOW_RULES catalog
  const catalogs: Array<any> = []

  // Add AUTO_WORKFLOW_RULES catalog if there are any rules
  if (allExportedRules.length > 0) {
    catalogs.push({
      type: 'AUTO_WORKFLOW_RULES',
      rules: allExportedRules,
    })
  }

  return catalogs
}

/**
 * Import global rules and skills from AUTO_WORKFLOW_RULES format or legacy GLOBAL_RULES_EXPORT format
 */
export const importGlobalRulesAndSkills = async (data: any): Promise<{
  workflowCount: number
  hintsCount: number
  skillsCount: number
}> => {
  // Check if data is in new array format or old object format
  const isNewFormat = Array.isArray(data)

  if (isNewFormat) {
    // New format: array of catalogs
    let workflowCount = 0
    let hintsCount = 0
    let skillsCount = 0

    for (const catalog of data) {
      if (catalog.type === 'AUTO_WORKFLOW_RULES' && catalog.rules) {
        // Import rules from AUTO_WORKFLOW_RULES catalog
        // Separate workflow and hints rules based on whether they have hints property
        const workflowRulesData: any[] = []
        const hintsRulesData: any[] = []

        for (const rule of catalog.rules) {
          if (rule.hints) {
            // This is a hints rule
            hintsRulesData.push({
              ...rule,
              ruleType: 'hints',
            })
          } else {
            // This is a workflow rule (has actions or neither)
            workflowRulesData.push({
              ...rule,
              ruleType: 'workflow',
            })
          }
        }

        // Import workflow rules
        if (workflowRulesData.length > 0) {
          const imported = await importRulesFromJSON(workflowRulesData)
          workflowCount += imported.length
        }

        // Import hints rules
        if (hintsRulesData.length > 0) {
          const imported = await importRulesFromJSON(hintsRulesData)
          hintsCount += imported.length
        }
      }
    }

    return {
      workflowCount,
      hintsCount,
      skillsCount,
    }
  } else {
    // Old format: object with workflow, hints, skills properties
    if (data.type !== 'GLOBAL_RULES_EXPORT') {
      throw new Error('Invalid format: expected GLOBAL_RULES_EXPORT or array format')
    }

    // Import workflow rules
    const workflowRulesWithType = data.workflow.map((r: any) => ({
      ...r,
      ruleType: 'workflow',
    }))
    const workflowImported = await importRulesFromJSON(workflowRulesWithType)

    // Import hints rules
    const hintsRulesWithType = data.hints.map((r: any) => ({
      ...r,
      ruleType: 'hints',
    }))
    const hintsImported = await importRulesFromJSON(hintsRulesWithType)

    // Import skills if present
    let skillsImported = 0
    if (data.skills) {
      skillsImported = await importSkills(data.skills)
    }

    return {
      workflowCount: workflowImported.length,
      hintsCount: hintsImported.length,
      skillsCount: skillsImported,
    }
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
export const importRulesFromJSON = async (jsonData: any[]): Promise<Rule[]> => {
  const importedRules: Rule[] = []

  for (const ruleData of jsonData) {
    try {
      // Convert RuleExport to Rule format
      // For backwards compatibility: if code not present, use auto-generated code
      // Use ruleType from data if present, otherwise default to 'workflow'
      const ruleToCreate: Partial<Rule> = {
        ruleType: ruleData.ruleType || 'workflow',
        code: ruleData.code || `RULE${Date.now()}`,
        ruleDesc: ruleData.ruleDesc || '',
        standardFieldCriteria: ruleData.standardFieldCriteria || [],
        customFieldCriteria: ruleData.customFieldCriteria || [],
        weight: ruleData.weight,
        status: ruleData.isActive ? 'active' : 'inactive',
        actions: ruleData.actions,
        hints: ruleData.hintsAction,
        triggerEvents: ruleData.triggerEvents,
        requestTypeFilter: ruleData.requestTypeFilter,
        fireOnce: ruleData.fireOnce,
      }

      // Create the rule
      const createdRule = await createRule(ruleToCreate as Rule)
      importedRules.push(createdRule)
    } catch (error) {
      console.error('Error importing rule:', ruleData.ruleDesc || ruleData.code, error)
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
      // For backwards compatibility: if code not present, use auto-generated code
      const ruleToCreate: Partial<Rule> = {
        ruleType: 'tat',
        code: ruleData.code || `TAT${Date.now()}`,
        ruleDesc: ruleData.ruleDesc || '',
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
      console.error('Error importing TAT rule:', ruleData.ruleDesc || ruleData.code, error)
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
      rule.ruleDesc?.toLowerCase().includes(term) ||
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

/**
 * Export skills to JSON
 */
export const exportSkills = async (): Promise<any[]> => {
  const skillsRef = collection(db, 'skills')
  const snapshot = await getDocs(skillsRef)

  return snapshot.docs.map(doc => {
    const data = doc.data()
    // Remove Firebase-specific fields for export
    const { id, ...exportData } = { id: doc.id, ...data }
    return exportData
  })
}

/**
 * Import skills from JSON
 */
export const importSkills = async (skillsData: Record<string, unknown>[]): Promise<number> => {
  if (!db) {
    console.warn('Firebase not configured')
    return 0
  }

  const skillsRef = collection(db, 'skills')
  let importedCount = 0

  for (const skillData of skillsData) {
    try {
      // Add active flag if not present
      const skillToCreate = {
        ...skillData,
        active: (skillData as { active?: boolean }).active !== undefined ? (skillData as { active?: boolean }).active : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Create new document with auto-generated ID
      await addDoc(skillsRef, skillToCreate)
      importedCount++
    } catch (error) {
      console.error('Error importing skill:', skillData.skillName, error)
      // Continue with other skills even if one fails
    }
  }

  return importedCount
}
