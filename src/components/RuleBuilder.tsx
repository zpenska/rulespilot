import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Save } from 'lucide-react'
import {
  Rule,
  StandardFieldCriteria,
  CustomFieldCriteria,
  StandardFieldName,
  StandardOperator,
  CustomOperator,
  ProviderRole,
  CustomFieldAssociation,
  RuleActions,
} from '../types/rules'
import {
  FIELD_DEFINITIONS,
  FIELD_CATEGORIES,
  PROVIDER_ROLES,
  CUSTOM_FIELD_ASSOCIATIONS,
} from '../config/fieldDefinitions'
import { validateRule } from '../services/validationService'
import { createRule, updateRule } from '../services/rulesService'
import { getDictionaryOptions } from '../services/dictionaryService'

interface RuleBuilderProps {
  rule?: Rule | null
  onClose: () => void
  onSave: (rule: Rule) => void
}

export default function RuleBuilder({ rule, onClose, onSave }: RuleBuilderProps) {
  const [ruleDesc, setRuleDesc] = useState(rule?.ruleDesc || '')
  const [weight, setWeight] = useState<number | undefined>(rule?.weight)
  const [activationDate, setActivationDate] = useState(rule?.activationDate || '')
  const [status, setStatus] = useState<'active' | 'inactive'>(rule?.status || 'inactive')
  const [standardCriteria, setStandardCriteria] = useState<StandardFieldCriteria[]>(
    rule?.standardFieldCriteria || []
  )
  const [customCriteria, setCustomCriteria] = useState<CustomFieldCriteria[]>(
    rule?.customFieldCriteria || []
  )
  const [actions, setActions] = useState<RuleActions>(rule?.actions || {})
  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

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

  const handleAddCustomCriteria = () => {
    setCustomCriteria([
      ...customCriteria,
      {
        association: 'MEMBER' as CustomFieldAssociation,
        templateId: '',
        operator: 'IN' as CustomOperator,
        values: [],
      },
    ])
  }

  const handleRemoveCustomCriteria = (index: number) => {
    setCustomCriteria(customCriteria.filter((_, i) => i !== index))
  }

  const handleUpdateCustomCriteria = (
    index: number,
    updates: Partial<CustomFieldCriteria>
  ) => {
    const updated = [...customCriteria]
    updated[index] = { ...updated[index], ...updates }
    setCustomCriteria(updated)
  }

  const handleSave = async () => {
    // Clean up actions - remove empty generateLetters arrays
    const cleanedActions = { ...actions }
    if (cleanedActions.generateLetters && cleanedActions.generateLetters.length === 0) {
      delete cleanedActions.generateLetters
    }

    const ruleData = {
      ruleDesc,
      standardFieldCriteria: standardCriteria,
      customFieldCriteria: customCriteria,
      weight,
      activationDate,
      status,
      actions: Object.keys(cleanedActions).length > 0 ? cleanedActions : undefined,
    }

    const validationErrors = validateRule(ruleData)

    if (validationErrors.length > 0) {
      setErrors(validationErrors.map((e) => e.message))
      return
    }

    setSaving(true)

    try {
      let savedRule: Rule
      if (rule?.id) {
        await updateRule(rule.id, ruleData)
        savedRule = { ...rule, ...ruleData, updatedAt: new Date().toISOString() }
      } else {
        savedRule = await createRule(ruleData)
      }
      onSave(savedRule)
      onClose()
    } catch (error) {
      console.error('Error saving rule:', error)
      setErrors(['Failed to save rule'])
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {rule ? 'Edit Rule' : 'Create New Rule'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="bg-gray-50 px-6 py-6 max-h-[70vh] overflow-y-auto">
            {/* Errors */}
            {errors.length > 0 && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-red-800 mb-2">
                  Validation Errors:
                </h4>
                <ul className="list-disc list-inside text-sm text-red-700">
                  {errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Rule Basic Info */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-4">
                Rule Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rule Description *
                  </label>
                  <textarea
                    value={ruleDesc}
                    onChange={(e) => setRuleDesc(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Describe what this rule does..."
                  />
                </div>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Higher weight = higher priority"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Activation Date
                  </label>
                  <input
                    type="date"
                    value={activationDate}
                    onChange={(e) => setActivationDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Standard Field Criteria */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-900">
                  Standard Field Criteria
                </h4>
                <button
                  onClick={handleAddStandardCriteria}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Criteria
                </button>
              </div>

              {standardCriteria.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No standard criteria added yet
                </p>
              ) : (
                <div className="space-y-3">
                  {standardCriteria.map((criteria, index) => (
                    <StandardCriteriaEditor
                      key={index}
                      criteria={criteria}
                      onChange={(updates) =>
                        handleUpdateStandardCriteria(index, updates)
                      }
                      onRemove={() => handleRemoveStandardCriteria(index)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Custom Field Criteria */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-900">
                  Custom Field Criteria
                </h4>
                <button
                  onClick={handleAddCustomCriteria}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Custom Criteria
                </button>
              </div>

              {customCriteria.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No custom criteria added yet
                </p>
              ) : (
                <div className="space-y-3">
                  {customCriteria.map((criteria, index) => (
                    <CustomCriteriaEditor
                      key={index}
                      criteria={criteria}
                      onChange={(updates) =>
                        handleUpdateCustomCriteria(index, updates)
                      }
                      onRemove={() => handleRemoveCustomCriteria(index)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-4">
                Actions (Optional)
              </h4>

              <div className="space-y-4">
                {/* Assign Skill */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={!!actions.assignSkill}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setActions({ ...actions, assignSkill: { skillCode: '' } })
                      } else {
                        const { assignSkill, ...rest } = actions
                        setActions(rest)
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <label className="text-sm font-medium text-gray-700">Assign Skill</label>
                  {actions.assignSkill && (
                    <input
                      type="text"
                      value={actions.assignSkill.skillCode}
                      onChange={(e) =>
                        setActions({
                          ...actions,
                          assignSkill: { skillCode: e.target.value },
                        })
                      }
                      placeholder="Skill Code (e.g., SKILL1)"
                      className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-md"
                    />
                  )}
                </div>

                {/* Assign License */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={!!actions.assignLicense}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setActions({ ...actions, assignLicense: { licenseCode: '' } })
                      } else {
                        const { assignLicense, ...rest } = actions
                        setActions(rest)
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <label className="text-sm font-medium text-gray-700">Assign License</label>
                  {actions.assignLicense && (
                    <input
                      type="text"
                      value={actions.assignLicense.licenseCode}
                      onChange={(e) =>
                        setActions({
                          ...actions,
                          assignLicense: { licenseCode: e.target.value },
                        })
                      }
                      placeholder="License Code (e.g., LIC1)"
                      className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-md"
                    />
                  )}
                </div>

                {/* Department Routing */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={!!actions.departmentRouting}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setActions({ ...actions, departmentRouting: { departmentCode: '' } })
                      } else {
                        const { departmentRouting, ...rest } = actions
                        setActions(rest)
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <label className="text-sm font-medium text-gray-700">Department Routing</label>
                  {actions.departmentRouting && (
                    <input
                      type="text"
                      value={actions.departmentRouting.departmentCode}
                      onChange={(e) =>
                        setActions({
                          ...actions,
                          departmentRouting: { departmentCode: e.target.value },
                        })
                      }
                      placeholder="Department Code (e.g., DEPT2)"
                      className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-md"
                    />
                  )}
                </div>

                {/* Close */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={!!actions.close}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setActions({ ...actions, close: { dispositionCode: '' } })
                      } else {
                        const { close, ...rest } = actions
                        setActions(rest)
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <label className="text-sm font-medium text-gray-700">Close</label>
                  {actions.close && (
                    <input
                      type="text"
                      value={actions.close.dispositionCode}
                      onChange={(e) =>
                        setActions({
                          ...actions,
                          close: { dispositionCode: e.target.value },
                        })
                      }
                      placeholder="Disposition Code (e.g., DISP1)"
                      className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-md"
                    />
                  )}
                </div>

                {/* Generate Letters */}
                <div className="border border-gray-200 rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Generate Letter
                    </label>
                    <button
                      onClick={() =>
                        setActions({
                          ...actions,
                          generateLetters: [
                            ...(actions.generateLetters || []),
                            { letterName: '' },
                          ],
                        })
                      }
                      className="inline-flex items-center px-2 py-1 text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Letter Template
                    </button>
                  </div>
                  {actions.generateLetters && actions.generateLetters.length > 0 ? (
                    <div className="space-y-2">
                      {actions.generateLetters.map((letter, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={letter.letterName}
                            onChange={(e) => {
                              const updated = [...(actions.generateLetters || [])]
                              updated[index] = { letterName: e.target.value }
                              setActions({ ...actions, generateLetters: updated })
                            }}
                            placeholder="Letter Name (e.g., Master Ordering Outpatient)"
                            className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-md"
                          />
                          <button
                            onClick={() => {
                              const updated = (actions.generateLetters || []).filter(
                                (_, i) => i !== index
                              )
                              if (updated.length === 0) {
                                const { generateLetters, ...rest } = actions
                                setActions(rest)
                              } else {
                                setActions({ ...actions, generateLetters: updated })
                              }
                            }}
                            className="p-1 text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-2">
                      No letters added yet
                    </p>
                  )}
                </div>

                {/* Hints */}
                <div className="border border-gray-200 rounded-md p-3">
                  <div className="flex items-center space-x-3 mb-2">
                    <input
                      type="checkbox"
                      checked={!!actions.hints}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setActions({ ...actions, hints: { message: '' } })
                        } else {
                          const { hints, ...rest } = actions
                          setActions(rest)
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <label className="text-sm font-medium text-gray-700">Hints</label>
                  </div>
                  {actions.hints && (
                    <textarea
                      value={actions.hints.message}
                      onChange={(e) =>
                        setActions({
                          ...actions,
                          hints: { message: e.target.value },
                        })
                      }
                      placeholder="Enter hint message..."
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Rule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Standard Criteria Editor Component
function StandardCriteriaEditor({
  criteria,
  onChange,
  onRemove,
}: {
  criteria: StandardFieldCriteria
  onChange: (updates: Partial<StandardFieldCriteria>) => void
  onRemove: () => void
}) {
  const fieldDef = FIELD_DEFINITIONS[criteria.field]
  const [dictionaryOptions, setDictionaryOptions] = useState<
    Array<{ value: string; label: string }>
  >([])

  useEffect(() => {
    if (fieldDef?.dictionaryKey) {
      getDictionaryOptions(fieldDef.dictionaryKey).then(setDictionaryOptions)
    }
  }, [fieldDef?.dictionaryKey])

  const handleFieldChange = (field: StandardFieldName) => {
    const newFieldDef = FIELD_DEFINITIONS[field]
    onChange({
      field,
      operator: newFieldDef.allowedOperators[0],
      values: [],
      providerRole: undefined,
      alternateIdType: undefined,
    })
  }

  const handleOperatorChange = (operator: StandardOperator) => {
    onChange({ operator, values: [] })
  }

  const handleValueChange = (values: string[]) => {
    onChange({ values })
  }

  return (
    <div className="border border-gray-200 rounded-md p-3">
      <div className="flex items-start space-x-2">
        <div className="flex-1 grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Field
            </label>
            <select
              value={criteria.field}
              onChange={(e) => handleFieldChange(e.target.value as StandardFieldName)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
            >
              {FIELD_CATEGORIES.map((category) => (
                <optgroup key={category} label={category}>
                  {Object.values(FIELD_DEFINITIONS)
                    .filter((f) => f.category === category)
                    .map((f) => (
                      <option key={f.name} value={f.name}>
                        {f.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Operator
            </label>
            <select
              value={criteria.operator}
              onChange={(e) => handleOperatorChange(e.target.value as StandardOperator)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
            >
              {fieldDef?.allowedOperators.map((op) => (
                <option key={op} value={op}>
                  {op.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Values
            </label>
            <ValueInput
              values={criteria.values}
              onChange={handleValueChange}
              operator={criteria.operator}
              dataType={fieldDef?.dataType || 'STRING'}
              dictionaryOptions={dictionaryOptions}
            />
          </div>

          {fieldDef?.requiresProviderRole && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Provider Role *
              </label>
              <select
                value={criteria.providerRole || ''}
                onChange={(e) =>
                  onChange({ providerRole: e.target.value as ProviderRole })
                }
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
              >
                <option value="">Select role...</option>
                {PROVIDER_ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {fieldDef?.requiresAlternateIdType && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Alternate ID Type *
              </label>
              <input
                type="text"
                value={criteria.alternateIdType || ''}
                onChange={(e) => onChange({ alternateIdType: e.target.value })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                placeholder="e.g., MEDICAID, TIN"
              />
            </div>
          )}
        </div>

        <button
          onClick={onRemove}
          className="mt-6 p-1 text-red-600 hover:text-red-800"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Custom Criteria Editor Component
function CustomCriteriaEditor({
  criteria,
  onChange,
  onRemove,
}: {
  criteria: CustomFieldCriteria
  onChange: (updates: Partial<CustomFieldCriteria>) => void
  onRemove: () => void
}) {
  const handleValueChange = (values: string[]) => {
    onChange({ values })
  }

  return (
    <div className="border border-gray-200 rounded-md p-3">
      <div className="flex items-start space-x-2">
        <div className="flex-1 grid grid-cols-4 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Association
            </label>
            <select
              value={criteria.association}
              onChange={(e) =>
                onChange({ association: e.target.value as CustomFieldAssociation })
              }
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
            >
              {CUSTOM_FIELD_ASSOCIATIONS.map((assoc) => (
                <option key={assoc.value} value={assoc.value}>
                  {assoc.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Template ID
            </label>
            <input
              type="text"
              value={criteria.templateId}
              onChange={(e) => onChange({ templateId: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
              placeholder="e.g., MEMCFLD1"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Operator
            </label>
            <select
              value={criteria.operator}
              onChange={(e) => onChange({ operator: e.target.value as CustomOperator })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
            >
              <option value="IN">IN</option>
              <option value="NOT_IN">NOT IN</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Values
            </label>
            <ValueInput
              values={criteria.values}
              onChange={handleValueChange}
              operator={criteria.operator as any}
              dataType="STRING"
            />
          </div>
        </div>

        <button
          onClick={onRemove}
          className="mt-6 p-1 text-red-600 hover:text-red-800"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Value Input Component
function ValueInput({
  values,
  onChange,
  operator,
  dataType,
  dictionaryOptions,
}: {
  values: string[]
  onChange: (values: string[]) => void
  operator: StandardOperator
  dataType: string
  dictionaryOptions?: Array<{ value: string; label: string }>
}) {
  const [inputValue, setInputValue] = useState('')

  const isBetween = operator === 'BETWEEN'
  const isMultiValue = operator === 'IN' || operator === 'NOT_IN'
  const isDate = dataType === 'DATE'

  const handleAdd = () => {
    if (inputValue && !values.includes(inputValue)) {
      onChange([...values, inputValue])
      setInputValue('')
    }
  }

  const handleRemove = (value: string) => {
    onChange(values.filter((v) => v !== value))
  }

  if (isBetween) {
    return (
      <div className="flex space-x-1">
        <input
          type={isDate ? 'date' : 'text'}
          value={values[0] || ''}
          onChange={(e) => onChange([e.target.value, values[1] || ''])}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
          placeholder="From"
        />
        <input
          type={isDate ? 'date' : 'text'}
          value={values[1] || ''}
          onChange={(e) => onChange([values[0] || '', e.target.value])}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
          placeholder="To"
        />
      </div>
    )
  }

  if (isMultiValue) {
    return (
      <div className="space-y-1">
        {dictionaryOptions && dictionaryOptions.length > 0 ? (
          <select
            value=""
            onChange={(e) => {
              if (e.target.value && !values.includes(e.target.value)) {
                onChange([...values, e.target.value])
              }
            }}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
          >
            <option value="">Select...</option>
            {dictionaryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <div className="flex space-x-1">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md"
              placeholder="Add value..."
            />
            <button
              onClick={handleAdd}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
            >
              Add
            </button>
          </div>
        )}
        {values.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {values.map((value) => (
              <span
                key={value}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-indigo-100 text-indigo-800"
              >
                {value}
                <button
                  onClick={() => handleRemove(value)}
                  className="ml-1 text-indigo-600 hover:text-indigo-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <input
      type={isDate ? 'date' : 'text'}
      value={values[0] || ''}
      onChange={(e) => onChange([e.target.value])}
      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
      placeholder="Enter value..."
    />
  )
}
