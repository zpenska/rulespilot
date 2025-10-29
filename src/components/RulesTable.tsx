import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Search, Plus, Download, Upload, Trash2, Power, PowerOff, Copy, Eye, MoreVertical, Settings, Sparkles, Workflow, Globe } from 'lucide-react'
import { Rule, RuleType } from '../types/rules'
import {
  deleteRule,
  updateRule,
  bulkUpdateStatus,
  bulkDeleteRules,
  cloneRule,
  exportWorkflowRulesForTab,
  exportHintsRulesForTab,
  exportTATRulesForTab,
  exportGlobalRulesAndSkills,
  importGlobalRulesAndSkills,
  importRulesFromJSON,
  importTATRulesFromJSON,
  isTATRuleFormat,
  subscribeToRules,
  getRule,
  exportSkills,
  importSkills,
} from '../services/rulesService'
import PullQueueConfig from './PullQueueConfig'
import TATConfig from './TATConfig'
import SkillsManager from './SkillsManager'
import SkillForm from './SkillForm'
import RuleBuilder from './RuleBuilder'
import HintsRuleBuilder from './HintsRuleBuilder'
import AIAssistant from './AIAssistant'
import GlobalWorkflowViewer from './GlobalWorkflowViewer'
import BranchingWorkflowBuilder from './BranchingWorkflowBuilder'
import { SkillDefinition } from '../types/rules'
import { getAtoms } from '../utils/ruleUtils'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

type TabFilter = 'all' | 'active' | 'inactive'

interface RulesTableProps {
  currentRuleType: RuleType
  onRuleTypeChange: (ruleType: RuleType) => void
}

