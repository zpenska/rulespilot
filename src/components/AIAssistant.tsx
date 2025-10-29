import { useState, useMemo } from 'react'
import { Sparkles, Send, X, Loader } from 'lucide-react'
import { generateRuleFromNaturalLanguage } from '../services/ai/claude'
import { Rule } from '../types/rules'
import { useRulesStore } from '../store/rulesStore'

interface AIAssistantProps {
  onRuleGenerated: (rule: Partial<Rule>) => void
  onClose?: () => void
}

export default function AIAssistant({ onRuleGenerated, onClose }: AIAssistantProps) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const currentRuleType = useRulesStore((state) => state.currentRuleType)
  const setAiGeneratedDraft = useRulesStore((state) => state.setAiGeneratedDraft)

  // Context-aware suggestions based on rule type
  const suggestions = useMemo(() => {
    switch (currentRuleType) {
      case 'workflow':
        return [
          'Route all outpatient requests to the outpatient review department',
          'Behavioral health with prior denials to clinical review and generate appeal letter',
          'Emergency inpatient admissions route to UR, generate tracking letter, and add monitoring hint',
        ]
      case 'pullQueue':
        return [
          'Configure pull queue with 12-hour TAT safety window and escalations first',
          'Set department priority order: Cardiology, BH, Oncology',
          'Enable TAT safety override for items due within 8 hours',
        ]
      case 'tat':
        return [
          'Commercial members need authorization decisions within 72 hours from notification',
          'Urgent requests require 24-hour turnaround with 4-hour clinical threshold',
          'Medicare Advantage members get 14 business days ending at 5PM',
        ]
      case 'hints':
        return [
          'Show red alert for high-risk members on member demographics',
          'Display yellow warning for out-of-network providers',
          'Alert reviewers when diagnosis codes typically require prior authorization',
          'Remind reviewers about expedited timelines for urgent requests',
        ]
      case 'skills':
        return [
          // Skills are created manually, not via AI
          'Skills are managed manually in the Skills Management table. Use the "Add New Skill" button to create skill definitions.',
        ]
      default:
        return []
    }
  }, [currentRuleType])

  const handleGenerate = async () => {
    if (!input.trim()) return

    setLoading(true)
    setError('')

    try {
      const generated = await generateRuleFromNaturalLanguage(input, currentRuleType)
      const draftRule: Partial<Rule> = {
        ruleDesc: generated.ruleDesc,
        standardFieldCriteria: generated.standardFieldCriteria,
        customFieldCriteria: generated.customFieldCriteria,
        weight: generated.weight,
        actions: currentRuleType === 'tat' ? undefined : generated.actions,
        hints: currentRuleType === 'hints' ? generated.hints : undefined,
        tatParameters: currentRuleType === 'tat' ? generated.tatParameters : undefined,
        status: 'inactive',
        ruleType: currentRuleType,
      }

      // Save draft to store so the builder can use it
      setAiGeneratedDraft(draftRule)

      // Call the callback which will navigate to the builder
      onRuleGenerated(draftRule)
      setInput('')
    } catch (err) {
      console.error('Error generating rule:', err)
      setError('Failed to generate rule. Please try rephrasing your description.')
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-light rounded-lg">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">AI Assistant</h3>
            <p className="text-sm text-gray-500">Generate rules using natural language</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close AI Assistant"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="mb-6">
        {/* Suggestions */}
        {suggestions.length > 0 && suggestions[0] !== 'Skills are managed manually in the Skills Management table. Use the "Add New Skill" button to create skill definitions.' && (
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Try these examples:</p>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="block w-full text-left px-4 py-3 text-sm text-primary bg-primary-light/50 hover:bg-primary hover:text-white rounded-lg transition-all duration-200 border border-transparent hover:border-primary"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Skills message */}
        {currentRuleType === 'skills' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <p className="text-sm text-blue-800">
              Skills are managed manually in the Skills Management table. Use the <strong>"Add New Skill"</strong> button to create skill definitions.
            </p>
          </div>
        )}

        {/* Input - only show if not skills */}
        {currentRuleType !== 'skills' && (
          <>
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleGenerate()
                  }
                }}
                rows={4}
                className="w-full px-4 py-3 pr-14 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all"
                placeholder="E.g., Create a rule for members in Pennsylvania..."
                disabled={loading}
              />
              <button
                onClick={handleGenerate}
                disabled={loading || !input.trim()}
                className="absolute bottom-3 right-3 p-2.5 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                aria-label="Generate rule"
              >
                {loading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </>
        )}
      </div>

      {currentRuleType !== 'skills' && (
        <div className="border-t border-gray-200 pt-5 mt-6">
          <div className="flex items-start space-x-2">
            <span className="text-sm font-semibold text-gray-700">Tip:</span>
            <p className="text-sm text-gray-600">
              Be specific about field names, operators, and values. The AI understands all standard fields and operators.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
