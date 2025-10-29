import { Rule, StandardFieldCriteria, CustomFieldCriteria, RuleExport } from '../src/types/rules'

/**
 * Test Data Fixtures
 * Comprehensive test data for all testing scenarios
 */

// Sample Standard Field Criteria
export const sampleStandardCriteria: Record<string, StandardFieldCriteria> = {
  memberState: {
    field: 'MEMBER_STATE',
    operator: 'IN',
    values: ['PA', 'NJ'],
  },
  memberAge: {
    field: 'MEMBER_AGE',
    operator: 'GREATER_THAN_OR_EQUAL_TO',
    values: ['65'],
  },
  memberAgeRange: {
    field: 'MEMBER_AGE',
    operator: 'BETWEEN',
    values: ['18', '65'],
  },
  providerSpecialty: {
    field: 'PROVIDER_PRIMARY_SPECIALTY',
    operator: 'IN',
    values: ['ORTHO', 'CARDIO'],
    providerRole: 'SERVICING',
  },
  providerNPI: {
    field: 'PROVIDER_NPI',
    operator: 'IN',
    values: ['1234567890'],
    providerRole: 'SERVICING',
  },
  providerAlternateId: {
    field: 'PROVIDER_ALTERNATE_ID',
    operator: 'IN',
    values: ['ALT123', 'ALT456'],
    providerRole: 'SERVICING',
    alternateIdType: 'MEDICAID',
  },
  requestType: {
    field: 'REQUEST_TYPE',
    operator: 'IN',
    values: ['OUTPATIENT', 'REFERRAL'],
  },
  requestUrgency: {
    field: 'REQUEST_URGENCY',
    operator: 'IN',
    values: ['EMERGENCY', 'URGENT'],
  },
  requestDate: {
    field: 'REQUEST_FROM_DATE',
    operator: 'GREATER_THAN_OR_EQUAL_TO',
    values: ['2024-01-01'],
  },
  requestDateRange: {
    field: 'REQUEST_FROM_DATE',
    operator: 'BETWEEN',
    values: ['2024-01-01', '2024-12-31'],
  },
  serviceCode: {
    field: 'SERVICE_CODE',
    operator: 'IN',
    values: ['97110', '97112'],
  },
  serviceUnits: {
    field: 'SERVICE_REQUESTED_UNITS',
    operator: 'GREATER_THAN',
    values: ['10'],
  },
}

// Sample Custom Field Criteria
export const sampleCustomCriteria: Record<string, CustomFieldCriteria> = {
  memberRiskScore: {
    association: 'MEMBER',
    templateId: 'RISK_SCORE',
    operator: 'NOT_IN',
    values: ['HIGH', 'CRITICAL'],
  },
  enrollmentPlan: {
    association: 'ENROLLMENT',
    templateId: 'CUSTOM_PLAN',
    operator: 'IN',
    values: ['GOLD', 'PLATINUM'],
  },
  requestPriority: {
    association: 'REQUEST',
    templateId: 'PRIORITY_FLAG',
    operator: 'IN',
    values: ['HIGH'],
  },
}

