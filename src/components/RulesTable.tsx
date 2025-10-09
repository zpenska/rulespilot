import { useState, useEffect } from 'react'
import { Search, Plus, Download, Trash2, ArrowRight } from 'lucide-react'
import { Rule } from '../types/rules'
import {
  deleteRule,
  bulkDeleteRules,
  exportAllRulesToJSON,
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

  useEffect(() => {
    const unsubscribe = subscribeToRules((updatedRules) => {
      setRules(updatedRules)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    let filtered = rules
    if (activeTab === 'active') filtered = filtered.filter((r) => r.status === 'active')
    else if (activeTab === 'inactive') filtered = filtered.filter((r) => r.status === 'inactive')

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
    setSelectedRules(
      selectedRules.size === filteredRules.length ? new Set() : new Set(filteredRules.map((r) => r.id))
    )
  }

  const handleSelectRule = (ruleId: string) => {
    const newSelected = new Set(selectedRules)
    newSelected.has(ruleId) ? newSelected.delete(ruleId) : newSelected.add(ruleId)
    setSelectedRules(newSelected)
  }

  const handleDelete = async (ruleId: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      await deleteRule(ruleId)
    }
  }

  const handleBulkDelete = async () => {
    if (confirm(`Delete ${selectedRules.size} selected rules?`)) {
      await bulkDeleteRules(Array.from(selectedRules))
      setSelectedRules(new Set())
    }
  }

  const handleExportAll = async () => {
    const data = await exportAllRulesToJSON()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'all-rules.json'
    a.click()
  }

  const activeCount = rules.filter((r) => r.status === 'active').length
  const inactiveCount = rules.filter((r) => r.status === 'inactive').length

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-0">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Rules</h2>
            <p className="text-sm text-gray-500 mt-1">Manage authorization rules</p>
          </div>
          <button
            onClick={onCreateRule}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Rule
          </button>
        </div>

        {/* Tabs and Search */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'all'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              All <span className="ml-1 text-xs">({rules.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'active'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Active <span className="ml-1 text-xs">({activeCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('inactive')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'inactive'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Inactive <span className="ml-1 text-xs">({inactiveCount})</span>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by code, name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64"
              />
            </div>
            {selectedRules.size > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{selectedRules.size} selected</span>
                <button
                  onClick={handleBulkDelete}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
            <button
              onClick={handleExportAll}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-gray-500 mb-4">No rules found</p>
            <button
              onClick={onCreateRule}
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
            >
              Create your first rule
            </button>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRules.size === filteredRules.length && filteredRules.length > 0}
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
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Weight
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onEditRule(rule)}>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRules.has(rule.id)}
                      onChange={() => handleSelectRule(rule.id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${
                        rule.status === 'active'
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span className="mr-1.5">•</span>
                      {rule.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{rule.code}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{rule.ruleDesc}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{rule.category || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{rule.weight || 100}</td>
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEditRule(rule)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        title="View details"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
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
