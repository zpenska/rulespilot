// Rule type categories
export type RuleType = 'workflow' | 'tat' | 'pullQueue' | 'hints' | 'skills'

// Pull Queue Configuration
export interface PullQueueConfig {
  escalationsFirst: boolean
  maxQueueCapacity: number
  tatSafetyWindowHours: number
  departmentOrder: string[][] // Array of priority levels, each containing department codes at that priority
}

// TAT Configuration
export interface TATConfig {
  pauseStatusReasons: string[]
}

// Operator types based on business requirements
export type StandardOperator =
  | 'IN'
  | 'NOT_IN'
  | 'EQUALS'
  | 'EQUALS_STANDARD_FIELD'
  | 'NOT_EQUALS_STANDARD_FIELD'
  | 'GREATER_THAN_OR_EQUAL_TO'
  | 'GREATER_THAN'
  | 'LESS_THAN_OR_EQUAL_TO'
  | 'LESS_THAN'
  | 'BETWEEN'
  | 'VALUED'
  | 'NOT_VALUED'

export type CustomOperator = 'IN' | 'NOT_IN'

export type ProviderRole = 'SERVICING' | 'REFERRING' | 'ORDERING' | 'RENDERING'

export type CustomFieldAssociation = 'MEMBER' | 'ENROLLMENT' | 'REQUEST' | 'SERVICE'

// Standard field names
export type StandardFieldName =
  // Enrollment Fields
  | 'ENROLLMENT_GROUP_ID'
  | 'ENROLLMENT_LINE_OF_BUSINESS'
  | 'ENROLLMENT_PLAN'
  // Member Fields
  | 'MEMBER_AGE'
  | 'MEMBER_CLIENT'
  | 'MEMBER_PCP_MCO_ID_AND_TYPE'
  | 'MEMBER_POSTAL_CODE'
  | 'MEMBER_STATE'
  // Provider Fields
  | 'PROVIDER_ALTERNATE_ID'
  | 'PROVIDER_MCO_ID_AND_TYPE'
  | 'PROVIDER_NPI'
  | 'PROVIDER_PRIMARY_ADDRESS_POSTAL_CODE'
  | 'PROVIDER_PRIMARY_ADDRESS_STATE'
  | 'PROVIDER_PRIMARY_SPECIALTY'
  | 'PROVIDER_SET'
  // Reconsideration Fields
  | 'RECONSIDERATION_ALL_DOC_RECEIVED_DATE_TIME'
  | 'RECONSIDERATION_DUE_DATE_REASON'
  | 'RECONSIDERATION_LEVEL'
  | 'RECONSIDERATION_OF_TYPE'
  | 'RECONSIDERATION_PROCESS_TYPE'
  | 'RECONSIDERATION_REQUESTER_TYPE'
  | 'RECONSIDERATION_STATUS'
  | 'RECONSIDERATION_TYPE'
  | 'RECONSIDERATION_URGENCY'
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
  // Workflow Fields
  | 'WORKFLOW_STEP'

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

// Trigger events - when workflow rules fire
export type TriggerEvent =
  | 'CREATE_REQUEST'
  | 'EDIT_REQUEST'
  | 'EXTEND_REQUEST'
  | 'CREATE_SERVICE'
  | 'EDIT_SERVICE'
  | 'EXTEND_SERVICE'
  | 'SAVE_QUESTIONNAIRE'

// Request type filter for workflow rules
export type RequestTypeFilter = 'INPATIENT' | 'OUTPATIENT' | null

// Action types for workflow automation
export interface AssignSkillAction {
  skillCode: string
}

export interface AssignLicenseAction {
  licenseCodes: string[]
}

export interface DepartmentRoutingAction {
  departmentCode: string
}

// Engine format for reassign action (exported format)
export interface ReassignAction {
  departmentCode: string
}

export interface GenerateLetterAction {
  letterName: string
}

export interface CloseAction {
  dispositionCode: string
}

// Engine format for workflow message action (exported format for hints)
export interface GenerateWorkflowMessageAction {
  message: string
  messageType: 'SUCCESS' | 'INFO' | 'WARNING' | 'IMPORTANT' | 'ERROR'
}

