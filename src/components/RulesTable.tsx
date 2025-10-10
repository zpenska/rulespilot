import { useState, useEffect, useRef } from 'react'
import { Search, Plus, Download, Upload, Trash2, Power, PowerOff, Copy, Eye, MoreVertical, Settings, Sparkles } from 'lucide-react'
import { Rule, RuleType } from '../types/rules'
import {
  deleteRule,
  updateRule,
  bulkUpdateStatus,
  bulkDeleteRules,
  cloneRule,
  exportAllRulesToJSON,
  exportActiveRulesToJSON,
  importRulesFromJSON,
  subscribeToRules,
} from '../services/rulesService'

type TabFilter = 'all' | 'active' | 'inactive'

interface RulesTableProps {
  onEditRule: (rule: Rule) => void
  onCreateRule: () => void
  onToggleAI?: () => void
  currentRuleType: RuleType
  onRuleTypeChange: (ruleType: RuleType) => void
}

export default function RulesTable({ onEditRule, onCreateRule, onToggleAI, currentRuleType, onRuleTypeChange }: RulesTableProps) {
  const [rules, setRules] = useState<Rule[]>([])
  const [filteredRules, setFilteredRules] = useState<Rule[]>([])
  const [selectedRules, setSelectedRules] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<TabFilter>('all')
  const [loading, setLoading] = useState(true)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const settingsDropdownRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})

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
  useEffect(() => {
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
          r.ruleDesc.toLowerCase().includes(term)
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
    onEditRule(cloned)
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

  const handleExportAll = async () => {
    const data = await exportAllRulesToJSON()
    downloadJSON(data, 'all-rules.json')
  }

  const handleExportActive = async () => {
    const data = await exportActiveRulesToJSON()
    downloadJSON(data, 'active-rules.json')
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

      // Support both array format and AUTO_WORKFLOW_RULES format
      const rulesData = Array.isArray(jsonData) ? jsonData : jsonData.rules

      if (!Array.isArray(rulesData)) {
        alert('Invalid JSON format. Expected an array of rules or AUTO_WORKFLOW_RULES format.')
        return
      }

      // Add current rule type to imported rules
      const rulesWithType = rulesData.map((r: any) => ({
        ...r,
        ruleType: currentRuleType,
      }))

      const importedRules = await importRulesFromJSON(rulesWithType)
      alert(`Successfully imported ${importedRules.length} ${currentRuleType} rules`)

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

  const downloadJSON = (data: any, filename: string) => {
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
    { value: 'skills', label: 'Skills' },
    { value: 'tat', label: 'TAT' },
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
                  Rules Settings
                </button>

                {showSettingsDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          handleImportRules()
                          setShowSettingsDropdown(false)
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Import Rules</span>
                      </button>
                      <div className="border-t border-gray-100"></div>
                      <button
                        onClick={() => {
                          handleExportAll()
                          setShowSettingsDropdown(false)
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export All Rules</span>
                      </button>
                      <button
                        onClick={() => {
                          handleExportActive()
                          setShowSettingsDropdown(false)
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export Active Rules</span>
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
              {onToggleAI && (
                <button
                  onClick={onToggleAI}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent rounded text-sm font-medium text-white bg-primary hover:bg-primary-hover"
                >
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  AI Assistant
                </button>
              )}
            <button
              onClick={onCreateRule}
              className="inline-flex items-center px-3 py-1.5 border border-transparent rounded text-sm font-medium text-white bg-primary hover:bg-primary-hover"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Rule
            </button>
          </div>
          </div>

          {/* White Section - Filter Tabs and Table */}
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
                  <div className="flex-1" />
                  <button
                    onClick={handleExportAll}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Export All
                  </button>
                  <button
                    onClick={handleExportActive}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Export Active
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
                      <p className="text-gray-500">No rules found</p>
                      <button
                        onClick={onCreateRule}
                        className="mt-4 text-primary hover:text-primary-hover"
                      >
                        Create your first rule
                      </button>
                    </div>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-table-border table-fixed">
                    <thead className="bg-bg-light sticky top-0">
                      <tr>
                        <th className="w-12 px-4 py-2 text-left">
                          <input
                            type="checkbox"
                            checked={selectedRules.size === filteredRules.length}
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </th>
                        <th className="w-24 px-4 py-2 text-left text-sm font-medium text-table-header">
                          Status
                        </th>
                        <th className="w-32 px-4 py-2 text-left text-sm font-medium text-table-header">
                          Code
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-table-header">
                          Description
                        </th>
                        <th className="w-20 px-4 py-2 text-left text-sm font-medium text-table-header">
                          Weight
                        </th>
                        <th className="w-64 px-4 py-2 text-left text-sm font-medium text-table-header">
                          Rule Actions
                        </th>
                        <th className="w-32 px-4 py-2 text-left text-sm font-medium text-table-header">
                          Updated
                        </th>
                        <th className="w-20 px-4 py-2 text-left text-sm font-medium text-table-header">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-table-border">
                      {filteredRules.map((rule) => (
                        <tr key={rule.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedRules.has(rule.id)}
                              onChange={() => handleSelectRule(rule.id)}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                          </td>
                          <td className="px-4 py-3">
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
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {rule.code}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 max-w-md truncate">
                            {rule.ruleDesc}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {rule.weight ?? '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {rule.ruleType === 'tat' && rule.tatParameters ? (
                              <div className="flex flex-wrap gap-1">
                                <span className="inline-flex px-2 py-0.5 rounded text-sm font-medium bg-teal-50 text-teal-700">
                                  {rule.tatParameters.units} {rule.tatParameters.unitsOfMeasure.replace('_', ' ')}
                                </span>
                                {rule.tatParameters.dueTime && (
                                  <span className="inline-flex px-2 py-0.5 rounded text-sm font-medium bg-cyan-50 text-cyan-700">
                                    Due: {rule.tatParameters.dueTime}
                                  </span>
                                )}
                              </div>
                            ) : rule.actions ? (
                              <div className="flex flex-wrap gap-1">
                                {rule.actions.assignSkill && (
                                  <span className="inline-flex px-2 py-0.5 rounded text-sm font-medium bg-primary-light text-primary">
                                    Assign Skill
                                  </span>
                                )}
                                {rule.actions.assignLicense && (
                                  <span className="inline-flex px-2 py-0.5 rounded text-sm font-medium bg-purple-50 text-purple-600">
                                    Assign Licenses
                                  </span>
                                )}
                                {rule.actions.departmentRouting && (
                                  <span className="inline-flex px-2 py-0.5 rounded text-sm font-medium bg-orange-50 text-orange-600">
                                    Department Routing
                                  </span>
                                )}
                                {rule.actions.close && (
                                  <span className="inline-flex px-2 py-0.5 rounded text-sm font-medium bg-red-50 text-red-600">
                                    Close/Discharge Request
                                  </span>
                                )}
                                {rule.actions.generateLetters && (
                                  <span className="inline-flex px-2 py-0.5 rounded text-sm font-medium bg-green-50 text-green-600">
                                    Letter ({rule.actions.generateLetters.length})
                                  </span>
                                )}
                                {rule.actions.hints && (
                                  <span className="inline-flex px-2 py-0.5 rounded text-sm font-medium bg-yellow-50 text-yellow-600">
                                    Hints
                                  </span>
                                )}
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(rule.updatedAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">
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
                                      onEditRule(rule)
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
        </div>
      </div>
    </div>
  )
}
