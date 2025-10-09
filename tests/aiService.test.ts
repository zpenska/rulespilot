import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as AnthropicModule from '@anthropic-ai/sdk'
import {
  generateRuleFromNaturalLanguage,
  improveRuleDescription,
  validateAndFixRule,
  getRuleSuggestions,
  chatWithAI,
} from '../src/services/ai/claude'
import { mockAIResponses, sampleRules } from './testData'

// Mock Anthropic
vi.mock('@anthropic-ai/sdk', () => {
  const mockCreate = vi.fn()
  return {
    default: class {
      messages = {
        create: mockCreate,
      }
    },
    mockCreate, // Export the mock so we can access it
  }
})

describe('AI Service - Claude Integration', () => {
  const mockCreate = (AnthropicModule as any).mockCreate

  beforeEach(() => {
    mockCreate.mockClear()
  })

  describe('generateRuleFromNaturalLanguage', () => {
    it('should generate a simple rule from natural language', async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockAIResponses.simpleRule),
          },
        ],
      })

      const result = await generateRuleFromNaturalLanguage('Members in Pennsylvania')

      expect(result).toBeDefined()
      expect(result.ruleDesc).toBe('Members in Pennsylvania')
      expect(result.standardFieldCriteria).toHaveLength(1)
      expect(result.standardFieldCriteria[0].field).toBe('MEMBER_STATE')
      expect(result.standardFieldCriteria[0].values).toContain('PA')
    })

    it('should generate a complex rule with multiple criteria', async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockAIResponses.complexRule),
          },
        ],
      })

      const result = await generateRuleFromNaturalLanguage(
        'Medicare members over 65 in Pennsylvania with Servicing Provider specialty orthopedics'
      )

      expect(result.standardFieldCriteria).toHaveLength(4)
      expect(result.weight).toBe(150)
    })

    it('should handle JSON in markdown code blocks', async () => {
      const jsonInMarkdown = '```json\n' + JSON.stringify(mockAIResponses.simpleRule) + '\n```'
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: jsonInMarkdown }],
      })

      const result = await generateRuleFromNaturalLanguage('Test input')

      expect(result).toBeDefined()
      expect(result.ruleDesc).toBe('Members in Pennsylvania')
    })

    it('should handle JSON without markdown', async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockAIResponses.simpleRule),
          },
        ],
      })

      const result = await generateRuleFromNaturalLanguage('Test input')

      expect(result).toBeDefined()
    })

    it('should throw error for invalid JSON response', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Not valid JSON' }],
      })

      await expect(generateRuleFromNaturalLanguage('Test')).rejects.toThrow()
    })
  })

  describe('improveRuleDescription', () => {
    it('should generate improved description from rule criteria', async () => {
      const improvedDesc = 'Medicare beneficiaries aged 65+ in Pennsylvania receiving orthopedic care'
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: improvedDesc }],
      })

      const result = await improveRuleDescription(sampleRules.complexRule)

      expect(result).toBe(improvedDesc)
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
        })
      )
    })

    it('should handle rules with custom criteria', async () => {
      const improvedDesc = 'Pennsylvania members with high risk scores'
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: improvedDesc }],
      })

      const result = await improveRuleDescription(sampleRules.ruleWithCustomFields)

      expect(result).toBe(improvedDesc)
    })
  })

  describe('validateAndFixRule', () => {
    it('should fix rule validation errors', async () => {
      const fixedRule = {
        ruleDesc: 'Fixed rule description',
        standardFieldCriteria: [
          {
            field: 'MEMBER_AGE',
            operator: 'GREATER_THAN',
            values: ['65'],
          },
        ],
        customFieldCriteria: [],
        weight: 100,
      }

      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(fixedRule) }],
      })

      const errors = ['Invalid date format', 'Missing required field']
      const result = await validateAndFixRule(sampleRules.complexRule, errors)

      expect(result).toBeDefined()
      expect(result.ruleDesc).toBe('Fixed rule description')
    })

    it('should handle JSON in markdown code blocks', async () => {
      const fixedRule = mockAIResponses.simpleRule
      const jsonInMarkdown = '```json\n' + JSON.stringify(fixedRule) + '\n```'

      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: jsonInMarkdown }],
      })

      const result = await validateAndFixRule({}, ['Error'])

      expect(result).toBeDefined()
    })
  })

  describe('getRuleSuggestions', () => {
    it('should return array of rule suggestions', async () => {
      const suggestions = [
        'Members in Pennsylvania requiring authorization',
        'Emergency requests for immediate care',
        'Medicare members over 65',
      ]

      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(suggestions) }],
      })

      const result = await getRuleSuggestions('healthcare authorization')

      expect(result).toBeInstanceOf(Array)
      expect(result).toHaveLength(3)
      expect(result[0]).toContain('Pennsylvania')
    })

    it('should handle suggestions in markdown code blocks', async () => {
      const suggestions = ['Suggestion 1', 'Suggestion 2']
      const jsonInMarkdown = '```json\n' + JSON.stringify(suggestions) + '\n```'

      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: jsonInMarkdown }],
      })

      const result = await getRuleSuggestions('test context')

      expect(result).toHaveLength(2)
    })

    it('should throw error for invalid JSON array', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Not an array' }],
      })

      await expect(getRuleSuggestions('test')).rejects.toThrow()
    })
  })

  describe('chatWithAI', () => {
    it('should handle chat conversation with no history', async () => {
      const response = 'I can help you create healthcare authorization rules.'
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: response }],
      })

      const result = await chatWithAI('How do I create a rule?', [])

      expect(result).toBe(response)
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-sonnet-4-20250514',
          messages: expect.any(Array),
        })
      )
    })

    it('should include conversation history in request', async () => {
      const response = 'Sure, I can help with that.'
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: response }],
      })

      const history = [
        { role: 'user' as const, content: 'Hello' },
        { role: 'assistant' as const, content: 'Hi there!' },
      ]

      const result = await chatWithAI('Can you help me?', history)

      expect(result).toBe(response)
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ content: 'Hello' }),
            expect.objectContaining({ content: 'Hi there!' }),
          ]),
        })
      )
    })

    it('should handle empty response', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'image', text: '' }],
      })

      const result = await chatWithAI('Test', [])

      expect(result).toBe('')
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockCreate.mockRejectedValue(new Error('API Error'))

      await expect(generateRuleFromNaturalLanguage('Test')).rejects.toThrow('API Error')
    })

    it('should handle network timeouts', async () => {
      mockCreate.mockRejectedValue(new Error('Network timeout'))

      await expect(improveRuleDescription(sampleRules.simpleRule)).rejects.toThrow(
        'Network timeout'
      )
    })
  })
})
