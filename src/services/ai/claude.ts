import Anthropic from '@anthropic-ai/sdk'
import { Rule, StandardFieldCriteria, CustomFieldCriteria, RuleActions, RuleType, TATParameters } from '../../types/rules'
import AI_KNOWLEDGE_BASE from '../../config/aiKnowledgeBase'
import AI_KNOWLEDGE_WORKFLOW from '../../config/aiKnowledgeWorkflow'
import AI_KNOWLEDGE_TAT from '../../config/aiKnowledgeTAT'
import AI_KNOWLEDGE_HINTS from '../../config/aiKnowledgeHints'

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true, // Only for development - use a backend in production
})

// Get context-aware knowledge base based on rule type
function getKnowledgeBase(ruleType: RuleType): string {
  switch (ruleType) {
    case 'workflow':
      return AI_KNOWLEDGE_WORKFLOW + '\n\n' + AI_KNOWLEDGE_BASE // Include base + workflow-specific
    case 'tat':
      return AI_KNOWLEDGE_TAT // TAT-specific only (different structure)
    case 'hints':
      return AI_KNOWLEDGE_HINTS + '\n\n' + AI_KNOWLEDGE_BASE // Include base + hints-specific
    case 'pullQueue':
      return AI_KNOWLEDGE_BASE // Pull Queue is configuration, not rules
    case 'skills':
      return AI_KNOWLEDGE_BASE // Skills are definitions, not AI-generated
    default:
      return AI_KNOWLEDGE_BASE
  }
}

export interface AIRuleGeneration {
  ruleDesc: string
  standardFieldCriteria: StandardFieldCriteria[]
  customFieldCriteria: CustomFieldCriteria[]
  weight?: number
  actions?: RuleActions
  tatParameters?: TATParameters
}

/**
 * Generate a rule from natural language description
 */
export async function generateRuleFromNaturalLanguage(
  description: string,
  ruleType: RuleType = 'workflow'
): Promise<AIRuleGeneration> {
  const knowledgeBase = getKnowledgeBase(ruleType)

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `${knowledgeBase}

Based on this description, generate a ${ruleType} rule in the exact JSON format specified above:

"${description}"

Return ONLY valid JSON, no other text.`,
      },
    ],
  })

  const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

  // Extract JSON from markdown code blocks if present
  const jsonMatch =
    responseText.match(/```(?:json)?\n?([\s\S]*?)\n?```/) ||
    responseText.match(/\{[\s\S]*\}/)
  const jsonText = jsonMatch ? jsonMatch[1] || jsonMatch[0] : responseText

  return JSON.parse(jsonText.trim())
}

/**
 * Improve rule description
 */
export async function improveRuleDescription(rule: Partial<Rule>): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `Generate a clear, concise description for this healthcare authorization rule:

Standard Criteria: ${JSON.stringify(rule.standardFieldCriteria, null, 2)}
Custom Criteria: ${JSON.stringify(rule.customFieldCriteria, null, 2)}

The description should explain what conditions trigger this rule in plain English.
Respond with only the description, no extra text.`,
      },
    ],
  })

  return message.content[0].type === 'text' ? message.content[0].text : ''
}

/**
 * Validate and fix a rule
 */
export async function validateAndFixRule(
  rule: Partial<Rule>,
  errors: string[]
): Promise<AIRuleGeneration> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `${AI_KNOWLEDGE_BASE}

This rule has validation errors. Fix them and return a corrected version:

Current Rule:
${JSON.stringify(rule, null, 2)}

Errors:
${errors.join('\n')}

Return ONLY the corrected rule in valid JSON format.`,
      },
    ],
  })

  const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

  const jsonMatch =
    responseText.match(/```(?:json)?\n?([\s\S]*?)\n?```/) ||
    responseText.match(/\{[\s\S]*\}/)
  const jsonText = jsonMatch ? jsonMatch[1] || jsonMatch[0] : responseText

  return JSON.parse(jsonText.trim())
}

/**
 * Get rule suggestions based on context
 */
export async function getRuleSuggestions(context: string): Promise<string[]> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: `${AI_KNOWLEDGE_BASE}

Based on this context: "${context}"

Suggest 3-5 common healthcare authorization rules that might be useful.
Return only a JSON array of rule description strings, no other text.

Example: ["Rule for members in Pennsylvania", "Rule for inpatient requests"]`,
      },
    ],
  })

  const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

  const jsonMatch =
    responseText.match(/```(?:json)?\n?([\s\S]*?)\n?```/) ||
    responseText.match(/\[[\s\S]*\]/)
  const jsonText = jsonMatch ? jsonMatch[1] || jsonMatch[0] : responseText

  return JSON.parse(jsonText.trim())
}

/**
 * Chat with AI assistant about rules
 */
export async function chatWithAI(
  message: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: `${AI_KNOWLEDGE_BASE}

You are an AI assistant helping users build healthcare authorization rules. Answer questions, provide guidance, and help troubleshoot issues.`,
      },
      ...conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user',
        content: message,
      },
    ] as any,
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}
