import { useState, useEffect } from 'react'
import RulesTable from './components/RulesTable'
import RuleBuilder from './components/RuleBuilder'
import AIAssistant from './components/AIAssistant'
import { Rule } from './types/rules'
import { initializeDictionaries } from './services/dictionaryService'
import { Sparkles } from 'lucide-react'

function App() {
  const [showRuleBuilder, setShowRuleBuilder] = useState(false)
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const [aiGeneratedRule, setAiGeneratedRule] = useState<Partial<Rule> | null>(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    // Initialize dictionaries on app load
    initializeDictionaries()
      .then(() => {
        console.log('Dictionaries initialized')
        setInitializing(false)
      })
      .catch((err) => {
        console.error('Error initializing dictionaries:', err)
        setInitializing(false)
      })
  }, [])

  const handleCreateRule = () => {
    setEditingRule(null)
    setAiGeneratedRule(null)
    setShowRuleBuilder(true)
  }

  const handleEditRule = (rule: Rule) => {
    setEditingRule(rule)
    setAiGeneratedRule(null)
    setShowRuleBuilder(true)
  }

  const handleCloseRuleBuilder = () => {
    setShowRuleBuilder(false)
    setEditingRule(null)
    setAiGeneratedRule(null)
  }

  const handleSaveRule = (_rule: Rule) => {
    // Rule is already saved by RuleBuilder
    setShowRuleBuilder(false)
    setEditingRule(null)
    setAiGeneratedRule(null)
  }

  const handleAIRuleGenerated = (rule: Partial<Rule>) => {
    setAiGeneratedRule(rule)
    setEditingRule(null)
    setShowRuleBuilder(true)
    setShowAIAssistant(false)
  }

  if (initializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing Rules Engine...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Rules Pilot
              </h1>
              <p className="text-sm text-gray-500">
                AI-Powered Healthcare Authorization Rules Engine
              </p>
            </div>
            <button
              onClick={() => setShowAIAssistant(!showAIAssistant)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI Assistant
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* AI Assistant Sidebar */}
        {showAIAssistant && (
          <div className="lg:w-96 border-b lg:border-b-0 lg:border-r border-gray-200 bg-gray-50 p-4">
            <AIAssistant
              onRuleGenerated={handleAIRuleGenerated}
              onClose={() => setShowAIAssistant(false)}
            />
          </div>
        )}

        {/* Rules Table */}
        <div className="flex-1 flex flex-col min-h-0">
          <RulesTable
            onEditRule={handleEditRule}
            onCreateRule={handleCreateRule}
          />
        </div>
      </main>

      {/* Rule Builder Modal */}
      {showRuleBuilder && (
        <RuleBuilder
          rule={aiGeneratedRule ? { ...editingRule, ...aiGeneratedRule } as Rule : editingRule}
          onClose={handleCloseRuleBuilder}
          onSave={handleSaveRule}
        />
      )}
    </div>
  )
}

export default App
