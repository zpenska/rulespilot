import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useParams } from 'react-router-dom'
import RulesTable from './components/RulesTable'
import { RuleType } from './types/rules'
import { initializeDictionaries } from './services/dictionaryService'
import { isConfigured as isFirebaseConfigured } from './config/firebase'
import { useRulesStore } from './store/rulesStore'
import { AlertCircle } from 'lucide-react'

function App() {
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

      {/* Main Content - Route-based */}
      <main className="flex-1 flex flex-col min-h-0">
        <Routes>
          {/* Default route - workflow rules */}
          <Route path="/" element={<RulesTableWrapper />} />

          {/* All rule type routes - handled by RulesTable internally */}
          <Route path="/:ruleType/*" element={<RulesTableWrapper />} />
        </Routes>
      </main>
    </div>
  )
}

// Wrapper components for route-based rendering

function RulesTableWrapper() {
  const navigate = useNavigate()
  const { ruleType = 'workflow' } = useParams<{ ruleType: RuleType }>()
  const setCurrentRuleType = useRulesStore((state) => state.setCurrentRuleType)

  useEffect(() => {
    setCurrentRuleType(ruleType as RuleType)
  }, [ruleType, setCurrentRuleType])

  // RulesTable now handles all views internally (table, builder, AI, etc.)
  return (
    <RulesTable
      currentRuleType={ruleType as RuleType}
      onRuleTypeChange={(type) => navigate(`/${type}`)}
    />
  )
}

export default App