// Complete sample rules
export const sampleRules: Record<string, Rule> = {
  simpleRule: {
    id: 'test-rule-1',
    code: 'RULE001',
    ruleName: 'Pennsylvania Members Rule',
    ruleDesc: 'Routes members in Pennsylvania to PA department',
    ruleType: 'workflow',
    standardFieldCriteria: [sampleStandardCriteria.memberState],
    customFieldCriteria: [],
    status: 'active',
    actions: {
      departmentRouting: {
        departmentCode: 'DEPT_PA',
      },
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  complexRule: {
    id: 'test-rule-2',
    code: 'RULE002',
    ruleName: 'Medicare Orthopedic Providers - PA Seniors',
    ruleDesc: 'Routes Medicare members over 65 in PA with orthopedic providers for specialized review',
    ruleType: 'workflow',
    standardFieldCriteria: [
      {
        field: 'ENROLLMENT_PLAN',
        operator: 'IN',
        values: ['MEDICARE'],
      },
      sampleStandardCriteria.memberAge,
      {
        field: 'MEMBER_STATE',
        operator: 'IN',
        values: ['PA'],
      },
      sampleStandardCriteria.providerSpecialty,
    ],
    customFieldCriteria: [],
    weight: 100,
    status: 'active',
    category: 'Medicare Authorization',
    actions: {
      generateLetters: [
        { letterName: 'Medicare Approval Letter' },
        { letterName: 'Provider Notification' },
      ],
      departmentRouting: {
        departmentCode: 'DEPT_MEDICARE',
      },
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  ruleWithCustomFields: {
    id: 'test-rule-3',
    code: 'RULE003',
    ruleName: 'High-Risk Member Priority Review',
    ruleDesc: 'Creates tasks for high-risk members with custom priority flags',
    ruleType: 'workflow',
    standardFieldCriteria: [sampleStandardCriteria.memberState],
    customFieldCriteria: [sampleCustomCriteria.memberRiskScore, sampleCustomCriteria.requestPriority],
    weight: 150,
    status: 'active',
    actions: {
      createTask: {
        taskType: 'High Risk Review',
        taskReason: 'Member Risk Assessment',
        daysUntilDue: 3,
        taskOwner: 'Dept: RISK_MGMT',
      },
      departmentRouting: {
        departmentCode: 'DEPT_HIGHRISK',
      },
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  inactiveRule: {
    id: 'test-rule-4',
    code: 'RULE004',
    ruleName: 'Inactive Auto-Close Rule',
    ruleDesc: 'Auto-closes specific request types (currently inactive)',
    ruleType: 'workflow',
    standardFieldCriteria: [sampleStandardCriteria.requestType],
    customFieldCriteria: [],
    status: 'inactive',
    actions: {
      close: {
        dispositionCode: 'CLOSED_AUTO',
      },
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
}

// Expected JSON exports
export const expectedExports: Record<string, RuleExport> = {
  simpleRule: {
    code: 'RULE001',
    ruleName: 'Pennsylvania Members Rule',
    ruleDesc: 'Routes members in Pennsylvania to PA department',
    standardFieldCriteria: [sampleStandardCriteria.memberState],
    customFieldCriteria: [],
    isActive: true,
    weight: 100,
  },
  complexRule: {
    code: 'RULE002',
    ruleName: 'Medicare Orthopedic Providers - PA Seniors',
    ruleDesc: 'Routes Medicare members over 65 in PA with orthopedic providers for specialized review',
    standardFieldCriteria: [
      {
        field: 'ENROLLMENT_PLAN',
        operator: 'IN',
        values: ['MEDICARE'],
      },
      sampleStandardCriteria.memberAge,
      {
        field: 'MEMBER_STATE',
        operator: 'IN',
        values: ['PA'],
      },
      sampleStandardCriteria.providerSpecialty,
    ],
    customFieldCriteria: [],
    isActive: true,
    weight: 100,
  },
}

// Natural language test inputs
export const naturalLanguageInputs = {
  simple: 'Members in Pennsylvania',
  complex: 'Medicare members over 65 in Pennsylvania with Servicing Provider specialty orthopedics',
  withCustomField: 'Members in PA with RISK_SCORE not valued with HIGH',
  dateRange: 'Requests from January 1 to December 31 2024',
  emergency: 'Emergency urgent requests',
  multiState: 'Members in Pennsylvania, New Jersey, or New York',
  ageRange: 'Members between 18 and 65 years old',
  providerNPI: 'Servicing provider NPI 1234567890',
}

// Invalid test cases
export const invalidRules = {
  missingDescription: {
    id: 'invalid-1',
    ruleDesc: '',
    standardFieldCriteria: [sampleStandardCriteria.memberState],
    customFieldCriteria: [],
    status: 'active' as const,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  noCriteria: {
    id: 'invalid-2',
    ruleDesc: 'Invalid rule with no criteria',
    standardFieldCriteria: [],
    customFieldCriteria: [],
    status: 'active' as const,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  missingProviderRole: {
    id: 'invalid-3',
    ruleDesc: 'Provider without role',
    standardFieldCriteria: [
      {
        field: 'PROVIDER_PRIMARY_SPECIALTY',
        operator: 'IN',
        values: ['ORTHO'],
        // Missing providerRole
      } as StandardFieldCriteria,
    ],
    customFieldCriteria: [],
    status: 'active' as const,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  wrongOperatorValueCount: {
    id: 'invalid-4',
    ruleDesc: 'EQUALS with multiple values',
    standardFieldCriteria: [
      {
        field: 'MEMBER_AGE',
        operator: 'EQUALS',
        values: ['65', '70'], // Should be exactly 1 value
      },
    ],
    customFieldCriteria: [],
    status: 'active' as const,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  invalidDateFormat: {
    id: 'invalid-5',
    ruleDesc: 'Invalid date format',
    standardFieldCriteria: [
      {
        field: 'REQUEST_FROM_DATE',
        operator: 'GREATER_THAN',
        values: ['01/01/2024'], // Should be YYYY-MM-DD
      },
    ],
    customFieldCriteria: [],
    status: 'active' as const,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  invalidInteger: {
    id: 'invalid-6',
    ruleDesc: 'Invalid integer value',
    standardFieldCriteria: [
      {
        field: 'MEMBER_AGE',
        operator: 'GREATER_THAN',
        values: ['sixty-five'], // Should be numeric
      },
    ],
    customFieldCriteria: [],
    status: 'active' as const,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  customFieldWrongOperator: {
    id: 'invalid-7',
    ruleDesc: 'Custom field with EQUALS operator',
    standardFieldCriteria: [],
    customFieldCriteria: [
      {
        association: 'MEMBER',
        templateId: 'TEST_FIELD',
        operator: 'EQUALS' as any, // Custom fields only support IN/NOT_IN
        values: ['VALUE'],
      },
    ],
    status: 'active' as const,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
}

// Validation error messages
export const expectedErrors = {
  missingDescription: 'Rule description is required',
  noCriteria: 'At least one criteria (standard or custom) is required',
  missingProviderRole: 'Provider role is required for provider fields',
  wrongValueCount: 'requires exactly 1 value',
  invalidDate: 'not a valid date (must be YYYY-MM-DD)',
  invalidInteger: 'not a valid integer',
  customFieldOperator: 'Custom fields only support IN and NOT_IN operators',
}

// Mock AI responses
export const mockAIResponses = {
  simpleRule: {
    ruleDesc: 'Members in Pennsylvania',
    standardFieldCriteria: [
      {
        field: 'MEMBER_STATE',
        operator: 'IN',
        values: ['PA'],
      },
    ],
    customFieldCriteria: [],
    weight: 100,
  },
  complexRule: {
    ruleDesc: 'Medicare members over 65 in Pennsylvania with Servicing Provider specialty orthopedics',
    standardFieldCriteria: [
      {
        field: 'ENROLLMENT_PLAN',
        operator: 'IN',
        values: ['MEDICARE'],
      },
      {
        field: 'MEMBER_AGE',
        operator: 'GREATER_THAN_OR_EQUAL_TO',
        values: ['65'],
      },
      {
        field: 'MEMBER_STATE',
        operator: 'IN',
        values: ['PA'],
      },
      {
        field: 'PROVIDER_PRIMARY_SPECIALTY',
        providerRole: 'SERVICING',
        operator: 'IN',
        values: ['ORTHO'],
      },
    ],
    customFieldCriteria: [],
    weight: 150,
  },
}

// Helper functions
export function createTestRule(overrides: Partial<Rule> = {}): Rule {
  return {
    ...sampleRules.simpleRule,
    ...overrides,
  }
}

export function createTestExport(overrides: Partial<RuleExport> = {}): RuleExport {
  return {
    ...expectedExports.simpleRule,
    ...overrides,
  }
}