export type MessageContext =
  | 'MEMBER_DEMOGRAPHICS'
  | 'PROVIDER_DEMOGRAPHICS'
  | 'SERVICES'
  | 'DIAGNOSIS'
  | 'BUSINESS_ENTERPRISE_CATEGORIES'

export type MessageDisplayLocation =
  | 'MEMBER'
  | 'PROVIDER'
  | 'SERVICES'
  | 'DIAGNOSIS'

export type MessageColor =
  | 'RED'
  | 'YELLOW'
  | 'GREEN'
  | 'BLUE'

export interface HintsAction {
  message: string
  context?: MessageContext[]
  displayLocation?: MessageDisplayLocation
  color?: MessageColor
}

export interface CreateTaskAction {
  typeCode: string
  priorityCode: string
  reasonCode: string
  units: number
  unitsUomCode: TaskUnitsUomCode
  calculationField: string
  ownerDepartmentCode?: string
  ownerUserId?: string
  description?: string
}

// Engine format for createTasks action (exported format)
export interface CreateTasksAction {
  typeCode: string
  reasonCode: string
  units: number
  unitsUomCode: string
  calculationField: string
  ownerDepartmentCode?: string
  ownerUserId?: string
  priorityCode: string
}

export interface CreateAppealTaskAction {
  typeCode: string
  priorityCode: string
  reasonCode: string
  units: number
  unitsUomCode: TaskUnitsUomCode
  calculationField: string
  ownerDepartmentCode?: string
  ownerUserId?: string
  description?: string
}

export interface TransferOwnershipAction {
  transferTo: string  // Dept or user code
}

export interface CreateCMReferralAction {
  programCode: string
  sourceCode: string
  severityCode: string
  ownerDepartmentCode: string
}

export interface CreateProgramAction {
  programName: string
}

// Combined actions interface (for workflow rules only)
export interface RuleActions {
  assignSkill?: AssignSkillAction
  assignLicenses?: AssignLicenseAction
  departmentRouting?: DepartmentRoutingAction
  generateLetters?: GenerateLetterAction[]
  generateWorkflowMessage?: GenerateWorkflowMessageAction
  close?: CloseAction
  createTask?: CreateTaskAction
  createAppealTasks?: CreateAppealTaskAction[]
  transferOwnership?: TransferOwnershipAction
  createCMReferral?: CreateCMReferralAction
  createProgram?: CreateProgramAction  // Deprecated: use createCMReferral instead
}

// TAT (Turnaround Time) specific types
export type SourceDateTimeField =
  | 'NOTIFICATION_DATE_TIME'
  | 'REQUEST_DATE_TIME'
  | 'RECEIPT_DATE_TIME'
  | 'RECEIVED_DATE_TIME'
  | 'STATUS_CHANGE_DATE_TIME'

export type UnitsOfMeasure = 'HOURS' | 'CALENDAR_DAYS' | 'BUSINESS_DAYS'

// Task action units of measure
export type TaskUnitsUomCode = 'MINUTES' | 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS' | 'YEARS'

export type DateOperator = '=' | '<' | '>' | '<=' | '>='

// TAT Rule Parameters - for calculating due date/time
export interface TATParameters {
  sourceDateTimeField: SourceDateTimeField
  units: number
  unitsOfMeasure: UnitsOfMeasure
  dueTime?: string | null  // HH:MM format (e.g., "17:00")
  holidayDates?: string[]  // YYYYMMDD format (e.g., ["20251225", "20260101"])
  holidayCategory?: string | null  // Holiday category code (e.g., "SKIPHDAY_CTGY_1")
  holidayOffset?: number | null  // Days to offset for holidays
  clinicalsRequestedResponseThresholdHours?: number | null  // Hours threshold for provider response
  dateOperator?: DateOperator | null  // Date comparison operator for source date
  autoExtend?: boolean  // Enable automatic due date extension
  extendStatusReason?: string | null  // Status reason code that triggers extension
}

