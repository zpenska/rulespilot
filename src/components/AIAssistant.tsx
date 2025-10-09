import { useState } from 'react'
import { Sparkles, Send, X, Loader } from 'lucide-react'
import { generateRuleFromNaturalLanguage } from '../services/ai/claude'
import { Rule } from '../types/rules'

interface AIAssistantProps {
  onRuleGenerated: (rule: Partial<Rule>) => void
  onClose?: () => void
}

export default function AIAssistant({ onRuleGenerated, onClose }: AIAssistantProps) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [suggestions] = useState([
    'Request with Member in Pennsylvania that has Custom Field MEMCFLD1 not valued with LOW and a Servicing Provider with Primary Specialty Orthopedics',
    'Medicare members over 65 in PA/NJ requiring orthopedic surgery',
    'High-unit physical therapy requests in Q1 2024',
    'Non-emergency requests excluding high-risk members',
  ])

  const handleGenerate = async () => {
    if (!input.trim()) return

    setLoading(true)
    setError('')

    try {
      const generated = await generateRuleFromNaturalLanguage(input)
      onRuleGenerated({
        ruleDesc: generated.ruleDesc,
        standardFieldCriteria: generated.standardFieldCriteria,
        customFieldCriteria: generated.customFieldCriteria,
        weight: generated.weight,
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
    <div className="bg-white rounded-lg shadow-sm border border-indigo-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-medium text-gray-900">AI Assistant</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-3">
          Describe the rule you want to create in natural language, and I'll generate it for you.
        </p>

        {/* Suggestions */}
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-700 mb-2">Try these examples:</p>
          <div className="space-y-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="block w-full text-left px-3 py-2 text-sm text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
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
            rows={3}
            className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            placeholder="E.g., Create a rule for members in Pennsylvania with Custom Field MEMCFLD1 not valued with LOW and a Servicing Provider with Primary Specialty Orthopedics"
            disabled={loading}
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !input.trim()}
            className="absolute bottom-2 right-2 p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="mt-2 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 pt-3">
        <p className="text-xs text-gray-500">
          <strong>Tip:</strong> Be specific about field names, operators, and values. The AI understands all standard fields and operators.
        </p>
      </div>
    </div>
  )
}
