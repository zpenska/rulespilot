import { useState, useEffect } from 'react'
import { Plus, Trash2, Save } from 'lucide-react'
import {
  Rule,
  StandardFieldCriteria,
  CustomFieldCriteria,
  StandardFieldName,
  StandardOperator,
  HintsAction,
  MessageContext,
  MessageDisplayLocation,
  MessageColor,
} from '../types/rules'
import {
  FIELD_DEFINITIONS,
  FIELD_CATEGORIES,
} from '../config/fieldDefinitions'
import { validateRule } from '../services/validationService'
import { createRule, updateRule } from '../services/rulesService'
import { calculateAtoms } from '../utils/ruleUtils'
import { useRulesStore } from '../store/rulesStore'

interface HintsRuleBuilderProps {
  rule?: Rule | null
  onClose: () => void
  onSave: () => void
}

export default function HintsRuleBuilder({ rule, onClose, onSave }: HintsRuleBuilderProps) {
  const aiGeneratedDraft = useRulesStore((state) => state.aiGeneratedDraft)
  const clearAiGeneratedDraft = useRulesStore((state) => state.clearAiGeneratedDraft)

  // Use AI draft if creating new rule and draft exists
  const initialData = !rule && aiGeneratedDraft ? aiGeneratedDraft : rule

  const [code, setCode] = useState(initialData?.code || '')
  const [ruleDesc, setRuleDesc] = useState(initialData?.ruleDesc || '')
  const [weight, setWeight] = useState<number | undefined>(initialData?.weight)
  const [activationDate, setActivationDate] = useState(initialData?.activationDate || '')
  const [expirationDate, setExpirationDate] = useState(initialData?.expirationDate || '')
  const [status, setStatus] = useState<'active' | 'inactive'>(initialData?.status || 'inactive')
  const [standardCriteria, setStandardCriteria] = useState<StandardFieldCriteria[]>(
    initialData?.standardFieldCriteria || []
  )
  const [customCriteria] = useState<CustomFieldCriteria[]>(
    initialData?.customFieldCriteria || []
  )
  const [hints, setHints] = useState<HintsAction>(initialData?.hints || { message: '' })
  const [errors, setErrors] = useState<string[]>([])

  // Calculate atoms automatically from criteria
  const atoms = calculateAtoms({ standardFieldCriteria: standardCriteria, customFieldCriteria: customCriteria })
  const [saving, setSaving] = useState(false)

  // Clear AI draft when component unmounts or when we navigate away
  useEffect(() => {
    return () => {
      if (!rule && aiGeneratedDraft) {
        clearAiGeneratedDraft()
      }
    }
  }, [rule, aiGeneratedDraft, clearAiGeneratedDraft])

  const handleAddStandardCriteria = () => {
    setStandardCriteria([
      ...standardCriteria,
      {
        field: 'MEMBER_STATE' as StandardFieldName,
        operator: 'IN' as StandardOperator,
        values: [],
      },
    ])
  }

  const handleRemoveStandardCriteria = (index: number) => {
    setStandardCriteria(standardCriteria.filter((_, i) => i !== index))
  }

  const handleUpdateStandardCriteria = (
    index: number,
    updates: Partial<StandardFieldCriteria>
  ) => {
    const updated = [...standardCriteria]
    updated[index] = { ...updated[index], ...updates }
    setStandardCriteria(updated)
  }


  const handleSave = async () => {
    const ruleData: Partial<Rule> = {
      code,
      ruleDesc,
      ruleType: 'hints',
      standardFieldCriteria: standardCriteria,
      customFieldCriteria: customCriteria,
      weight,
      atoms,
      activationDate,
      expirationDate,
      status,
      hints,
    }

    // Validate
    const validationErrors = validateRule(ruleData)
    if (validationErrors.length > 0) {
      setErrors(validationErrors.map((e) => e.message))
      return
    }

    setSaving(true)
    setErrors([])

    try {
      if (rule?.id) {
        await updateRule(rule.id, ruleData)
      } else {
        await createRule(ruleData as Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>)
      }
      onSave()
      onClose()
    } catch (error: unknown) {
      console.error('Error saving rule:', error)
      const message = error instanceof Error ? error.message : 'Failed to save rule'
      setErrors([message])
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {rule ? 'Edit Hints Rule' : 'Create Hints Rule'}
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">
              Configure hints/messages to display to users
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Rule'}
            </button>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Validation Errors:</h3>
                <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                  {errors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-bg-light">
        <div className="max-w-6xl mx-auto px-6 py-6">
            {/* Basic Info */}
            <div className="bg-white rounded-xl shadow-sm border border-table-border p-4 mb-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                Basic Information
              </h4>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rule Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                    placeholder="Enter a Rule Code (3-100 symbols)"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rule Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={ruleDesc}
                    onChange={(e) => setRuleDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                    placeholder="Enter a Rule Name"
                    maxLength={200}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight (Priority)
                    </label>
                    <input
                      type="number"
                      value={weight || ''}
                      onChange={(e) =>
                        setWeight(e.target.value ? parseInt(e.target.value) : undefined)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                      placeholder="Higher weight = higher priority"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Atoms (Criteria Count)
                    </label>
                    <input
                      type="number"
                      value={atoms}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                      title="Auto-calculated from number of criteria fields"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Active From
                    </label>
                    <input
                      type="date"
                      value={activationDate}
                      onChange={(e) => setActivationDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Active Through
                    </label>
                    <input
                      type="date"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Criteria */}
            <div className="bg-white rounded-xl shadow-sm border border-table-border p-4 mb-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                Criteria (When to show this hint)
              </h4>

              {/* Standard Criteria */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Standard Field Criteria</label>
                  <button
                    onClick={handleAddStandardCriteria}
                    className="inline-flex items-center px-3 py-1 text-xs font-medium text-primary bg-primary-light hover:bg-primary hover:text-white rounded"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Criteria
                  </button>
                </div>

                {standardCriteria.map((criteria, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-md">
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <select
                        value={criteria.field}
                        onChange={(e) =>
                          handleUpdateStandardCriteria(index, {
                            field: e.target.value as StandardFieldName,
                          })
                        }
                        className="px-3 py-2 text-sm border border-gray-300 rounded-md"
                      >
                        {FIELD_CATEGORIES.map((category) => (
                          <optgroup key={category} label={category}>
                            {Object.values(FIELD_DEFINITIONS).filter((f) => f.category === category).map((field) => (
                              <option key={field.name} value={field.name}>
                                {field.name.replace(/_/g, ' ')}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>

                      <select
                        value={criteria.operator}
                        onChange={(e) =>
                          handleUpdateStandardCriteria(index, {
                            operator: e.target.value as StandardOperator,
                          })
                        }
                        className="px-3 py-2 text-sm border border-gray-300 rounded-md"
                      >
                        <option value="IN">IN</option>
                        <option value="NOT_IN">NOT IN</option>
                        <option value="EQUALS">EQUALS</option>
                        <option value="GREATER_THAN">GREATER THAN</option>
                        <option value="LESS_THAN">LESS THAN</option>
                        <option value="VALUED">VALUED</option>
                        <option value="NOT_VALUED">NOT VALUED</option>
                      </select>

                      {/* Only show values input for operators that need values */}
                      {criteria.operator !== 'VALUED' && criteria.operator !== 'NOT_VALUED' ? (
                        <input
                          type="text"
                          value={criteria.values.join(', ')}
                          onChange={(e) =>
                            handleUpdateStandardCriteria(index, {
                              values: e.target.value.split(',').map((v) => v.trim()).filter(Boolean),
                            })
                          }
                          placeholder="Values (comma-separated)"
                          className="px-3 py-2 text-sm border border-gray-300 rounded-md"
                        />
                      ) : (
                        <div className="px-3 py-2 text-xs text-gray-500 italic bg-white rounded-md border border-gray-200">
                          No values required
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveStandardCriteria(index)}
                      className="p-2 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Hints Configuration */}
            <div className="bg-white rounded-xl shadow-sm border border-table-border p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                Hint / Message Configuration
              </h4>

              <div className="space-y-6">
                {/* Message Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    value={hints.message}
                    onChange={(e) => setHints({ ...hints, message: e.target.value })}
                    placeholder="Enter message to be displayed..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                  />
                </div>

                {/* Display Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Where to Display
                  </label>
                  <select
                    value={hints.displayLocation || ''}
                    onChange={(e) =>
                      setHints({
                        ...hints,
                        displayLocation: e.target.value ? (e.target.value as MessageDisplayLocation) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                  >
                    <option value="">Select location...</option>
                    <option value="MEMBER">Member</option>
                    <option value="PROVIDER">Provider</option>
                    <option value="SERVICES">Services</option>
                    <option value="DIAGNOSIS">Diagnosis</option>
                  </select>
                </div>

                {/* Context - Multi-select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Context (Optional)
                  </label>
                  <div className="space-y-2">
                    {(['MEMBER_DEMOGRAPHICS', 'PROVIDER_DEMOGRAPHICS', 'SERVICES', 'DIAGNOSIS', 'BUSINESS_ENTERPRISE_CATEGORIES'] as MessageContext[]).map((ctx) => (
                      <label key={ctx} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={hints.context?.includes(ctx) || false}
                          onChange={(e) => {
                            const currentContext = hints.context || []
                            const newContext = e.target.checked
                              ? [...currentContext, ctx]
                              : currentContext.filter((c) => c !== ctx)
                            setHints({
                              ...hints,
                              context: newContext.length > 0 ? newContext : undefined,
                            })
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">
                          {ctx.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message Color
                  </label>
                  <div className="flex space-x-2">
                    {(['RED', 'YELLOW', 'GREEN', 'BLUE'] as MessageColor[]).map((color) => {
                      const colorClasses = {
                        RED: 'bg-red-100 border-red-300 hover:bg-red-200 text-red-800',
                        YELLOW: 'bg-yellow-100 border-yellow-300 hover:bg-yellow-200 text-yellow-800',
                        GREEN: 'bg-green-100 border-green-300 hover:bg-green-200 text-green-800',
                        BLUE: 'bg-blue-100 border-blue-300 hover:bg-blue-200 text-blue-800',
                      }
                      const isSelected = hints.color === color
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setHints({ ...hints, color })}
                          className={`flex-1 px-4 py-3 text-sm font-medium rounded-md border-2 transition-all ${
                            colorClasses[color]
                          } ${isSelected ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                        >
                          {color.charAt(0) + color.slice(1).toLowerCase()}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3 flex-shrink-0">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
