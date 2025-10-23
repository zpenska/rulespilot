import { useState, useEffect } from 'react'
import { Save, RotateCcw, GripVertical, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { PullQueueConfig } from '../types/rules'
import { DEFAULT_PULL_QUEUE_CONFIG, AVAILABLE_DEPARTMENTS, PULL_QUEUE_LOGIC } from '../config/pullQueueConfig'
import { getPullQueueConfig, savePullQueueConfig } from '../services/pullQueueService'

export default function PullQueueConfigComponent() {
  const [config, setConfig] = useState<PullQueueConfig>(DEFAULT_PULL_QUEUE_CONFIG)
  const [originalConfig, setOriginalConfig] = useState<PullQueueConfig>(DEFAULT_PULL_QUEUE_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [showLogic, setShowLogic] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  useEffect(() => {
    // Check if config has changes from original
    const changed =
      config.escalationsFirst !== originalConfig.escalationsFirst ||
      config.maxQueueCapacity !== originalConfig.maxQueueCapacity ||
      config.tatSafetyWindowHours !== originalConfig.tatSafetyWindowHours ||
      JSON.stringify(config.departmentOrder) !== JSON.stringify(originalConfig.departmentOrder)
    setHasChanges(changed)
  }, [config, originalConfig])

  const loadConfig = async () => {
    try {
      const loadedConfig = await getPullQueueConfig()
      setConfig(loadedConfig)
      setOriginalConfig(loadedConfig)
    } catch (error) {
      console.error('Error loading pull queue config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await savePullQueueConfig(config)
      setOriginalConfig(config)
      setHasChanges(false)
      alert('Pull queue configuration saved successfully!')
    } catch (error) {
      console.error('Error saving config:', error)
      alert('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset to the last saved configuration?')) {
      setConfig(originalConfig)
    }
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newOrder = [...config.departmentOrder]
    const draggedItem = newOrder[draggedIndex]

    // Remove from old position
    newOrder.splice(draggedIndex, 1)
    // Insert at new position
    newOrder.splice(index, 0, draggedItem)

    setConfig({ ...config, departmentOrder: newOrder })
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const moveDepartment = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...config.departmentOrder]
    const newIndex = direction === 'up' ? index - 1 : index + 1

    if (newIndex < 0 || newIndex >= newOrder.length) return

    // Swap items
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]]
    setConfig({ ...config, departmentOrder: newOrder })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading configuration...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-bg-light overflow-auto">
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-table-border p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Pull Queue Configuration
                </h2>
                <p className="text-sm text-gray-600">
                  Configure how Prior Auth work is pulled by users based on Escalation, TAT, and Department priority.
                </p>
              </div>
              <button
                onClick={() => setShowLogic(!showLogic)}
                className="inline-flex items-center px-3 py-1.5 text-sm text-primary hover:text-primary-hover"
              >
                <Info className="w-4 h-4 mr-1" />
                {showLogic ? 'Hide' : 'Show'} Logic
              </button>
            </div>

            {showLogic && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                  {PULL_QUEUE_LOGIC}
                </pre>
              </div>
            )}
          </div>

          {/* Escalation Priority Toggle */}
          <div className="bg-white rounded-xl shadow-sm border border-table-border p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
              Escalation Priority
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.escalationsFirst}
                    onChange={(e) => setConfig({ ...config, escalationsFirst: e.target.checked })}
                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      Pull escalations first
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      When enabled, escalated items will be prioritized after TAT safety checks
                    </p>
                  </div>
                </label>
              </div>
              <div className={`px-3 py-1 rounded-md text-xs font-medium ${
                config.escalationsFirst
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {config.escalationsFirst ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </div>

          {/* Max Queue Capacity */}
          <div className="bg-white rounded-xl shadow-sm border border-table-border p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
              Max Queue Capacity
            </h3>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Requests per User
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Sets the maximum number of requests that can be pulled into a user's queue at one time
                </p>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={config.maxQueueCapacity}
                  onChange={(e) => setConfig({ ...config, maxQueueCapacity: parseInt(e.target.value) || 1 })}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                />
                <span className="ml-2 text-sm text-gray-600">requests</span>
              </div>
              <div className="flex-shrink-0 px-6 py-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {config.maxQueueCapacity}
                </div>
                <div className="text-xs text-blue-700 mt-1">
                  Max Capacity
                </div>
              </div>
            </div>
          </div>

          {/* Department Priority Order */}
          <div className="bg-white rounded-xl shadow-sm border border-table-border p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Department Priority Order
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Drag departments to reorder priority. Top = highest priority.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {config.departmentOrder.map((dept, index) => {
                const deptInfo = AVAILABLE_DEPARTMENTS.find(d => d.code === dept)
                return (
                  <div
                    key={dept}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`group flex items-center justify-between p-4 border-2 rounded-lg cursor-move transition-all ${
                      draggedIndex === index
                        ? 'border-primary bg-primary-light shadow-lg'
                        : 'border-gray-200 bg-white hover:border-primary hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <GripVertical className="w-5 h-5 text-gray-400 group-hover:text-primary" />
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {deptInfo?.name || dept}
                          </div>
                          <div className="text-xs text-gray-500">
                            Priority Level {index + 1}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => moveDepartment(index, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronUp className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => moveDepartment(index, 'down')}
                        disabled={index === config.departmentOrder.length - 1}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronDown className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* TAT Safety Window */}
          <div className="bg-white rounded-xl shadow-sm border border-table-border p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
              TAT Safety Window
            </h3>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Safety Window (hours)
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Items due within this window will override all other priorities to prevent missed TAT deadlines
                </p>
                <input
                  type="number"
                  min="1"
                  max="72"
                  value={config.tatSafetyWindowHours}
                  onChange={(e) => setConfig({ ...config, tatSafetyWindowHours: parseInt(e.target.value) || 1 })}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                />
                <span className="ml-2 text-sm text-gray-600">hours</span>
              </div>
              <div className="flex-shrink-0 px-6 py-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">
                  {config.tatSafetyWindowHours}h
                </div>
                <div className="text-xs text-amber-700 mt-1">
                  Safety Window
                </div>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="bg-white rounded-xl shadow-sm border border-table-border p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
              Pull Order Summary
            </h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">TAT Safety</div>
                  <div className="text-xs text-gray-500">
                    Items due within {config.tatSafetyWindowHours} hours (overrides all other priorities)
                  </div>
                </div>
              </div>

              {config.escalationsFirst && (
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Escalated Items</div>
                    <div className="text-xs text-gray-500">
                      Items marked as escalated
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                  {config.escalationsFirst ? '3' : '2'}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 mb-2">Department Priority</div>
                  <div className="text-xs text-gray-500 space-y-1">
                    {config.departmentOrder.map((dept, idx) => {
                      const deptInfo = AVAILABLE_DEPARTMENTS.find(d => d.code === dept)
                      return (
                        <div key={dept} className="flex items-center space-x-2">
                          <span className="font-medium text-primary">{idx + 1}.</span>
                          <span>{deptInfo?.name || dept}</span>
                          <span className="text-gray-400">→ Then soonest TAT</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with Save/Reset buttons */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {hasChanges && (
            <span className="text-amber-600 font-medium">
              You have unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  )
}