export default function RulesTable({ currentRuleType, onRuleTypeChange }: RulesTableProps) {
  const navigate = useNavigate()
  const { '*': routeSuffix } = useParams<{ '*'?: string }>()
  const [rules, setRules] = useState<Rule[]>([])
  const [filteredRules, setFilteredRules] = useState<Rule[]>([])
  const [selectedRules, setSelectedRules] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<TabFilter>('all')
  const [loading, setLoading] = useState(true)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false)
  const [showTATConfig, setShowTATConfig] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const settingsDropdownRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})

  // Check what view we're in based on URL
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const [ruleBuilderLoading, setRuleBuilderLoading] = useState(false)
  const [editingSkill, setEditingSkill] = useState<SkillDefinition | null>(null)
  const [skillFormLoading, setSkillFormLoading] = useState(false)

  // Extract ruleId from routeSuffix (e.g., "edit/abc123" -> "abc123")
  const ruleId = routeSuffix?.startsWith('edit/') ? routeSuffix.slice(5) : undefined

  const isCreatingNew = routeSuffix === 'new'
  const isEditingRule = routeSuffix?.startsWith('edit/') && !!ruleId
  const isAIView = routeSuffix === 'ai'
  const isViewerView = routeSuffix === 'viewer'
  const isBranchingView = routeSuffix === 'branching'
  const showRuleBuilder = isCreatingNew || isEditingRule
  const showSkillForm = currentRuleType === 'skills' && (isCreatingNew || isEditingRule)

  // Load rule for editing
  useEffect(() => {
    if (isEditingRule && ruleId && currentRuleType !== 'skills') {
      setRuleBuilderLoading(true)
      getRule(ruleId)
        .then(setEditingRule)
        .catch(console.error)
        .finally(() => setRuleBuilderLoading(false))
    } else {
      setEditingRule(null)
    }
  }, [isEditingRule, ruleId, currentRuleType])

  // Load skill for editing
  useEffect(() => {
    if (isEditingRule && ruleId && currentRuleType === 'skills') {
      setSkillFormLoading(true)
      const skillRef = doc(db, 'skills', ruleId)
      getDoc(skillRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            setEditingSkill({ id: snapshot.id, ...snapshot.data() } as SkillDefinition)
          }
        })
        .catch(console.error)
        .finally(() => setSkillFormLoading(false))
    } else {
      setEditingSkill(null)
    }
  }, [isEditingRule, ruleId, currentRuleType])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is on any of the dropdown buttons
      const isButtonClick = Object.values(buttonRefs.current).some(
        (btn) => btn && btn.contains(event.target as Node)
      )

      if (!isButtonClick && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null)
        setDropdownPosition(null)
      }
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target as Node)) {
        setShowSettingsDropdown(false)
      }
    }

    if (openDropdown || showSettingsDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdown, showSettingsDropdown])

  // Subscribe to rules changes (filtered by current rule type)
  // Skip subscription for pullQueue since it's a config page, not a rules list
  useEffect(() => {
    if (currentRuleType === 'pullQueue') {
      setRules([])
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe = subscribeToRules(
      (updatedRules) => {
        setRules(updatedRules)
        setLoading(false)
      },
      undefined,
      currentRuleType
    )

    return () => unsubscribe()
  }, [currentRuleType])

  // Filter rules based on active tab and search
  useEffect(() => {
    let filtered = rules

    // Filter by tab
    if (activeTab === 'active') {
      filtered = filtered.filter((r) => r.status === 'active')
    } else if (activeTab === 'inactive') {
      filtered = filtered.filter((r) => r.status === 'inactive')
    }

    // Filter by search
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (r) =>
          r.code?.toLowerCase().includes(term) ||
          r.ruleName?.toLowerCase().includes(term) ||
          r.ruleDesc?.toLowerCase().includes(term)
      )
    }

    setFilteredRules(filtered)
  }, [rules, activeTab, searchTerm])

  const handleSelectAll = () => {
    if (selectedRules.size === filteredRules.length) {
      setSelectedRules(new Set())
    } else {
      setSelectedRules(new Set(filteredRules.map((r) => r.id)))
    }
  }

  const handleSelectRule = (ruleId: string) => {
    const newSelected = new Set(selectedRules)
    if (newSelected.has(ruleId)) {
      newSelected.delete(ruleId)
    } else {
      newSelected.add(ruleId)
    }
    setSelectedRules(newSelected)
  }

  const handleToggleStatus = async (rule: Rule) => {
    await updateRule(rule.id, {
      status: rule.status === 'active' ? 'inactive' : 'active',
    })
  }

  const handleDelete = async (ruleId: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      await deleteRule(ruleId)
    }
  }

  const handleClone = async (rule: Rule) => {
    const cloned = await cloneRule(rule.id)
    navigate(`/${currentRuleType}/edit/${cloned.id}`)
  }

  const handleBulkActivate = async () => {
    await bulkUpdateStatus(Array.from(selectedRules), 'active')
    setSelectedRules(new Set())
  }

  const handleBulkDeactivate = async () => {
    await bulkUpdateStatus(Array.from(selectedRules), 'inactive')
    setSelectedRules(new Set())
  }

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedRules.size} rules?`)) {
      await bulkDeleteRules(Array.from(selectedRules))
      setSelectedRules(new Set())
    }
  }

  const handleExportGlobal = async () => {
    const data = await exportGlobalRulesAndSkills()
    downloadJSON(data, 'global-rules.json')
  }

  const handleExportSkills = async () => {
    const data = await exportSkills()
    downloadJSON(data, 'skills.json')
  }

  const handleImportSkills = () => {
    fileInputRef.current?.click()
  }

  const handleExportTabRules = async () => {
    let data: unknown
    let filename: string

    try {
      if (currentRuleType === 'workflow') {
        data = await exportWorkflowRulesForTab()
        filename = 'workflow-rules.json'
      } else if (currentRuleType === 'hints') {
        data = await exportHintsRulesForTab()
        filename = 'hints-rules.json'
      } else if (currentRuleType === 'tat') {
        data = await exportTATRulesForTab()
        filename = 'tat-rules.json'
      } else {
        alert(`Export not supported for ${currentRuleType} tab`)
        return
      }

      downloadJSON(data, filename)
    } catch (error) {
      console.error('Error exporting tab rules:', error)
      alert('Failed to export rules')
    }
  }

  const handleImportRules = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const fileContent = await file.text()
      const jsonData = JSON.parse(fileContent)

      // Check if it's a global export format
      if (jsonData.type === 'GLOBAL_RULES_EXPORT') {
        const result = await importGlobalRulesAndSkills(jsonData)
        alert(
          `Successfully imported Global Export:\n` +
          `- ${result.workflowCount} Workflow rules\n` +
          `- ${result.hintsCount} Hints rules\n` +
          `- ${result.skillsCount} Skills`
        )

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }

      // Handle Skills import
      if (currentRuleType === 'skills') {
        if (!Array.isArray(jsonData)) {
          alert('Invalid JSON format. Expected an array of skills.')
          return
        }

        const importedCount = await importSkills(jsonData)
        alert(`Successfully imported ${importedCount} skills`)

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }

      // Support both array format and AUTO_WORKFLOW_RULES format
      const rulesData = Array.isArray(jsonData) ? jsonData : jsonData.rules

      if (!Array.isArray(rulesData) || rulesData.length === 0) {
        alert('Invalid JSON format. Expected an array of rules or AUTO_WORKFLOW_RULES format.')
        return
      }

      // Auto-detect rule type from JSON structure
      const firstRule = rulesData[0]
      const isTAT = isTATRuleFormat(firstRule)

      // Validate that imported data matches current tab
      if (currentRuleType === 'tat' && !isTAT) {
        alert('❌ Tab Mismatch: You are on the TAT tab, but this file contains Workflow/Hints rules.\n\nPlease switch to the Workflow or Hints tab to import this file.')
        return
      }

      if ((currentRuleType === 'workflow' || currentRuleType === 'hints') && isTAT) {
        alert('❌ Tab Mismatch: You are on the ' + currentRuleType.toUpperCase() + ' tab, but this file contains TAT rules.\n\nPlease switch to the TAT tab to import this file.')
        return
      }

      // Route to appropriate import function based on detected type
      let importedRules: Rule[]
      if (isTAT) {
        // TAT rules - use TAT import which expects TATRuleExport format
        importedRules = await importTATRulesFromJSON(rulesData)
      } else {
        // Workflow/Hints rules - add current rule type and use workflow import
        const rulesWithType = rulesData.map((r: unknown) => ({
          ...(r as Record<string, unknown>),
          ruleType: currentRuleType,
        })) as any[]
        importedRules = await importRulesFromJSON(rulesWithType)
      }

      const ruleTypeLabel = isTAT ? 'TAT' : currentRuleType
      alert(`Successfully imported ${importedRules.length} ${ruleTypeLabel} rules`)

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error importing rules:', error)
      alert('Failed to import rules. Please check the JSON format.')
    }
  }

  const handleViewJSON = (rule: Rule) => {
    const json = {
      code: rule.code,
      ruleName: rule.ruleName,
      ruleDesc: rule.ruleDesc,
      standardFieldCriteria: rule.standardFieldCriteria,
      customFieldCriteria: rule.customFieldCriteria,
      weight: rule.weight,
    }
    alert(JSON.stringify(json, null, 2))
  }

  const handleToggleDropdown = (ruleId: string) => {
    if (openDropdown === ruleId) {
      setOpenDropdown(null)
      setDropdownPosition(null)
    } else {
      const button = buttonRefs.current[ruleId]
      if (button) {
        const rect = button.getBoundingClientRect()
        setDropdownPosition({
          top: rect.bottom + 4,
          right: window.innerWidth - rect.right
        })
      }
      setOpenDropdown(ruleId)
    }
  }

  const downloadJSON = (data: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const activeCount = rules.filter((r) => r.status === 'active').length
  const inactiveCount = rules.filter((r) => r.status === 'inactive').length

  const ruleTypeTabs: { value: RuleType; label: string }[] = [
    { value: 'workflow', label: 'Workflow' },
    { value: 'hints', label: 'Hints' },
    { value: 'skills', label: 'Skills' },
    { value: 'tat', label: 'TAT' },
    { value: 'pullQueue', label: 'Pull Queue' },
  ]

  return (
    <div className="h-full flex flex-col bg-bg-light">
      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-bg-light p-6">
        {/* Unified Container */}
        <div className="rounded-xl shadow-sm overflow-hidden" style={{ border: '2px solid #e1e1e6', borderLeftWidth: '5px', borderRightWidth: '5px' }}>
          {/* Grey Header with Rule Type Tabs */}
          <div className="px-6 py-2 flex items-center justify-between" style={{ backgroundColor: '#e1e1e6' }}>
            {/* Rule Type Tabs */}
            <div className="flex space-x-6">
            {ruleTypeTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => onRuleTypeChange(tab.value)}
                className={`pb-1 text-sm font-medium border-b-2 transition-colors`}
                style={{
                  color: '#40404f',
                  borderColor: currentRuleType === tab.value ? '#5c4bd3' : 'transparent'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
              <div className="relative" ref={settingsDropdownRef}>
                <button
                  onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-primary hover:text-primary-hover"
                >
                  <Settings className="w-4 h-4 mr-1.5" />
                  Import/Export
                </button>

                {showSettingsDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                    <div className="py-1">
                      {/* Current Tab Import/Export */}
                      <button
                        onClick={() => {
                          currentRuleType === 'skills' ? handleImportSkills() : handleImportRules()
                          setShowSettingsDropdown(false)
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Import {currentRuleType === 'workflow' ? 'Workflow' : currentRuleType === 'hints' ? 'Hints' : currentRuleType === 'tat' ? 'TAT' : currentRuleType === 'skills' ? 'Skills' : ''} {currentRuleType === 'skills' ? '' : 'Rules'}</span>
                      </button>
                      <button
                        onClick={() => {
                          currentRuleType === 'skills' ? handleExportSkills() : handleExportTabRules()
                          setShowSettingsDropdown(false)
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export {currentRuleType === 'workflow' ? 'Workflow' : currentRuleType === 'hints' ? 'Hints' : currentRuleType === 'tat' ? 'TAT' : currentRuleType === 'skills' ? 'Skills' : ''} {currentRuleType === 'skills' ? '' : 'Rules'}</span>
                      </button>

                      <div className="border-t border-gray-100 my-1"></div>

                      {/* Global Export */}
                      <button
                        onClick={() => {
                          handleExportGlobal()
                          setShowSettingsDropdown(false)
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export Global (Workflow/Hints/Skills)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Hidden file input for importing */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              {/* Workflow-specific buttons */}
              {currentRuleType === 'workflow' && (
                <button
                  onClick={() => navigate(`/${currentRuleType}/viewer`)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Globe className="w-4 h-4 mr-1.5" />
                  View All Workflows
                </button>
              )}
              {currentRuleType === 'workflow' && (
                <button
                  onClick={() => navigate(`/${currentRuleType}/branching`)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Workflow className="w-4 h-4 mr-1.5" />
                  Build Branching Flow
                </button>
              )}
              <button
                onClick={() => navigate(`/${currentRuleType}/ai`)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent rounded text-sm font-medium text-white bg-primary hover:bg-primary-hover"
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                AI Assistant
              </button>
            <button
              onClick={() => navigate(`/${currentRuleType}/new`)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent rounded text-sm font-medium text-white bg-primary hover:bg-primary-hover"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Rule
            </button>
          </div>
          </div>

          {/* Conditionally render based on route and rule type */}
          {isAIView ? (
            <div className="bg-white rounded-b-xl">
              <AIAssistant
                onRuleGenerated={() => navigate(`/${currentRuleType}/new`)}
                onClose={() => navigate(`/${currentRuleType}`)}
              />
            </div>
          ) : isViewerView ? (
            <div className="bg-white rounded-b-xl">
              <GlobalWorkflowViewer onClose={() => navigate(`/${currentRuleType}`)} />
            </div>
          ) : isBranchingView ? (
            <div className="bg-white rounded-b-xl">
              <BranchingWorkflowBuilder
                onClose={() => navigate(`/${currentRuleType}`)}
                onSave={() => navigate(`/${currentRuleType}`)}
              />
            </div>
          ) : showSkillForm ? (
            <div className="bg-white rounded-b-xl">
              {skillFormLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-gray-500">Loading skill...</div>
                </div>
              ) : (
                <SkillForm
                  skill={editingSkill}
                  onClose={() => navigate(`/${currentRuleType}`)}
                  onSave={() => navigate(`/${currentRuleType}`)}
                />
              )}
            </div>
          ) : showRuleBuilder ? (
            <div className="bg-white rounded-b-xl">
              {ruleBuilderLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-gray-500">Loading rule...</div>
                </div>
              ) : currentRuleType === 'hints' ? (
                <HintsRuleBuilder
                  rule={editingRule}
                  onClose={() => navigate(`/${currentRuleType}`)}
                  onSave={() => navigate(`/${currentRuleType}`)}
                />
              ) : (
                <RuleBuilder
                  rule={editingRule}
                  onClose={() => navigate(`/${currentRuleType}`)}
                  onSave={() => navigate(`/${currentRuleType}`)}
                />
              )}
            </div>
          ) : currentRuleType === 'pullQueue' ? (
            <div className="bg-white rounded-b-xl">
              <PullQueueConfig />
            </div>
          ) : currentRuleType === 'skills' ? (
            <SkillsManager />
          ) : (
            <div className="bg-white rounded-b-xl px-3 py-4">
            {/* Filter Tabs Section */}
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium border-r border-gray-300 ${
                    activeTab === 'all'
                      ? 'bg-primary-light text-gray-900'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>All</span>
                  <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold ${
                    activeTab === 'all' ? 'bg-primary text-white' : 'bg-gray-300 text-gray-700'
                  }`}>
                    {rules.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('active')}
                  className={`inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium border-r border-gray-300 ${
                    activeTab === 'active'
                      ? 'bg-primary-light text-gray-900'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>Active</span>
                  <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold ${
                    activeTab === 'active' ? 'bg-primary text-white' : 'bg-gray-300 text-gray-700'
                  }`}>
                    {activeCount}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('inactive')}
                  className={`inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium ${
                    activeTab === 'inactive'
                      ? 'bg-primary-light text-gray-900'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>Inactive</span>
                  <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold ${
                    activeTab === 'inactive' ? 'bg-primary text-white' : 'bg-gray-300 text-gray-700'
                  }`}>
                    {inactiveCount}
                  </span>
                </button>
              </div>

              <div className="flex items-center space-x-3">
                {/* TAT Pause Settings button - only shown on TAT page */}
                {currentRuleType === 'tat' && (
                  <button
                    onClick={() => setShowTATConfig(true)}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-primary hover:text-primary-hover"
                  >
                    <Settings className="w-4 h-4 mr-1.5" />
                    TAT Pause Settings
                  </button>
                )}

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by Code, Name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-primary focus:border-primary w-64"
                  />
                </div>
              </div>
            </div>

            {/* Table Container - Floating within white section */}
            <div className="rounded-lg border border-table-border bg-white shadow-sm">
              {/* Bulk Actions */}
              {selectedRules.size > 0 && (
                <div className="px-6 py-3 flex items-center space-x-2 bg-gray-50 border-b border-table-border">
                  <span className="text-xs text-gray-500">
                    {selectedRules.size} selected
                  </span>
                  <button
                    onClick={handleBulkActivate}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50"
                  >
                    <Power className="w-3 h-3 mr-1" />
                    Activate
                  </button>
                  <button
                    onClick={handleBulkDeactivate}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50"
                  >
                    <PowerOff className="w-3 h-3 mr-1" />
                    Deactivate
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-xs text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </button>
                </div>
              )}

              {/* Table */}
              <div className="overflow-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Loading rules...</div>
                  </div>
                ) : filteredRules.length === 0 ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <p className="text-gray-500">No {currentRuleType === 'hints' ? 'hints' : 'rules'} found</p>
                      <button
                        onClick={() => navigate(`/${currentRuleType}/new`)}
                        className="mt-4 text-primary hover:text-primary-hover"
                      >
                        Create your first {currentRuleType === 'hints' ? 'hint' : 'rule'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <table className="w-full divide-y divide-table-border" style={{ tableLayout: 'fixed' }}>
                    <colgroup>
                      <col style={{ width: '3%' }} />
                      <col style={{ width: '8%' }} />
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '37%' }} />
                      <col style={{ width: '5%' }} />
                      <col style={{ width: '5%' }} />
                      <col style={{ width: '15%' }} />
                      <col style={{ width: '8%' }} />
                      <col style={{ width: '9%' }} />
                    </colgroup>
                    <thead className="bg-bg-light sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">
                          <input
                            type="checkbox"
                            checked={selectedRules.size === filteredRules.length}
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </th>
                        <th className="px-3 py-2 text-left text-sm font-medium text-table-header">
                          Status
                        </th>
                        <th className="px-3 py-2 text-left text-sm font-medium text-table-header">
                          Code
                        </th>
                        <th className="px-3 py-2 text-left text-sm font-medium text-table-header">
                          Description
                        </th>
                        <th className="px-3 py-2 text-left text-sm font-medium text-table-header">
                          Weight
                        </th>
                        <th className="px-3 py-2 text-left text-sm font-medium text-table-header">
                          Atoms
                        </th>
                        <th className="px-3 py-2 text-left text-sm font-medium text-table-header">
                          Rule Actions
                        </th>
                        <th className="px-3 py-2 text-left text-sm font-medium text-table-header">
                          Updated
                        </th>
                        <th className="px-3 py-2 text-left text-sm font-medium text-table-header">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-table-border">
                      {filteredRules.map((rule) => (
                        <tr
                          key={rule.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => navigate(`/${currentRuleType}/edit/${rule.id}`)}
                        >
                          <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedRules.has(rule.id)}
                              onChange={() => handleSelectRule(rule.id)}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                          </td>
                          <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleToggleStatus(rule)}
                              className={`inline-flex px-2.5 py-1 text-sm font-medium rounded-md ${
                                rule.status === 'active'
                                  ? 'bg-active-badge-bg text-active-badge-text'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {rule.status === 'active' ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="px-3 py-2 text-sm font-medium text-gray-900">
                            {rule.code}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600 max-w-md truncate">
                            {rule.ruleName}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600">
                            {rule.weight ?? '-'}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600">
                            {getAtoms(rule)}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-500">
                            {rule.ruleType === 'tat' && rule.tatParameters ? (
                              <div className="flex flex-wrap gap-0.5">
                                <span className="inline-flex px-1 py-0.5 rounded text-[10px] font-normal bg-teal-50 text-teal-700">
                                  {rule.tatParameters.units} {rule.tatParameters.unitsOfMeasure.replace('_', ' ')}
                                </span>
                                {rule.tatParameters.dueTime && (
                                  <span className="inline-flex px-1 py-0.5 rounded text-[10px] font-normal bg-cyan-50 text-cyan-700">
                                    Due: {rule.tatParameters.dueTime}
                                  </span>
                                )}
                              </div>
                            ) : rule.actions ? (
                              <div className="flex flex-wrap gap-0.5">
                                {rule.actions.departmentRouting && (
                                  <span className="inline-flex px-1 py-0.5 rounded text-[10px] font-normal bg-orange-50 text-orange-600">
                                    Dept Routing
                                  </span>
                                )}
                                {rule.actions.close && (
                                  <span className="inline-flex px-1 py-0.5 rounded text-[10px] font-normal bg-red-50 text-red-600">
                                    Close
                                  </span>
                                )}
                                {rule.actions.generateLetters && (
                                  <span className="inline-flex px-1 py-0.5 rounded text-[10px] font-normal bg-green-50 text-green-600">
                                    Letter ({rule.actions.generateLetters.length})
                                  </span>
                                )}
                                {rule.actions.createTask && (
                                  <span className="inline-flex px-1 py-0.5 rounded text-[10px] font-normal bg-indigo-50 text-indigo-600">
                                    Task
                                  </span>
                                )}
                                {rule.actions.createAppealTasks && rule.actions.createAppealTasks.length > 0 && (
                                  <span className="inline-flex px-1 py-0.5 rounded text-[10px] font-normal bg-purple-50 text-purple-600">
                                    Appeal ({rule.actions.createAppealTasks.length})
                                  </span>
                                )}
                                {rule.actions.createCMReferral && (
                                  <span className="inline-flex px-1 py-0.5 rounded text-[10px] font-normal bg-blue-50 text-blue-600">
                                    CM Referral
                                  </span>
                                )}
                                {rule.actions.transferOwnership && (
                                  <span className="inline-flex px-1 py-0.5 rounded text-[10px] font-normal bg-cyan-50 text-cyan-600">
                                    Transfer
                                  </span>
                                )}
                                {rule.actions.createProgram && (
                                  <span className="inline-flex px-1 py-0.5 rounded text-[10px] font-normal bg-teal-50 text-teal-600">
                                    Program
                                  </span>
                                )}
                              </div>
                            ) : rule.hints ? (
                              <div className="flex flex-wrap gap-0.5">
                                {rule.hints.displayLocation && (() => {
                                  const label = rule.hints.displayLocation === 'MEMBER' ? 'Member' :
                                               rule.hints.displayLocation === 'PROVIDER' ? 'Provider' :
                                               rule.hints.displayLocation === 'SERVICES' ? 'Services' :
                                               rule.hints.displayLocation === 'DIAGNOSIS' ? 'Diagnosis' :
                                               rule.hints.displayLocation;
                                  const colors = label === 'Member' ? 'bg-blue-50 text-blue-600' :
                                                label === 'Provider' ? 'bg-green-50 text-green-600' :
                                                label === 'Services' ? 'bg-purple-50 text-purple-600' :
                                                label === 'Diagnosis' ? 'bg-orange-50 text-orange-600' :
                                                'bg-gray-50 text-gray-600';
                                  return (
                                    <span className={`inline-flex px-1 py-0.5 rounded text-[10px] font-normal ${colors}`}>
                                      {label}
                                    </span>
                                  );
                                })()}
                                {rule.hints.context && rule.hints.context.map((ctx, idx) => {
                                  const label = ctx === 'MEMBER_DEMOGRAPHICS' ? 'Member' :
                                               ctx === 'PROVIDER_DEMOGRAPHICS' ? 'Provider' :
                                               ctx === 'BUSINESS_ENTERPRISE_CATEGORIES' ? 'Business' :
                                               ctx === 'SERVICES' ? 'Services' :
                                               ctx === 'DIAGNOSIS' ? 'Diagnosis' :
                                               ctx;
                                  const colors = label === 'Member' ? 'bg-blue-50 text-blue-600' :
                                                label === 'Provider' ? 'bg-green-50 text-green-600' :
                                                label === 'Services' ? 'bg-purple-50 text-purple-600' :
                                                label === 'Diagnosis' ? 'bg-orange-50 text-orange-600' :
                                                label === 'Business' ? 'bg-yellow-50 text-yellow-600' :
                                                'bg-gray-50 text-gray-600';
                                  return (
                                    <span key={idx} className={`inline-flex px-1 py-0.5 rounded text-[10px] font-normal ${colors}`}>
                                      {label}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600">
                            {new Date(rule.updatedAt).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2 text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                            <button
                              ref={(el) => (buttonRefs.current[rule.id] = el)}
                              onClick={() => handleToggleDropdown(rule.id)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-600" />
                            </button>

                            {openDropdown === rule.id && dropdownPosition && (
                              <div
                                ref={dropdownRef}
                                className="fixed w-40 bg-white rounded-md shadow-lg border border-gray-200 z-[9999]"
                                style={{
                                  top: `${dropdownPosition.top}px`,
                                  right: `${dropdownPosition.right}px`
                                }}
                              >
                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      navigate(`/${currentRuleType}/edit/${rule.id}`)
                                      setOpenDropdown(null)
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                  >
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleClone(rule)
                                      setOpenDropdown(null)
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                  >
                                    <Copy className="w-4 h-4" />
                                    <span>Clone</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleViewJSON(rule)
                                      setOpenDropdown(null)
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                  >
                                    <Eye className="w-4 h-4" />
                                    <span>View JSON</span>
                                  </button>
                                  <div className="border-t border-gray-100"></div>
                                  <button
                                    onClick={() => {
                                      handleDelete(rule.id)
                                      setOpenDropdown(null)
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* TAT Config Modal */}
      {showTATConfig && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setShowTATConfig(false)}
            />

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <TATConfig onClose={() => setShowTATConfig(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
