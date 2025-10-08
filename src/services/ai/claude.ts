import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true, // Only for development - use a backend in production
})

export interface AIRuleSuggestion {
  ruleName: string
  description: string
  conditions: Array<{
    field: string
    operator: string
    value: string
  }>
  actions: Array<{
    type: string
    config: Record<string, any>
  }>
}

export async function generateRuleSuggestion(prompt: string): Promise<AIRuleSuggestion> {
  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are a rules engine expert. Based on the following user request, generate a rule configuration in JSON format.

User Request: ${prompt}

Respond ONLY with valid JSON in this format:
{
  "ruleName": "descriptive name",
  "description": "what this rule does",
  "conditions": [
    {
      "field": "field name",
      "operator": "equals|notEquals|contains|greaterThan|lessThan",
      "value": "expected value"
    }
  ],
  "actions": [
    {
      "type": "setValue|sendEmail|webhook|calculate|aiProcess",
      "config": {}
    }
  ]
}`,
      },
    ],
  })

  const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

  // Extract JSON from markdown code blocks if present
  const jsonMatch = responseText.match(/```(?:json)?\n?([\s\S]*?)\n?```/) || responseText.match(/\{[\s\S]*\}/)
  const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText

  return JSON.parse(jsonText.trim())
}

export async function improveRuleDescription(
  ruleName: string,
  conditions: any[],
  actions: any[]
): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: `Generate a clear, concise description for this rule:
Rule Name: ${ruleName}
Conditions: ${JSON.stringify(conditions)}
Actions: ${JSON.stringify(actions)}

Respond with only the description, no extra text.`,
      },
    ],
  })

  return message.content[0].type === 'text' ? message.content[0].text : ''
}
