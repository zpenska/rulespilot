import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useParams } from 'react-router-dom'
import RulesTable from './components/RulesTable'
import RuleBuilder from './components/RuleBuilder'
import HintsRuleBuilder from './components/HintsRuleBuilder'
import SkillsManager from './components/SkillsManager'
import AIAssistant from './components/AIAssistant'
import GlobalWorkflowViewer from './components/GlobalWorkflowViewer'
import BranchingWorkflowBuilder from './components/BranchingWorkflowBuilder'
import { Rule, RuleType } from './types/rules'
import { initializeDictionaries } from './services/dictionaryService'
import { isConfigured as isFirebaseConfigured } from './config/firebase'
import { useRulesStore } from './store/rulesStore'
import { getRule } from './services/rulesService'
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

          {/* Rules table by type */}
          <Route path="/:ruleType" element={<RulesTableWrapper />} />

          {/* Create new rule */}
          <Route path="/:ruleType/new" element={<RuleBuilderWrapper />} />

          {/* Edit existing rule */}
          <Route path="/:ruleType/edit/:ruleId" element={<RuleBuilderWrapper />} />

          {/* AI Assistant */}
          <Route path="/:ruleType/ai" element={<AIAssistantWrapper />} />

          {/* Global Workflow Viewer */}
          <Route path="/:ruleType/viewer" element={<GlobalWorkflowViewerWrapper />} />

          {/* Branching Workflow Builder */}
          <Route path="/:ruleType/branching" element={<BranchingWorkflowBuilderWrapper />} />
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

  // Show Skills Manager for skills tab
  if (ruleType === 'skills') {
    return <SkillsManager />
  }

  // Show Rules Table for all other rule types
  return (
    <RulesTable
      currentRuleType={ruleType as RuleType}
      onRuleTypeChange={(type) => navigate(`/${type}`)}
    />
  )
}

function RuleBuilderWrapper() {
  const navigate = useNavigate()
  const { ruleType = 'workflow', ruleId } = useParams<{ ruleType: RuleType; ruleId?: string }>()
  const [rule, setRule] = useState<Rule | null>(null)
  const [loading, setLoading] = useState(!!ruleId)

  useEffect(() => {
    if (ruleId) {
      setLoading(true)
      getRule(ruleId)
        .then(setRule)
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [ruleId])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading rule...</div>
      </div>
    )
  }

  // Use HintsRuleBuilder for hints rules
  if (ruleType === 'hints') {
    return (
      <HintsRuleBuilder
        rule={rule}
        onClose={() => navigate(`/${ruleType}`)}
        onSave={() => navigate(`/${ruleType}`)}
      />
    )
  }

  // Use standard RuleBuilder for workflow and TAT rules
  return (
    <RuleBuilder
      rule={rule}
      onClose={() => navigate(`/${ruleType}`)}
      onSave={() => navigate(`/${ruleType}`)}
    />
  )
}

function AIAssistantWrapper() {
  const navigate = useNavigate()
  const { ruleType = 'workflow' } = useParams<{ ruleType: RuleType }>()

  return (
    <div className="flex-1 flex flex-col bg-white">
      <AIAssistant
        onRuleGenerated={() => {
          // Navigate to rule builder with the generated rule
          navigate(`/${ruleType}/new`)
        }}
        onClose={() => navigate(`/${ruleType}`)}
      />
    </div>
  )
}

function GlobalWorkflowViewerWrapper() {
  const navigate = useNavigate()
  const { ruleType = 'workflow' } = useParams<{ ruleType: RuleType }>()

  return <GlobalWorkflowViewer onClose={() => navigate(`/${ruleType}`)} />
}

function BranchingWorkflowBuilderWrapper() {
  const navigate = useNavigate()
  const { ruleType = 'workflow' } = useParams<{ ruleType: RuleType }>()

  return (
    <BranchingWorkflowBuilder
      onClose={() => navigate(`/${ruleType}`)}
      onSave={(nodes, edges) => {
        console.log('Branching flow saved:', nodes, edges)
        navigate(`/${ruleType}`)
      }}
    />
  )
}

export default App