// Main Rule structure - matches exact JSON requirements
export interface Rule {
  id: string
  code: string  // Required: Rule Code (3-100 symbols)
  ruleDesc: string  // Required: Rule Name (displayed as "Rule Name" in UI, exported as "ruleDesc" in JSON)
  ruleType: RuleType  // Type of rule: workflow, tat, pullQueue, hints, or skills
  standardFieldCriteria: StandardFieldCriteria[]
  customFieldCriteria: CustomFieldCriteria[]
  weight?: number
  atoms?: number  // Auto-calculated count of criteria fields
  activationDate?: string  // YYYY-MM-DD format (from date)
  expirationDate?: string  // YYYY-MM-DD format (through date, optional)
  status: 'active' | 'inactive'
  category?: string
  actions?: RuleActions  // Only for workflow rules
  hints?: HintsAction  // Only for hints rules
  tatParameters?: TATParameters  // Only for TAT rules
  triggerEvents?: TriggerEvent[]  // When this workflow rule fires
  requestTypeFilter?: RequestTypeFilter  // Inpatient/Outpatient/null filter
  fireOnce?: boolean  // Fire rule only once per request
  createdAt: string
  updatedAt: string
}

// For JSON export (without UI metadata) - Workflow Rules
export interface RuleExport {
  code?: string  // Only used for import, not included in export
  ruleDesc: string
  standardFieldCriteria: StandardFieldCriteria[]
  customFieldCriteria?: CustomFieldCriteria[]
  isActive: boolean
  weight: number
  atoms?: number
  startEffectiveDateTime?: string  // ISO 8601 timestamp
  endEffectiveDateTime?: string    // ISO 8601 timestamp
  actions?: RuleActions
  triggerEvents?: TriggerEvent[]
  requestTypeFilter?: RequestTypeFilter
  fireOnce?: boolean
}

// TAT-specific criteria types (simplified - no operator field)
export interface TATStandardFieldCriteria {
  field: StandardFieldName
  values: string[]
  providerRole?: ProviderRole  // Required for provider fields
  alternateIdType?: string      // Required for PROVIDER_ALTERNATE_ID
}

export interface TATCustomFieldCriteria {
  values: string[]
  association: CustomFieldAssociation
  templateId: string
}

// For JSON export (without UI metadata) - TAT Rules
export interface TATRuleExport {
  code?: string  // Only used for import, not included in export
  ruleDesc: string
  sourceDateTimeField: SourceDateTimeField
  holidayDates?: string[]
  holidayCategory?: string | null
  clinicalsRequestedResponseThresholdHours?: number | null
  customFieldCriteria?: TATCustomFieldCriteria[] | null
  isActive: boolean
  weight: number
  unitsOfMeasure: UnitsOfMeasure
  standardFieldCriteria: TATStandardFieldCriteria[]
  units: number
  holidayOffset?: number | null
  dueTime?: string | null
  dateOperator?: DateOperator | null
  autoExtend?: boolean
  extendStatusReason?: string | null
}

// AUTO_WORKFLOW_RULES export format
export interface AutoWorkflowRulesExport {
  type: 'AUTO_WORKFLOW_RULES'
  rules: RuleExport[]
}

// DUE_DATE_RULES export format (for TAT rules)
export interface DueDateRulesExport {
  rules: TATRuleExport[]
}

// Field category for UI grouping
export type FieldCategory =
  | 'Enrollment'
  | 'Member'
  | 'Provider'
  | 'Reconsideration'
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

// Skills Definition - for skills management
export interface SkillDefinition {
  id: string
  code?: string  // Optional: Skill Code
  skillName: string
  description: string
  diagnosisCodes: string[]
  serviceCodes: string[]
  active: boolean
  activationDate?: string  // YYYY-MM-DD format (from date)
  expirationDate?: string  // YYYY-MM-DD format (through date, optional)
  createdAt: string
  updatedAt: string
}

// Legacy RuleGroup type (not used in current implementation)
export interface RuleGroup {
  id: string
  name: string
  rules: Rule[]
  operator: 'AND' | 'OR'
}
