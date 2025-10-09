// Operator types based on business requirements
export type StandardOperator =
  | 'IN'
  | 'NOT_IN'
  | 'EQUALS'
  | 'GREATER_THAN_OR_EQUAL_TO'
  | 'GREATER_THAN'
  | 'LESS_THAN_OR_EQUAL_TO'
  | 'LESS_THAN'
  | 'BETWEEN'

export type CustomOperator = 'IN' | 'NOT_IN'

export type ProviderRole = 'SERVICING' | 'REFERRING' | 'ORDERING' | 'RENDERING'

export type CustomFieldAssociation = 'MEMBER' | 'ENROLLMENT' | 'REQUEST'

// Standard field names
export type StandardFieldName =
  // Enrollment Fields
  | 'ENROLLMENT_GROUP_ID'
  | 'ENROLLMENT_LINE_OF_BUSINESS'
  | 'ENROLLMENT_PLAN'
  // Member Fields
  | 'MEMBER_AGE'
  | 'MEMBER_CLIENT'
  | 'MEMBER_STATE'
  // Provider Fields
  | 'PROVIDER_ALTERNATE_ID'
  | 'PROVIDER_NPI'
  | 'PROVIDER_PRIMARY_ADDRESS_POSTAL_CODE'
  | 'PROVIDER_PRIMARY_ADDRESS_STATE'
  | 'PROVIDER_PRIMARY_SPECIALTY'
  | 'PROVIDER_SET'
  // Request Fields
  | 'REQUEST_CLASSIFICATION'
  | 'REQUEST_DIAGNOSIS_CODE'
  | 'REQUEST_DISPOSITION'
  | 'REQUEST_FROM_DATE'
  | 'REQUEST_HEALTHCARE_TYPE'
  | 'REQUEST_INTAKE_SOURCE'
  | 'REQUEST_ORIGINATING_SYSTEM_SOURCE'
  | 'REQUEST_PRIMARY_DIAGNOSIS_CODE'
  | 'REQUEST_STATE'
  | 'REQUEST_STATUS'
  | 'REQUEST_THROUGH_DATE'
  | 'REQUEST_TREATMENT_SETTING'
  | 'REQUEST_TYPE'
  | 'REQUEST_URGENCY'
  // Review Outcome Fields
  | 'REVIEW_OUTCOME_LEVEL_OF_CARE'
  | 'REVIEW_OUTCOME_STATUS'
  | 'REVIEW_OUTCOME_STATUS_REASON'
  // Service Fields
  | 'SERVICE_CODE'
  | 'SERVICE_LEVEL_OF_CARE'
  | 'SERVICE_PLACE_OF_SERVICE'
  | 'SERVICE_PRIMARY_FLAG'
  | 'SERVICE_REQUESTED_UNITS'
  | 'SERVICE_REQUESTED_UNITS_UOM'
  | 'SERVICE_REVIEW_TYPE'
  | 'SERVICE_STATE'
  | 'SERVICE_TREATMENT_TYPE'
  // Stage Fields
  | 'STAGE_PRIMARY_SERVICE_CODE'
  | 'STAGE_TYPE'

// Standard Field Criteria structure
export interface StandardFieldCriteria {
  field: StandardFieldName
  operator: StandardOperator
  values: string[]
  providerRole?: ProviderRole  // Required for provider fields
  alternateIdType?: string      // Required for PROVIDER_ALTERNATE_ID
}

// Custom Field Criteria structure
export interface CustomFieldCriteria {
  association: CustomFieldAssociation
  templateId: string
  operator: CustomOperator
  values: string[]
}

// Action types for workflow automation
export interface AssignSkillAction {
  skillCode: string
}

export interface ReassignAction {
  departmentCode: string
}

export interface GenerateLetterAction {
  letterName: string
}

export interface CloseAction {
  dispositionCode: string
}

// Combined actions interface
export interface RuleActions {
  assignSkill?: AssignSkillAction
  reassign?: ReassignAction
  generateLetters?: GenerateLetterAction[]
  close?: CloseAction
}

// Main Rule structure - matches exact JSON requirements
export interface Rule {
  id: string
  code?: string  // For table display
  ruleDesc: string
  standardFieldCriteria: StandardFieldCriteria[]
  customFieldCriteria: CustomFieldCriteria[]
  weight?: number
  activationDate?: string  // YYYY-MM-DD format
  status: 'active' | 'inactive'
  category?: string
  actions?: RuleActions
  createdAt: string
  updatedAt: string
}

// For JSON export (without UI metadata)
export interface RuleExport {
  ruleDesc: string
  standardFieldCriteria: StandardFieldCriteria[]
  customFieldCriteria?: CustomFieldCriteria[]
  isActive: boolean
  weight: number
  actions?: RuleActions
}

// AUTO_WORKFLOW_RULES export format
export interface AutoWorkflowRulesExport {
  type: 'AUTO_WORKFLOW_RULES'
  rules: RuleExport[]
}

// Field category for UI grouping
export type FieldCategory =
  | 'Enrollment'
  | 'Member'
  | 'Provider'
  | 'Request'
  | 'Review Outcome'
  | 'Service'
  | 'Stage'
  | 'Custom'

// Field type for validation
export type FieldDataType = 'STRING' | 'INTEGER' | 'DATE' | 'BOOLEAN'

// Field definition for the rule builder
export interface FieldDefinition {
  name: StandardFieldName
  category: FieldCategory
  dataType: FieldDataType
  allowedOperators: StandardOperator[]
  requiresProviderRole?: boolean
  requiresAlternateIdType?: boolean
  dictionaryKey?: string  // Key to fetch values from dictionaries
}

// Dictionary item structure
export interface DictionaryItem {
  code: string
  description: string
  active: boolean
  [key: string]: any  // For additional CSV columns
}

// Dictionary collection
export interface Dictionary {
  [key: string]: DictionaryItem[]
}

// Validation error
export interface ValidationError {
  field: string
  message: string
}

// Legacy RuleGroup type (not used in current implementation)
export interface RuleGroup {
  id: string
  name: string
  rules: Rule[]
  operator: 'AND' | 'OR'
}
