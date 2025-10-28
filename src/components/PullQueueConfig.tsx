import { useState, useEffect } from 'react'
import { Save, RotateCcw, GripVertical, Info, X, Plus, ChevronUp, ChevronDown } from 'lucide-react'
import { PullQueueConfig } from '../types/rules'
import { DEFAULT_PULL_QUEUE_CONFIG, AVAILABLE_DEPARTMENTS, PULL_QUEUE_LOGIC } from '../config/pullQueueConfig'
import { getPullQueueConfig, savePullQueueConfig } from '../services/pullQueueService'

export default function PullQueueConfigComponent() {
  const [config, setConfig] = useState<PullQueueConfig>(DEFAULT_PULL_QUEUE_CONFIG)
  const [originalConfig, setOriginalConfig] = useState<PullQueueConfig>(DEFAULT_PULL_QUEUE_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [draggedDept, setDraggedDept] = useState<{ dept: string; fromPriority: number } | null>(null)
  const [draggedPriority, setDraggedPriority] = useState<number | null>(null)
  const [showLogic, setShowLogic] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [showAddDeptDropdown, setShowAddDeptDropdown] = useState<number | null>(null)

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

  // Get all departments that are already used
  const getUsedDepartments = () => {
    return new Set(config.departmentOrder.flat())
  }

  // Get departments available to add
  const getAvailableDepartments = () => {
    const used = getUsedDepartments()
    return AVAILABLE_DEPARTMENTS.filter(d => !used.has(d.code))
  }

  // Add a new priority level
  const handleAddPriorityLevel = () => {
    setConfig({
      ...config,
      departmentOrder: [...config.departmentOrder, []],
    })
  }

  // Remove a priority level
  const handleRemovePriorityLevel = (priorityIndex: number) => {
    const newOrder = config.departmentOrder.filter((_, idx) => idx !== priorityIndex)
    setConfig({ ...config, departmentOrder: newOrder })
  }

  // Add department to a priority level
  const handleAddDepartment = (priorityIndex: number, deptCode: string) => {
    const newOrder = [...config.departmentOrder]
    newOrder[priorityIndex] = [...newOrder[priorityIndex], deptCode]
    setConfig({ ...config, departmentOrder: newOrder })
    setShowAddDeptDropdown(null)
  }

  // Remove department from a priority level
  const handleRemoveDepartment = (priorityIndex: number, deptCode: string) => {
    const newOrder = [...config.departmentOrder]
    newOrder[priorityIndex] = newOrder[priorityIndex].filter(d => d !== deptCode)

    // Remove empty priority levels
    const filteredOrder = newOrder.filter(level => level.length > 0)
    setConfig({ ...config, departmentOrder: filteredOrder })
  }

  // Move priority level up or down
  const handleMovePriority = (priorityIndex: number, direction: 'up' | 'down') => {
    const newOrder = [...config.departmentOrder]
    const newIndex = direction === 'up' ? priorityIndex - 1 : priorityIndex + 1

    if (newIndex < 0 || newIndex >= newOrder.length) return

    // Swap items
    ;[newOrder[priorityIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[priorityIndex]]
    setConfig({ ...config, departmentOrder: newOrder })
  }

  // Department drag handlers
  const handleDeptDragStart = (dept: string, priorityIndex: number) => {
    setDraggedDept({ dept, fromPriority: priorityIndex })
  }

  const handleDeptDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDeptDrop = (targetPriority: number) => {
    if (!draggedDept) return

    const newOrder = [...config.departmentOrder]

    // Remove from old priority
    newOrder[draggedDept.fromPriority] = newOrder[draggedDept.fromPriority].filter(
      d => d !== draggedDept.dept
    )

    // Add to new priority
    if (!newOrder[targetPriority].includes(draggedDept.dept)) {
      newOrder[targetPriority] = [...newOrder[targetPriority], draggedDept.dept]
    }

    // Remove empty priority levels
    const filteredOrder = newOrder.filter(level => level.length > 0)

    setConfig({ ...config, departmentOrder: filteredOrder })
    setDraggedDept(null)
  }

  const handleDeptDragEnd = () => {
    setDraggedDept(null)
  }

  // Priority lane drag handlers
  const handlePriorityDragStart = (priorityIndex: number) => {
    setDraggedPriority(priorityIndex)
  }

  const handlePriorityDragOver = (e: React.DragEvent, priorityIndex: number) => {
    e.preventDefault()
    if (draggedPriority === null || draggedPriority === priorityIndex) return

    const newOrder = [...config.departmentOrder]
    const draggedItem = newOrder[draggedPriority]

    // Remove from old position
    newOrder.splice(draggedPriority, 1)
    // Insert at new position
    newOrder.splice(priorityIndex, 0, draggedItem)

    setConfig({ ...config, departmentOrder: newOrder })
    setDraggedPriority(priorityIndex)
  }

  const handlePriorityDragEnd = () => {
    setDraggedPriority(null)
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
        <div className="max-w-6xl mx-auto space-y-6">
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

          {/* 1. TAT Safety Window */}
          <div className="bg-white rounded-xl shadow-sm border border-table-border p-6">
            <div className="flex items-start space-x-3 mb-4 pb-3 border-b border-gray-200">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900">
                  TAT Safety
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Highest priority - overrides all other priorities
                </p>
              </div>
            </div>
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

          {/* 2. Escalation Priority */}
          <div className="bg-white rounded-xl shadow-sm border border-table-border p-6">
            <div className="flex items-start space-x-3 mb-4 pb-3 border-b border-gray-200">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900">
                  Escalated Items
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Second priority - after TAT safety
                </p>
              </div>
            </div>
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

          {/* 3. Department Priority Order with Parallel Lanes */}
          <div className="bg-white rounded-xl shadow-sm border border-table-border p-6">
            <div className="flex items-start space-x-3 mb-4 pb-3 border-b border-gray-200">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900">
                  Department Priority
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Drag priority lanes to reorder. Drag departments between lanes. Departments in the same lane have equal priority.
                </p>
              </div>
              <button
                onClick={handleAddPriorityLevel}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary-hover rounded-md"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Priority Level
              </button>
            </div>

            <div className="space-y-3">
              {config.departmentOrder.map((depts, priorityIndex) => {
                const availableDepts = getAvailableDepartments()
                return (
                  <div
                    key={priorityIndex}
                    draggable
                    onDragStart={() => handlePriorityDragStart(priorityIndex)}
                    onDragOver={(e) => handlePriorityDragOver(e, priorityIndex)}
                    onDragEnd={handlePriorityDragEnd}
                    onDrop={() => handleDeptDrop(priorityIndex)}
                    className={`group border-2 rounded-lg transition-all ${
                      draggedPriority === priorityIndex
                        ? 'border-primary bg-primary-light shadow-lg'
                        : 'border-gray-200 bg-gray-50 hover:border-primary hover:shadow-md'
                    }`}
                  >
                    {/* Priority Lane Header */}
                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white rounded-t-lg">
                      <div className="flex items-center space-x-3">
                        <GripVertical className="w-4 h-4 text-gray-400 group-hover:text-primary cursor-move" />
                        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-xs font-bold">
                          {priorityIndex + 1}
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          Priority Level {priorityIndex + 1}
                        </div>
                        {depts.length > 1 && (
                          <div className="text-xs text-gray-500 bg-blue-50 px-2 py-0.5 rounded">
                            {depts.length} parallel departments
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleMovePriority(priorityIndex, 'up')}
                          disabled={priorityIndex === 0}
                          className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move priority level up"
                        >
                          <ChevronUp className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleMovePriority(priorityIndex, 'down')}
                          disabled={priorityIndex === config.departmentOrder.length - 1}
                          className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move priority level down"
                        >
                          <ChevronDown className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleRemovePriorityLevel(priorityIndex)}
                          className="p-1 rounded hover:bg-red-50 text-red-600"
                          title="Remove priority level"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Department Chips in Lane */}
                    <div
                      className="p-4 min-h-[60px]"
                      onDragOver={handleDeptDragOver}
                    >
                      <div className="flex flex-wrap gap-2">
                        {depts.map((deptCode) => {
                          const deptInfo = AVAILABLE_DEPARTMENTS.find(d => d.code === deptCode)
                          return (
                            <div
                              key={deptCode}
                              draggable
                              onDragStart={() => handleDeptDragStart(deptCode, priorityIndex)}
                              onDragEnd={handleDeptDragEnd}
                              className={`group/chip inline-flex items-center px-3 py-2 bg-white border-2 border-primary rounded-lg cursor-move hover:shadow-md transition-all ${
                                draggedDept?.dept === deptCode ? 'opacity-50' : ''
                              }`}
                            >
                              <GripVertical className="w-3 h-3 text-gray-400 mr-2 group-hover/chip:text-primary" />
                              <span className="text-sm font-medium text-gray-900">
                                {deptInfo?.name || deptCode}
                              </span>
                              <button
                                onClick={() => handleRemoveDepartment(priorityIndex, deptCode)}
                                className="ml-2 p-0.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )
                        })}

                        {/* Add Department Button */}
                        {availableDepts.length > 0 && (
                          <div className="relative">
                            <button
                              onClick={() => setShowAddDeptDropdown(
                                showAddDeptDropdown === priorityIndex ? null : priorityIndex
                              )}
                              className="inline-flex items-center px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary hover:text-primary hover:bg-primary-light transition-all"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              <span className="text-xs font-medium">Add Department</span>
                            </button>

                            {/* Dropdown */}
                            {showAddDeptDropdown === priorityIndex && (
                              <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                                {availableDepts.map(dept => (
                                  <button
                                    key={dept.code}
                                    onClick={() => handleAddDepartment(priorityIndex, dept.code)}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-primary-light"
                                  >
                                    {dept.name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {depts.length === 0 && (
                        <div className="text-xs text-gray-400 text-center py-2">
                          Drag departments here or click "Add Department"
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {config.departmentOrder.length === 0 && (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-sm font-medium">No priority levels defined</p>
                  <p className="text-xs mt-1">Click "Add Priority Level" to get started</p>
                </div>
              )}
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
                  <div className="text-xs text-gray-500 space-y-2">
                    {config.departmentOrder.map((depts, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <span className="font-medium text-primary">{idx + 1}.</span>
                        <div className="flex-1">
                          {depts.length === 1 ? (
                            <div>
                              <span className="font-medium">
                                {AVAILABLE_DEPARTMENTS.find(d => d.code === depts[0])?.name || depts[0]}
                              </span>
                              <span className="text-gray-400"> → Then soonest TAT</span>
                            </div>
                          ) : (
                            <div>
                              <span className="font-medium text-blue-600">
                                {depts.map(d => AVAILABLE_DEPARTMENTS.find(dept => dept.code === d)?.name || d).join(' = ')}
                              </span>
                              <span className="text-gray-400"> (parallel priority)</span>
                              <span className="text-gray-400"> → Then soonest TAT</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
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

      {/* Click outside to close dropdown */}
      {showAddDeptDropdown !== null && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowAddDeptDropdown(null)}
        />
      )}
    </div>
  )
}
