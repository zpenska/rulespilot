import { useState, useEffect } from 'react'
import RulesTable from './components/RulesTable'
import RuleBuilder from './components/RuleBuilder'
import AIAssistant from './components/AIAssistant'
import { Rule } from './types/rules'
import { initializeDictionaries } from './services/dictionaryService'
import { isConfigured as isFirebaseConfigured } from './config/firebase'
import { AlertCircle } from 'lucide-react'

function App() {
  const [showRuleBuilder, setShowRuleBuilder] = useState(false)
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const [aiGeneratedRule, setAiGeneratedRule] = useState<Partial<Rule> | null>(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    // Initialize dictionaries on app load
    const initTimeout = setTimeout(() => {
      console.error('Dictionary initialization timeout')
      setInitializing(false)
    }, 10000) // 10 second timeout

    initializeDictionaries()
      .then(() => {
        console.log('Dictionaries initialized')
        clearTimeout(initTimeout)
        setInitializing(false)
      })
      .catch((err) => {
        console.error('Error initializing dictionaries:', err)
        clearTimeout(initTimeout)
        setInitializing(false)
      })

    return () => clearTimeout(initTimeout)
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
      <div className="min-h-screen bg-bg-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing Rules Engine...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-light flex flex-col">
      {/* Firebase Warning Banner */}
      {!isFirebaseConfigured && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <p className="text-sm text-amber-800">
              <strong>Demo Mode:</strong> Firebase is not configured. Rules will not persist.
              <a
                href="https://github.com/zpenska/rulespilot#firebase-setup"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 underline hover:text-amber-900"
              >
                Add Firebase credentials
              </a> to enable database features.
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Rules Table */}
        <div className="flex-1 flex flex-col min-h-0">
          <RulesTable
            onEditRule={handleEditRule}
            onCreateRule={handleCreateRule}
            onToggleAI={() => setShowAIAssistant(!showAIAssistant)}
          />
        </div>
      </main>

      {/* AI Assistant Modal */}
      {showAIAssistant && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowAIAssistant(false)} />

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <AIAssistant
                onRuleGenerated={handleAIRuleGenerated}
                onClose={() => setShowAIAssistant(false)}
              />
            </div>
          </div>
        </div>
      )}

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
