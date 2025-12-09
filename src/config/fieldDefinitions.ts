import { FieldDefinition, StandardFieldName } from '../types/rules'

/**
 * Complete field definitions mapping based on business requirements
 * Each field specifies:
 * - category: For UI grouping
 * - dataType: For validation
 * - allowedOperators: Based on business rules
 * - requiresProviderRole: For provider fields
 * - requiresAlternateIdType: For PROVIDER_ALTERNATE_ID
 * - dictionaryKey: For fetching dropdown values
 */
export const FIELD_DEFINITIONS: Record<StandardFieldName, FieldDefinition> = {
  // ==================== ENROLLMENT FIELDS ====================
  ENROLLMENT_GROUP_ID: {
    name: 'ENROLLMENT_GROUP_ID',
    category: 'Enrollment',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    dictionaryKey: 'enrollment_group_id',
  },
  ENROLLMENT_LINE_OF_BUSINESS: {
    name: 'ENROLLMENT_LINE_OF_BUSINESS',
    category: 'Enrollment',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    dictionaryKey: 'enrollment_line_of_business',
  },
  ENROLLMENT_PLAN: {
    name: 'ENROLLMENT_PLAN',
    category: 'Enrollment',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    dictionaryKey: 'enrollment_plan',
  },

  // ==================== MEMBER FIELDS ====================
  MEMBER_AGE: {
    name: 'MEMBER_AGE',
    category: 'Member',
    dataType: 'INTEGER',
    allowedOperators: [
      'EQUALS',
      'GREATER_THAN_OR_EQUAL_TO',
      'GREATER_THAN',
      'LESS_THAN_OR_EQUAL_TO',
      'LESS_THAN',
      'BETWEEN',
    ],
  },
  MEMBER_CLIENT: {
    name: 'MEMBER_CLIENT',
    category: 'Member',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    dictionaryKey: 'member_client',
  },
  MEMBER_PCP_MCO_ID_AND_TYPE: {
    name: 'MEMBER_PCP_MCO_ID_AND_TYPE',
    category: 'Member',
    dataType: 'STRING',
    allowedOperators: ['EQUALS_STANDARD_FIELD', 'NOT_EQUALS_STANDARD_FIELD'],
  },
  MEMBER_POSTAL_CODE: {
    name: 'MEMBER_POSTAL_CODE',
    category: 'Member',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    dictionaryKey: 'member_postal_code',
  },
  MEMBER_STATE: {
    name: 'MEMBER_STATE',
    category: 'Member',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    dictionaryKey: 'member_state',
  },

  // ==================== PROVIDER FIELDS ====================
  PROVIDER_ALTERNATE_ID: {
    name: 'PROVIDER_ALTERNATE_ID',
    category: 'Provider',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    requiresProviderRole: true,
    requiresAlternateIdType: true,
    dictionaryKey: 'provider_alternate_id',
  },
  PROVIDER_MCO_ID_AND_TYPE: {
    name: 'PROVIDER_MCO_ID_AND_TYPE',
    category: 'Provider',
    dataType: 'STRING',
    allowedOperators: ['EQUALS_STANDARD_FIELD', 'NOT_EQUALS_STANDARD_FIELD'],
    requiresProviderRole: true,
  },
  PROVIDER_NPI: {
    name: 'PROVIDER_NPI',
    category: 'Provider',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    requiresProviderRole: true,
    dictionaryKey: 'provider_npi',
  },
  PROVIDER_PRIMARY_ADDRESS_POSTAL_CODE: {
    name: 'PROVIDER_PRIMARY_ADDRESS_POSTAL_CODE',
    category: 'Provider',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    requiresProviderRole: true,
    dictionaryKey: 'provider_postal_code',
  },
  PROVIDER_PRIMARY_ADDRESS_STATE: {
    name: 'PROVIDER_PRIMARY_ADDRESS_STATE',
    category: 'Provider',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    requiresProviderRole: true,
    dictionaryKey: 'provider_state',
  },
  PROVIDER_PRIMARY_SPECIALTY: {
    name: 'PROVIDER_PRIMARY_SPECIALTY',
    category: 'Provider',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    requiresProviderRole: true,
    dictionaryKey: 'provider_specialty',
  },
  PROVIDER_SET: {
    name: 'PROVIDER_SET',
    category: 'Provider',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    requiresProviderRole: true,
    dictionaryKey: 'provider_set',
  },

  // ==================== RECONSIDERATION FIELDS ====================
  RECONSIDERATION_ALL_DOC_RECEIVED_DATE_TIME: {
    name: 'RECONSIDERATION_ALL_DOC_RECEIVED_DATE_TIME',
    category: 'Reconsideration',
    dataType: 'DATE',
    allowedOperators: ['VALUED', 'NOT_VALUED'],
  },
  RECONSIDERATION_DUE_DATE_REASON: {
    name: 'RECONSIDERATION_DUE_DATE_REASON',
    category: 'Reconsideration',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    dictionaryKey: 'reconsideration_due_date_reason',
  },
  RECONSIDERATION_LEVEL: {
    name: 'RECONSIDERATION_LEVEL',
    category: 'Reconsideration',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    dictionaryKey: 'reconsideration_level',
  },
  RECONSIDERATION_OF_TYPE: {
    name: 'RECONSIDERATION_OF_TYPE',
    category: 'Reconsideration',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    dictionaryKey: 'reconsideration_of_type',
  },
  RECONSIDERATION_PROCESS_TYPE: {
    name: 'RECONSIDERATION_PROCESS_TYPE',
    category: 'Reconsideration',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    dictionaryKey: 'reconsideration_process_type',
  },
  RECONSIDERATION_REQUESTER_TYPE: {
    name: 'RECONSIDERATION_REQUESTER_TYPE',
    category: 'Reconsideration',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    dictionaryKey: 'reconsideration_requester_type',
  },
  RECONSIDERATION_STATUS: {
    name: 'RECONSIDERATION_STATUS',
    category: 'Reconsideration',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    dictionaryKey: 'reconsideration_status',
  },
  RECONSIDERATION_TYPE: {
    name: 'RECONSIDERATION_TYPE',
    category: 'Reconsideration',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    dictionaryKey: 'reconsideration_type',
  },
  RECONSIDERATION_URGENCY: {
    name: 'RECONSIDERATION_URGENCY',
    category: 'Reconsideration',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    dictionaryKey: 'reconsideration_urgency',
  },

  // ==================== REQUEST FIELDS ====================
  REQUEST_CLASSIFICATION: {
    name: 'REQUEST_CLASSIFICATION',
    category: 'Request',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    dictionaryKey: 'Request_Classification',
  },
  REQUEST_DIAGNOSIS_CODE: {
    name: 'REQUEST_DIAGNOSIS_CODE',
    category: 'Request',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN', 'BETWEEN'],
    dictionaryKey: 'diagnosis_code',
  },
  REQUEST_DISPOSITION: {
    name: 'REQUEST_DISPOSITION',
    category: 'Request',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    dictionaryKey: 'Disposition',
  },
  REQUEST_FROM_DATE: {
    name: 'REQUEST_FROM_DATE',
    category: 'Request',
    dataType: 'DATE',
    allowedOperators: [
      'GREATER_THAN_OR_EQUAL_TO',
      'GREATER_THAN',
      'LESS_THAN_OR_EQUAL_TO',
      'LESS_THAN',
      'BETWEEN',
    ],
  },
  REQUEST_HEALTHCARE_TYPE: {
    name: 'REQUEST_HEALTHCARE_TYPE',
    category: 'Request',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    dictionaryKey: 'Healthcare_Type',
  },
  REQUEST_INTAKE_SOURCE: {
    name: 'REQUEST_INTAKE_SOURCE',
    category: 'Request',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    dictionaryKey: 'Request_Intake_Source',
  },
  REQUEST_ORIGINATING_SYSTEM_SOURCE: {
    name: 'REQUEST_ORIGINATING_SYSTEM_SOURCE',
    category: 'Request',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    dictionaryKey: 'Source_System',
  },
  REQUEST_PRIMARY_DIAGNOSIS_CODE: {
    name: 'REQUEST_PRIMARY_DIAGNOSIS_CODE',
    category: 'Request',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN', 'BETWEEN'],
    dictionaryKey: 'diagnosis_code',
  },
  REQUEST_STATE: {
    name: 'REQUEST_STATE',
    category: 'Request',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    dictionaryKey: 'request_state',
  },
  REQUEST_STATUS: {
    name: 'REQUEST_STATUS',
    category: 'Request',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    dictionaryKey: 'request_status',
  },
  REQUEST_THROUGH_DATE: {
    name: 'REQUEST_THROUGH_DATE',
    category: 'Request',
    dataType: 'DATE',
    allowedOperators: [
      'GREATER_THAN_OR_EQUAL_TO',
      'GREATER_THAN',
      'LESS_THAN_OR_EQUAL_TO',
      'LESS_THAN',
      'BETWEEN',
    ],
  },
  REQUEST_TREATMENT_SETTING: {
    name: 'REQUEST_TREATMENT_SETTING',
    category: 'Request',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    dictionaryKey: 'Availity_Treatment_Setting',
  },
  REQUEST_TYPE: {
    name: 'REQUEST_TYPE',
    category: 'Request',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    dictionaryKey: 'Request_Type',
  },
  REQUEST_URGENCY: {
    name: 'REQUEST_URGENCY',
    category: 'Request',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    dictionaryKey: 'Request_Urgency',
  },

  // ==================== REVIEW OUTCOME FIELDS ====================
  REVIEW_OUTCOME_LEVEL_OF_CARE: {
    name: 'REVIEW_OUTCOME_LEVEL_OF_CARE',
    category: 'Review Outcome',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    dictionaryKey: 'level_of_care',
  },
  REVIEW_OUTCOME_STATUS: {
    name: 'REVIEW_OUTCOME_STATUS',
    category: 'Review Outcome',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    dictionaryKey: 'Outcome_Status',
  },
  REVIEW_OUTCOME_STATUS_REASON: {
    name: 'REVIEW_OUTCOME_STATUS_REASON',
    category: 'Review Outcome',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    dictionaryKey: 'Outcome_Reason',
  },

  // ==================== SERVICE FIELDS ====================
  SERVICE_CODE: {
    name: 'SERVICE_CODE',
    category: 'Service',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN', 'BETWEEN'],
    dictionaryKey: 'service_code',
  },
  SERVICE_LEVEL_OF_CARE: {
    name: 'SERVICE_LEVEL_OF_CARE',
    category: 'Service',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    dictionaryKey: 'level_of_care',
  },
  SERVICE_PLACE_OF_SERVICE: {
    name: 'SERVICE_PLACE_OF_SERVICE',
    category: 'Service',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    dictionaryKey: 'place_of_service',
  },
  SERVICE_PRIMARY_FLAG: {
    name: 'SERVICE_PRIMARY_FLAG',
    category: 'Service',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    dictionaryKey: 'service_primary_flag',
  },
  SERVICE_REQUESTED_UNITS: {
    name: 'SERVICE_REQUESTED_UNITS',
    category: 'Service',
    dataType: 'INTEGER',
    allowedOperators: [
      'EQUALS',
      'GREATER_THAN_OR_EQUAL_TO',
      'GREATER_THAN',
      'LESS_THAN_OR_EQUAL_TO',
      'LESS_THAN',
      'BETWEEN',
    ],
  },
  SERVICE_REQUESTED_UNITS_UOM: {
    name: 'SERVICE_REQUESTED_UNITS_UOM',
    category: 'Service',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    dictionaryKey: 'units_uom',
  },
  SERVICE_REVIEW_TYPE: {
    name: 'SERVICE_REVIEW_TYPE',
    category: 'Service',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    dictionaryKey: 'Review_Type',
  },
  SERVICE_STATE: {
    name: 'SERVICE_STATE',
    category: 'Service',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    dictionaryKey: 'service_state',
  },
  SERVICE_TREATMENT_TYPE: {
    name: 'SERVICE_TREATMENT_TYPE',
    category: 'Service',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    dictionaryKey: 'service_treatment_type',
  },

  // ==================== STAGE FIELDS ====================
  STAGE_PRIMARY_SERVICE_CODE: {
    name: 'STAGE_PRIMARY_SERVICE_CODE',
    category: 'Stage',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    dictionaryKey: 'service_code',
  },
  STAGE_TYPE: {
    name: 'STAGE_TYPE',
    category: 'Stage',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
    dictionaryKey: 'stage_type',
  },
  // Workflow fields
  WORKFLOW_STEP: {
    name: 'WORKFLOW_STEP',
    category: 'Request',
    dataType: 'STRING',
    allowedOperators: ['IN', 'NOT_IN'],
  },
}

