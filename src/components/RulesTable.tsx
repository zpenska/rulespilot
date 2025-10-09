import { useState, useEffect } from 'react'
import { Search, Plus, Download, Trash2, Power, PowerOff, Copy, Eye } from 'lucide-react'
import { Rule } from '../types/rules'
import {
  deleteRule,
  updateRule,
  bulkUpdateStatus,
  bulkDeleteRules,
  cloneRule,
  exportAllRulesToJSON,
  exportActiveRulesToJSON,
  subscribeToRules,
} from '../services/rulesService'

type TabFilter = 'all' | 'active' | 'inactive'

interface RulesTableProps {
  onEditRule: (rule: Rule) => void
  onCreateRule: () => void
}

export default function RulesTable({ onEditRule, onCreateRule }: RulesTableProps) {
  const [rules, setRules] = useState<Rule[]>([])
  const [filteredRules, setFilteredRules] = useState<Rule[]>([])
  const [selectedRules, setSelectedRules] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<TabFilter>('all')
  const [loading, setLoading] = useState(true)

  // Subscribe to rules changes
  useEffect(() => {
    const unsubscribe = subscribeToRules((updatedRules) => {
      setRules(updatedRules)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

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
          r.ruleDesc.toLowerCase().includes(term) ||
          r.category?.toLowerCase().includes(term)
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

  const handleViewJSON = (rule: Rule) => {
    const json = {
      ruleDesc: rule.ruleDesc,
      standardFieldCriteria: rule.standardFieldCriteria,
      customFieldCriteria: rule.customFieldCriteria,
      weight: rule.weight,
    }
    alert(JSON.stringify(json, null, 2))
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

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Rules</h1>
          <button
            onClick={onCreateRule}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Rule
          </button>
        </div>

        {/* Tabs and Search */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'all'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All <span className="ml-1 text-xs">({rules.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'active'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Active <span className="ml-1 text-xs">({activeCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('inactive')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'inactive'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Inactive <span className="ml-1 text-xs">({inactiveCount})</span>
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Code, Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedRules.size > 0 && (
          <div className="mt-4 flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {selectedRules.size} selected
            </span>
            <button
              onClick={handleBulkActivate}
              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              <Power className="w-3 h-3 mr-1" />
              Activate
            </button>
            <button
              onClick={handleBulkDeactivate}
              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              <PowerOff className="w-3 h-3 mr-1" />
              Deactivate
            </button>
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete
            </button>
            <div className="flex-1" />
            <button
              onClick={handleExportAll}
              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              <Download className="w-3 h-3 mr-1" />
              Export All
            </button>
            <button
              onClick={handleExportActive}
              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              <Download className="w-3 h-3 mr-1" />
              Export Active
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
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
                className="mt-4 text-indigo-600 hover:text-indigo-500"
              >
                Create your first rule
              </button>
            </div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRules.size === filteredRules.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Weight
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rule Actions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedRules.has(rule.id)}
                      onChange={() => handleSelectRule(rule.id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleStatus(rule)}
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        rule.status === 'active'
                          ? 'bg-teal-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {rule.status === 'active' ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {rule.code}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                    {rule.ruleDesc}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {rule.category || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {rule.weight ?? '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {rule.actions ? (
                      <div className="flex flex-wrap gap-1">
                        {rule.actions.assignSkill && (
                          <span className="inline-flex px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                            Assign Skill
                          </span>
                        )}
                        {rule.actions.assignLicense && (
                          <span className="inline-flex px-2 py-0.5 rounded text-xs bg-cyan-100 text-cyan-800">
                            Assign License
                          </span>
                        )}
                        {rule.actions.departmentRouting && (
                          <span className="inline-flex px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-800">
                            Department Routing
                          </span>
                        )}
                        {rule.actions.close && (
                          <span className="inline-flex px-2 py-0.5 rounded text-xs bg-red-100 text-red-800">
                            Close
                          </span>
                        )}
                        {rule.actions.generateLetters && (
                          <span className="inline-flex px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">
                            Generate Letter ({rule.actions.generateLetters.length})
                          </span>
                        )}
                        {rule.actions.hints && (
                          <span className="inline-flex px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800">
                            Hints
                          </span>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(rule.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium space-x-2">
                    <button
                      onClick={() => onEditRule(rule)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleClone(rule)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <Copy className="w-4 h-4 inline" />
                    </button>
                    <button
                      onClick={() => handleViewJSON(rule)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <Eye className="w-4 h-4 inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
