import { useState, useEffect } from 'react'
import RulesTable from './components/RulesTable'
import RuleBuilder from './components/RuleBuilder'
import AIAssistant from './components/AIAssistant'
import { Rule } from './types/rules'
import { initializeDictionaries, refreshDictionaries } from './services/dictionaryService'
import { isConfigured as isFirebaseConfigured } from './config/firebase'
import { Sparkles, AlertCircle, Upload } from 'lucide-react'

function App() {
  const [showRuleBuilder, setShowRuleBuilder] = useState(false)
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const [aiGeneratedRule, setAiGeneratedRule] = useState<Partial<Rule> | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [uploadingDictionaries, setUploadingDictionaries] = useState(false)

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

  const handleUploadDictionaries = async () => {
    setUploadingDictionaries(true)
    try {
      await refreshDictionaries()
      alert('✅ Dictionaries uploaded successfully! You can now use dropdown values in the Rule Builder.')
    } catch (error) {
      console.error('Error uploading dictionaries:', error)
      alert('❌ Failed to upload dictionaries. Check console for errors.')
    } finally {
      setUploadingDictionaries(false)
    }
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
        <div className="mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Rules Pilot
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                AI-Powered Healthcare Authorization Rules Engine
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {isFirebaseConfigured && (
                <button
                  onClick={handleUploadDictionaries}
                  disabled={uploadingDictionaries}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  title="Upload dictionaries to Firestore for dropdown values"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadingDictionaries ? 'Uploading...' : 'Upload Dicts'}
                </button>
              )}
              <button
                onClick={() => setShowAIAssistant(!showAIAssistant)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Assistant
              </button>
            </div>
          </div>
        </div>
      </header>

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