// Helper function to get fields by category
export const getFieldsByCategory = (category: string): FieldDefinition[] => {
  return Object.values(FIELD_DEFINITIONS).filter(
    (field) => field.category === category
  )
}

// Helper function to check if field is a provider field
export const isProviderField = (fieldName: StandardFieldName): boolean => {
  return FIELD_DEFINITIONS[fieldName]?.requiresProviderRole || false
}

// Helper function to get allowed operators for a field
export const getAllowedOperators = (fieldName: StandardFieldName) => {
  return FIELD_DEFINITIONS[fieldName]?.allowedOperators || []
}

// Helper function to get field data type
export const getFieldDataType = (fieldName: StandardFieldName) => {
  return FIELD_DEFINITIONS[fieldName]?.dataType || 'STRING'
}

// Helper function to get dictionary key for a field
export const getDictionaryKey = (fieldName: StandardFieldName) => {
  return FIELD_DEFINITIONS[fieldName]?.dictionaryKey
}

// All field categories for UI
export const FIELD_CATEGORIES = [
  'Enrollment',
  'Member',
  'Provider',
  'Reconsideration',
  'Request',
  'Review Outcome',
  'Service',
  'Stage',
] as const

// Provider roles for dropdowns
export const PROVIDER_ROLES = [
  { value: 'SERVICING', label: 'Servicing Provider' },
  { value: 'REFERRING', label: 'Referring Provider' },
  { value: 'ORDERING', label: 'Ordering Provider' },
  { value: 'RENDERING', label: 'Rendering Provider' },
] as const

// Custom field associations for dropdowns
export const CUSTOM_FIELD_ASSOCIATIONS = [
  { value: 'MEMBER', label: 'Member' },
  { value: 'ENROLLMENT', label: 'Enrollment' },
  { value: 'REQUEST', label: 'Request' },
  { value: 'SERVICE', label: 'Service' },
] as const
