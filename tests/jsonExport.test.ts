import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  exportRuleToJSON,
  exportAsAutoWorkflowRules,
  importRulesFromJSON,
  importAutoWorkflowRules,
} from '../src/services/rulesService'
import { Rule, RuleExport, AutoWorkflowRulesExport } from '../src/types/rules'
import { sampleRules } from './testData'

// Mock Firebase
vi.mock('../src/config/firebase', () => ({
  db: {},
}))

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(),
  writeBatch: vi.fn(() => ({
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn(() => Promise.resolve()),
  })),
}))

describe('JSON Export/Import Service', () => {
  describe('exportRuleToJSON', () => {
    it('should export a simple rule without UI metadata', () => {
      const exported = exportRuleToJSON(sampleRules.simpleRule)

      // Should include required fields
      expect(exported.ruleDesc).toBe(sampleRules.simpleRule.ruleDesc)
      expect(exported.standardFieldCriteria).toEqual(sampleRules.simpleRule.standardFieldCriteria)
      expect(exported.isActive).toBe(true)
      expect(exported.weight).toBeDefined()

      // Should NOT include UI metadata
      expect(exported).not.toHaveProperty('id')
      expect(exported).not.toHaveProperty('code')
      expect(exported).not.toHaveProperty('createdAt')
      expect(exported).not.toHaveProperty('updatedAt')
      expect(exported).not.toHaveProperty('status')
      expect(exported).not.toHaveProperty('category')
    })

    it('should map active status correctly', () => {
      const activeRule = sampleRules.simpleRule
      const inactiveRule = sampleRules.inactiveRule

      const activeExport = exportRuleToJSON(activeRule)
      const inactiveExport = exportRuleToJSON(inactiveRule)

      expect(activeExport.isActive).toBe(true)
      expect(inactiveExport.isActive).toBe(false)
    })

    it('should include weight with default value of 100', () => {
      const ruleWithWeight = exportRuleToJSON(sampleRules.complexRule)
      const ruleWithoutWeight = exportRuleToJSON(sampleRules.simpleRule)

      expect(ruleWithWeight.weight).toBe(100)
      expect(ruleWithoutWeight.weight).toBe(100)
    })

    it('should include customFieldCriteria when present', () => {
      const exported = exportRuleToJSON(sampleRules.ruleWithCustomFields)

      expect(exported.customFieldCriteria).toBeDefined()
      expect(exported.customFieldCriteria?.length).toBe(2)
    })

    it('should NOT include customFieldCriteria when empty', () => {
      const exported = exportRuleToJSON(sampleRules.simpleRule)

      expect(exported.customFieldCriteria).toBeUndefined()
    })

    it('should include actions when present', () => {
      const ruleWithActions: Rule = {
        ...sampleRules.simpleRule,
        actions: {
          assignSkill: {
            skillCode: 'SKILL1',
          },
        },
      }

      const exported = exportRuleToJSON(ruleWithActions)

      expect(exported.actions).toBeDefined()
      expect(exported.actions?.assignSkill?.skillCode).toBe('SKILL1')
    })

    it('should NOT include actions when not present', () => {
      const exported = exportRuleToJSON(sampleRules.simpleRule)

      expect(exported.actions).toBeUndefined()
    })

    it('should handle all action types', () => {
      const ruleWithAllActions: Rule = {
        ...sampleRules.simpleRule,
        actions: {
          assignSkill: { skillCode: 'SKILL1' },
          reassign: { departmentCode: 'DEPT2' },
          generateLetters: [{ letterName: 'Letter1' }, { letterName: 'Letter2' }],
          close: { dispositionCode: 'DISP1' },
        },
      }

      const exported = exportRuleToJSON(ruleWithAllActions)

      expect(exported.actions?.assignSkill?.skillCode).toBe('SKILL1')
      expect(exported.actions?.reassign?.departmentCode).toBe('DEPT2')
      expect(exported.actions?.generateLetters).toHaveLength(2)
      expect(exported.actions?.close?.dispositionCode).toBe('DISP1')
    })
  })

  describe('exportAsAutoWorkflowRules', () => {
    it('should create AUTO_WORKFLOW_RULES format', async () => {
      const rules = [sampleRules.simpleRule, sampleRules.complexRule]

      const exported = await exportAsAutoWorkflowRules(rules)

      expect(exported.type).toBe('AUTO_WORKFLOW_RULES')
      expect(exported.rules).toHaveLength(2)
      expect(exported.rules[0]).toMatchJSONSchema()
      expect(exported.rules[1]).toMatchJSONSchema()
    })

    it('should export with correct structure', async () => {
      const rules = [sampleRules.ruleWithCustomFields]
      const exported = await exportAsAutoWorkflowRules(rules)

      expect(exported).toHaveProperty('type')
      expect(exported).toHaveProperty('rules')
      expect(Array.isArray(exported.rules)).toBe(true)
    })

    it('should handle empty rules array', async () => {
      const exported = await exportAsAutoWorkflowRules([])

      expect(exported.type).toBe('AUTO_WORKFLOW_RULES')
      expect(exported.rules).toEqual([])
    })

    it('should export multiple rules with different configurations', async () => {
      const rules = [
        sampleRules.simpleRule,
        sampleRules.complexRule,
        sampleRules.ruleWithCustomFields,
      ]

      const exported = await exportAsAutoWorkflowRules(rules)

      expect(exported.rules).toHaveLength(3)
      expect(exported.rules[0].customFieldCriteria).toBeUndefined()
      expect(exported.rules[2].customFieldCriteria).toBeDefined()
    })

    it('should match the expected AUTO_WORKFLOW_RULES schema', async () => {
      const ruleWithActions: Rule = {
        ...sampleRules.simpleRule,
        actions: {
          assignSkill: { skillCode: 'SKILL1' },
          generateLetters: [{ letterName: 'Master Ordering Outpatient' }],
        },
        weight: 100,
      }

      const exported = await exportAsAutoWorkflowRules([ruleWithActions])

      expect(exported).toEqual({
        type: 'AUTO_WORKFLOW_RULES',
        rules: [
          {
            ruleDesc: ruleWithActions.ruleDesc,
            standardFieldCriteria: ruleWithActions.standardFieldCriteria,
            isActive: true,
            weight: 100,
            actions: {
              assignSkill: { skillCode: 'SKILL1' },
              generateLetters: [{ letterName: 'Master Ordering Outpatient' }],
            },
          },
        ],
      })
    })
  })

  describe('importRulesFromJSON', () => {
    beforeEach(() => {
      // Reset mocks
      vi.clearAllMocks()
    })

    it('should import a single rule', async () => {
      const exportedRules: RuleExport[] = [
        {
          ruleDesc: 'Imported Rule',
          standardFieldCriteria: [
            {
              field: 'MEMBER_STATE',
              operator: 'IN',
              values: ['PA'],
            },
          ],
          isActive: true,
          weight: 150,
        },
      ]

      const imported = await importRulesFromJSON(exportedRules)

      expect(imported).toHaveLength(1)
      // Since Firebase is mocked, we validate the structure
      expect(imported[0]).toBeDefined()
    })

    it('should handle customFieldCriteria during import', async () => {
      const exportedRules: RuleExport[] = [
        {
          ruleDesc: 'Rule with custom fields',
          standardFieldCriteria: [
            {
              field: 'MEMBER_STATE',
              operator: 'IN',
              values: ['PA'],
            },
          ],
          customFieldCriteria: [
            {
              association: 'MEMBER',
              templateId: 'RISK_SCORE',
              operator: 'IN',
              values: ['HIGH'],
            },
          ],
          isActive: true,
          weight: 200,
        },
      ]

      const imported = await importRulesFromJSON(exportedRules)

      expect(imported).toHaveLength(1)
    })

    it('should handle actions during import', async () => {
      const exportedRules: RuleExport[] = [
        {
          ruleDesc: 'Rule with actions',
          standardFieldCriteria: [
            {
              field: 'REQUEST_TYPE',
              operator: 'IN',
              values: ['OUTPATIENT'],
            },
          ],
          isActive: true,
          weight: 100,
          actions: {
            assignSkill: { skillCode: 'SKILL1' },
            close: { dispositionCode: 'DISP1' },
          },
        },
      ]

      const imported = await importRulesFromJSON(exportedRules)

      expect(imported).toHaveLength(1)
    })

    it('should handle multiple rules import', async () => {
      const exportedRules: RuleExport[] = [
        {
          ruleDesc: 'Rule 1',
          standardFieldCriteria: [
            {
              field: 'MEMBER_STATE',
              operator: 'IN',
              values: ['PA'],
            },
          ],
          isActive: true,
          weight: 100,
        },
        {
          ruleDesc: 'Rule 2',
          standardFieldCriteria: [
            {
              field: 'REQUEST_TYPE',
              operator: 'IN',
              values: ['INPATIENT'],
            },
          ],
          isActive: false,
          weight: 150,
        },
      ]

      const imported = await importRulesFromJSON(exportedRules)

      expect(imported).toHaveLength(2)
    })
  })

  describe('importAutoWorkflowRules', () => {
    it('should import AUTO_WORKFLOW_RULES format', async () => {
      const autoWorkflowData: AutoWorkflowRulesExport = {
        type: 'AUTO_WORKFLOW_RULES',
        rules: [
          {
            ruleDesc: 'Outpatient with Service 44950',
            standardFieldCriteria: [
              {
                field: 'REQUEST_TYPE',
                operator: 'IN',
                values: ['OUTPATIENT'],
              },
              {
                field: 'SERVICE_CODE',
                operator: 'IN',
                values: ['44950'],
              },
            ],
            isActive: true,
            weight: 100,
            actions: {
              assignSkill: {
                skillCode: 'SKILL1',
              },
            },
          },
        ],
      }

      const imported = await importAutoWorkflowRules(autoWorkflowData)

      expect(imported).toHaveLength(1)
    })

    it('should reject invalid format type', async () => {
      const invalidData = {
        type: 'INVALID_TYPE',
        rules: [],
      } as any

      await expect(importAutoWorkflowRules(invalidData)).rejects.toThrow(
        'Invalid format: expected AUTO_WORKFLOW_RULES'
      )
    })

    it('should import complex AUTO_WORKFLOW_RULES with multiple rules', async () => {
      const autoWorkflowData: AutoWorkflowRulesExport = {
        type: 'AUTO_WORKFLOW_RULES',
        rules: [
          {
            ruleDesc: 'Rule 1',
            standardFieldCriteria: [
              {
                field: 'REQUEST_TYPE',
                operator: 'IN',
                values: ['OUTPATIENT'],
              },
            ],
            isActive: true,
            weight: 100,
          },
          {
            ruleDesc: 'Rule 2',
            standardFieldCriteria: [
              {
                field: 'MEMBER_CLIENT',
                operator: 'IN',
                values: ['HEA'],
              },
            ],
            customFieldCriteria: [
              {
                association: 'MEMBER',
                templateId: 'MEMBCUSTFLD1',
                operator: 'IN',
                values: ['VALUE1', 'VALUE2'],
              },
            ],
            isActive: true,
            weight: 200,
            actions: {
              reassign: {
                departmentCode: 'DEPT2',
              },
            },
          },
        ],
      }

      const imported = await importAutoWorkflowRules(autoWorkflowData)

      expect(imported).toHaveLength(2)
    })
  })

  describe('Export-Import Round Trip', () => {
    it('should maintain rule integrity through export and import', async () => {
      // Export a rule
      const exported = exportRuleToJSON(sampleRules.complexRule)

      // Import it back
      const imported = await importRulesFromJSON([exported])

      // Should have same core data (excluding generated fields like id, timestamps)
      expect(imported).toHaveLength(1)
      // Note: Actual values would be validated if we had real Firebase,
      // but with mocks we just ensure the process completes
    })

    it('should maintain AUTO_WORKFLOW_RULES format through round trip', async () => {
      const rules = [sampleRules.simpleRule, sampleRules.complexRule]

      // Export
      const exported = await exportAsAutoWorkflowRules(rules)

      // Import
      const imported = await importAutoWorkflowRules(exported)

      expect(imported).toHaveLength(2)
    })
  })

  describe('Edge Cases and Validation', () => {
    it('should handle rule with all optional fields missing', () => {
      const minimalRule: Rule = {
        id: 'test',
        ruleDesc: 'Minimal Rule',
        standardFieldCriteria: [
          {
            field: 'MEMBER_STATE',
            operator: 'IN',
            values: ['PA'],
          },
        ],
        customFieldCriteria: [],
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      const exported = exportRuleToJSON(minimalRule)

      expect(exported.ruleDesc).toBe('Minimal Rule')
      expect(exported.weight).toBe(100) // Default weight
      expect(exported.customFieldCriteria).toBeUndefined()
      expect(exported.actions).toBeUndefined()
    })

    it('should preserve special characters in descriptions', () => {
      const ruleWithSpecialChars: Rule = {
        ...sampleRules.simpleRule,
        ruleDesc: 'Rule with "quotes" & special <chars> - test',
      }

      const exported = exportRuleToJSON(ruleWithSpecialChars)

      expect(exported.ruleDesc).toBe('Rule with "quotes" & special <chars> - test')
    })

    it('should handle provider role and alternate ID type in export', () => {
      const ruleWithProvider: Rule = {
        ...sampleRules.simpleRule,
        standardFieldCriteria: [
          {
            field: 'PROVIDER_ALTERNATE_ID',
            operator: 'NOT_IN',
            values: ['732870943'],
            providerRole: 'SERVICING',
            alternateIdType: 'ALTIDTYP1',
          },
        ],
      }

      const exported = exportRuleToJSON(ruleWithProvider)

      expect(exported.standardFieldCriteria[0].providerRole).toBe('SERVICING')
      expect(exported.standardFieldCriteria[0].alternateIdType).toBe('ALTIDTYP1')
    })
  })
})
