import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createRule,
  getRule,
  getAllRules,
  getActiveRules,
  getInactiveRules,
  updateRule,
  deleteRule,
  cloneRule,
  bulkUpdateStatus,
  bulkDeleteRules,
  searchRules,
} from '../src/services/rulesService'
import * as firestore from 'firebase/firestore'
import { Rule } from '../src/types/rules'
import { sampleRules, sampleStandardCriteria } from './testData'

// Mock Firebase
vi.mock('../src/config/firebase', () => ({
  db: {},
}))

// Mock Firestore functions
vi.mock('firebase/firestore')

describe('Rules Service - CRUD Operations', () => {
  const mockSetDoc = vi.mocked(firestore.setDoc)
  const mockGetDoc = vi.mocked(firestore.getDoc)
  const mockGetDocs = vi.mocked(firestore.getDocs)
  const mockDeleteDoc = vi.mocked(firestore.deleteDoc)
  const mockWriteBatch = vi.mocked(firestore.writeBatch)

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mock implementations
    mockWriteBatch.mockReturnValue({
      update: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    } as any)
  })

  describe('createRule', () => {
    it('should create a new rule with generated id and timestamps', async () => {
      mockSetDoc.mockResolvedValue(undefined)

      const newRule = {
        ruleDesc: 'Test Rule',
        standardFieldCriteria: [sampleStandardCriteria.memberState],
        customFieldCriteria: [],
        status: 'active' as const,
      }

      const created = await createRule(newRule)

      expect(created.id).toBeDefined()
      expect(created.code).toBeDefined()
      expect(created.code).toMatch(/^RULE[A-Z0-9]{8}$/)
      expect(created.createdAt).toBeDefined()
      expect(created.updatedAt).toBeDefined()
      expect(created.ruleDesc).toBe('Test Rule')
      expect(mockSetDoc).toHaveBeenCalled()
    })

    it('should use provided code if given', async () => {
      mockSetDoc.mockResolvedValue(undefined)

      const newRule = {
        code: 'CUSTOM001',
        ruleDesc: 'Test Rule',
        standardFieldCriteria: [sampleStandardCriteria.memberState],
        customFieldCriteria: [],
        status: 'active' as const,
      }

      const created = await createRule(newRule)

      expect(created.code).toBe('CUSTOM001')
    })

    it('should create rule with all optional fields', async () => {
      mockSetDoc.mockResolvedValue(undefined)

      const newRule = {
        ruleDesc: 'Complex Rule',
        standardFieldCriteria: [sampleStandardCriteria.memberState],
        customFieldCriteria: [
          {
            association: 'MEMBER' as const,
            templateId: 'TEST',
            operator: 'IN' as const,
            values: ['VALUE1'],
          },
        ],
        status: 'active' as const,
        weight: 150,
        category: 'Test Category',
        actions: {
          assignSkill: { skillCode: 'SKILL1' },
        },
      }

      const created = await createRule(newRule)

      expect(created.weight).toBe(150)
      expect(created.category).toBe('Test Category')
      expect(created.actions?.assignSkill?.skillCode).toBe('SKILL1')
    })

    it('should handle creation errors', async () => {
      mockSetDoc.mockRejectedValue(new Error('Firebase error'))

      const newRule = {
        ruleDesc: 'Test Rule',
        standardFieldCriteria: [sampleStandardCriteria.memberState],
        customFieldCriteria: [],
        status: 'active' as const,
      }

      await expect(createRule(newRule)).rejects.toThrow('Firebase error')
    })
  })

  describe('getRule', () => {
    it('should get a rule by id', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => sampleRules.simpleRule,
      })

      const rule = await getRule('test-rule-1')

      expect(rule).toEqual(sampleRules.simpleRule)
      expect(mockGetDoc).toHaveBeenCalled()
    })

    it('should return null if rule does not exist', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      })

      const rule = await getRule('non-existent')

      expect(rule).toBeNull()
    })

    it('should handle errors when fetching rule', async () => {
      mockGetDoc.mockRejectedValue(new Error('Network error'))

      await expect(getRule('test-rule-1')).rejects.toThrow('Network error')
    })
  })

  describe('getAllRules', () => {
    it('should get all rules', async () => {
      const mockDocs = [
        { data: () => sampleRules.simpleRule },
        { data: () => sampleRules.complexRule },
        { data: () => sampleRules.inactiveRule },
      ]

      mockGetDocs.mockResolvedValue({ docs: mockDocs })

      const rules = await getAllRules()

      expect(rules).toHaveLength(3)
      expect(rules[0]).toEqual(sampleRules.simpleRule)
    })

    it('should return empty array when no rules exist', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] })

      const rules = await getAllRules()

      expect(rules).toEqual([])
    })
  })

  describe('getActiveRules', () => {
    it('should get only active rules', async () => {
      const mockDocs = [
        { data: () => sampleRules.simpleRule },
        { data: () => sampleRules.complexRule },
      ]

      mockGetDocs.mockResolvedValue({ docs: mockDocs })

      const rules = await getActiveRules()

      expect(rules).toHaveLength(2)
      expect(rules.every((r) => r.status === 'active')).toBe(true)
    })
  })

  describe('getInactiveRules', () => {
    it('should get only inactive rules', async () => {
      const mockDocs = [{ data: () => sampleRules.inactiveRule }]

      mockGetDocs.mockResolvedValue({ docs: mockDocs })

      const rules = await getInactiveRules()

      expect(rules).toHaveLength(1)
      expect(rules[0].status).toBe('inactive')
    })
  })

  describe('updateRule', () => {
    it('should update a rule', async () => {
      mockSetDoc.mockResolvedValue(undefined)

      await updateRule('test-rule-1', {
        ruleDesc: 'Updated Description',
      })

      expect(mockSetDoc).toHaveBeenCalled()
    })

    it('should update status', async () => {
      mockSetDoc.mockResolvedValue(undefined)

      await updateRule('test-rule-1', {
        status: 'inactive',
      })

      expect(mockSetDoc).toHaveBeenCalled()
    })

    it('should update weight', async () => {
      mockSetDoc.mockResolvedValue(undefined)

      await updateRule('test-rule-1', {
        weight: 200,
      })

      expect(mockSetDoc).toHaveBeenCalled()
    })

    it('should handle update errors', async () => {
      mockSetDoc.mockRejectedValue(new Error('Update failed'))

      await expect(
        updateRule('test-rule-1', { ruleDesc: 'Updated' })
      ).rejects.toThrow('Update failed')
    })
  })

  describe('deleteRule', () => {
    it('should delete a rule', async () => {
      mockDeleteDoc.mockResolvedValue(undefined)

      await deleteRule('test-rule-1')

      expect(mockDeleteDoc).toHaveBeenCalled()
    })

    it('should handle delete errors', async () => {
      mockDeleteDoc.mockRejectedValue(new Error('Delete failed'))

      await expect(deleteRule('test-rule-1')).rejects.toThrow('Delete failed')
    })
  })

  describe('cloneRule', () => {
    it('should clone a rule with new id and code', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => sampleRules.complexRule,
      })
      mockSetDoc.mockResolvedValue(undefined)

      const cloned = await cloneRule('test-rule-2')

      expect(cloned.id).not.toBe(sampleRules.complexRule.id)
      expect(cloned.code).not.toBe(sampleRules.complexRule.code)
      expect(cloned.ruleDesc).toContain('(Copy)')
      expect(cloned.status).toBe('inactive')
    })

    it('should throw error if original rule not found', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      })

      await expect(cloneRule('non-existent')).rejects.toThrow('Rule not found')
    })

    it('should preserve criteria when cloning', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => sampleRules.complexRule,
      })
      mockSetDoc.mockResolvedValue(undefined)

      const cloned = await cloneRule('test-rule-2')

      expect(cloned.standardFieldCriteria).toEqual(sampleRules.complexRule.standardFieldCriteria)
    })
  })

  describe('bulkUpdateStatus', () => {
    it('should update status for multiple rules', async () => {
      const mockBatch = {
        update: vi.fn(),
        delete: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      }
      mockWriteBatch.mockReturnValue(mockBatch as any)

      await bulkUpdateStatus(['rule1', 'rule2', 'rule3'], 'active')

      expect(mockBatch.update).toHaveBeenCalledTimes(3)
      expect(mockBatch.commit).toHaveBeenCalled()
    })

    it('should handle empty array', async () => {
      const mockBatch = {
        update: vi.fn(),
        delete: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      }
      mockWriteBatch.mockReturnValue(mockBatch as any)

      await bulkUpdateStatus([], 'active')

      expect(mockBatch.update).not.toHaveBeenCalled()
      expect(mockBatch.commit).toHaveBeenCalled()
    })

    it('should handle batch update errors', async () => {
      const mockBatch = {
        update: vi.fn(),
        delete: vi.fn(),
        commit: vi.fn().mockRejectedValue(new Error('Batch update failed')),
      }
      mockWriteBatch.mockReturnValue(mockBatch as any)

      await expect(bulkUpdateStatus(['rule1'], 'active')).rejects.toThrow('Batch update failed')
    })
  })

  describe('bulkDeleteRules', () => {
    it('should delete multiple rules', async () => {
      const mockBatch = {
        update: vi.fn(),
        delete: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      }
      mockWriteBatch.mockReturnValue(mockBatch as any)

      await bulkDeleteRules(['rule1', 'rule2', 'rule3'])

      expect(mockBatch.delete).toHaveBeenCalledTimes(3)
      expect(mockBatch.commit).toHaveBeenCalled()
    })

    it('should handle empty array', async () => {
      const mockBatch = {
        update: vi.fn(),
        delete: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      }
      mockWriteBatch.mockReturnValue(mockBatch as any)

      await bulkDeleteRules([])

      expect(mockBatch.delete).not.toHaveBeenCalled()
      expect(mockBatch.commit).toHaveBeenCalled()
    })

    it('should handle batch delete errors', async () => {
      const mockBatch = {
        update: vi.fn(),
        delete: vi.fn(),
        commit: vi.fn().mockRejectedValue(new Error('Batch delete failed')),
      }
      mockWriteBatch.mockReturnValue(mockBatch as any)

      await expect(bulkDeleteRules(['rule1'])).rejects.toThrow('Batch delete failed')
    })
  })

  describe('searchRules', () => {
    beforeEach(() => {
      const mockDocs = [
        { data: () => ({ ...sampleRules.simpleRule, code: 'RULE001' }) },
        { data: () => ({ ...sampleRules.complexRule, code: 'RULE002', category: 'Medicare' }) },
        { data: () => ({ ...sampleRules.inactiveRule, code: 'RULE003' }) },
      ]

      mockGetDocs.mockResolvedValue({ docs: mockDocs })
    })

    it('should search by code', async () => {
      const results = await searchRules('RULE001')

      expect(results).toHaveLength(1)
      expect(results[0].code).toBe('RULE001')
    })

    it('should search by description (case insensitive)', async () => {
      const results = await searchRules('pennsylvania')

      expect(results.length).toBeGreaterThan(0)
    })

    it('should search by category', async () => {
      const results = await searchRules('medicare')

      expect(results).toHaveLength(1)
      expect(results[0].category).toBe('Medicare')
    })

    it('should return empty array for no matches', async () => {
      const results = await searchRules('nonexistent')

      expect(results).toEqual([])
    })

    it('should handle partial matches', async () => {
      const results = await searchRules('RULE')

      expect(results.length).toBeGreaterThan(0)
    })

    it('should be case insensitive', async () => {
      const resultsLower = await searchRules('pennsylvania')
      const resultsUpper = await searchRules('PENNSYLVANIA')
      const resultsMixed = await searchRules('PenNsYlVaNia')

      expect(resultsLower.length).toBe(resultsUpper.length)
      expect(resultsLower.length).toBe(resultsMixed.length)
    })
  })

  describe('Edge Cases', () => {
    it('should handle rule with extremely long description', async () => {
      mockSetDoc.mockResolvedValue(undefined)

      const longDesc = 'A'.repeat(1000)
      const newRule = {
        ruleDesc: longDesc,
        standardFieldCriteria: [sampleStandardCriteria.memberState],
        customFieldCriteria: [],
        status: 'active' as const,
      }

      const created = await createRule(newRule)

      expect(created.ruleDesc).toBe(longDesc)
    })

    it('should handle rule with many criteria', async () => {
      mockSetDoc.mockResolvedValue(undefined)

      const manyCriteria = Array(50)
        .fill(null)
        .map((_, i) => ({
          field: 'MEMBER_STATE' as const,
          operator: 'IN' as const,
          values: [`STATE${i}`],
        }))

      const newRule = {
        ruleDesc: 'Rule with many criteria',
        standardFieldCriteria: manyCriteria,
        customFieldCriteria: [],
        status: 'active' as const,
      }

      const created = await createRule(newRule)

      expect(created.standardFieldCriteria).toHaveLength(50)
    })

    it('should preserve special characters in rule code', async () => {
      mockSetDoc.mockResolvedValue(undefined)

      const newRule = {
        code: 'RULE_2024-01',
        ruleDesc: 'Test',
        standardFieldCriteria: [sampleStandardCriteria.memberState],
        customFieldCriteria: [],
        status: 'active' as const,
      }

      const created = await createRule(newRule)

      expect(created.code).toBe('RULE_2024-01')
    })

    it('should handle concurrent updates gracefully', async () => {
      mockSetDoc.mockResolvedValue(undefined)

      const update1 = updateRule('rule1', { weight: 100 })
      const update2 = updateRule('rule1', { weight: 200 })

      await Promise.all([update1, update2])

      expect(mockSetDoc).toHaveBeenCalledTimes(2)
    })

    it('should handle very large bulk operations', async () => {
      const mockBatch = {
        update: vi.fn(),
        delete: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      }
      mockWriteBatch.mockReturnValue(mockBatch as any)

      const manyIds = Array(100)
        .fill(null)
        .map((_, i) => `rule${i}`)

      await bulkUpdateStatus(manyIds, 'active')

      expect(mockBatch.update).toHaveBeenCalledTimes(100)
    })
  })
})
