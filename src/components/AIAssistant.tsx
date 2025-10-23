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
      onRuleGenerated({
        ruleDesc: generated.ruleDesc,
        standardFieldCriteria: generated.standardFieldCriteria,
        customFieldCriteria: generated.customFieldCriteria,
        weight: generated.weight,
        actions: currentRuleType === 'tat' ? undefined : generated.actions,
        tatParameters: currentRuleType === 'tat' ? generated.tatParameters : undefined,
        status: 'inactive',
      })
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
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-3">
          Describe the rule you want to create in natural language, and I'll generate it for you.
        </p>

        {/* Suggestions */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Try these examples:</p>
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="block w-full text-left px-3 py-2 text-sm text-primary bg-primary-light hover:bg-primary hover:text-white rounded transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
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
            className="w-full px-3 py-2.5 pr-12 text-sm border border-gray-300 rounded focus:ring-primary focus:border-primary resize-none"
            placeholder="E.g., Create a rule for members in Pennsylvania..."
            disabled={loading}
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !input.trim()}
            className="absolute bottom-2 right-2 p-2 bg-primary text-white rounded hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-3 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 pt-4 mt-4">
        <p className="text-sm text-gray-500">
          <strong>Tip:</strong> Be specific about field names, operators, and values. The AI understands all standard fields and operators.
        </p>
      </div>
    </div>
  )
}
