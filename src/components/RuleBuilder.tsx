import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Save, Layout, Code2 } from 'lucide-react'
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
  TATParameters,
  SourceDateTimeField,
  UnitsOfMeasure,
  DateOperator,
  TriggerEvent,
  RequestTypeFilter,
} from '../types/rules'
import {
  FIELD_DEFINITIONS,
  FIELD_CATEGORIES,
  PROVIDER_ROLES,
  CUSTOM_FIELD_ASSOCIATIONS,
} from '../config/fieldDefinitions'
import {
  SOURCE_DATE_TIME_FIELDS,
  UNITS_OF_MEASURE,
  TAT_FIELD_LABELS,
  TAT_FIELD_DESCRIPTIONS,
} from '../config/tatConfig'
import { validateRule } from '../services/validationService'
import { createRule, updateRule } from '../services/rulesService'
import { getDictionaryOptions } from '../services/dictionaryService'
import { useRulesStore } from '../store/rulesStore'
import RuleFlowBuilder from './RuleFlowBuilder'
import { calculateAtoms } from '../utils/ruleUtils'

interface RuleBuilderProps {
  rule?: Rule | null
  onClose: () => void
  onSave: (rule: Rule) => void
}

export default function RuleBuilder({ rule, onClose, onSave }: RuleBuilderProps) {
  const currentRuleType = useRulesStore((state) => state.currentRuleType)
  const aiGeneratedDraft = useRulesStore((state) => state.aiGeneratedDraft)
  const clearAiGeneratedDraft = useRulesStore((state) => state.clearAiGeneratedDraft)

  // Use AI draft if creating new rule and draft exists
  const initialData = !rule && aiGeneratedDraft ? aiGeneratedDraft : rule

  const [viewMode, setViewMode] = useState<'form' | 'visual'>('form')
  const [code, setCode] = useState(initialData?.code || '')
  const [ruleDesc, setRuleDesc] = useState(initialData?.ruleDesc || '')
  const [weight, setWeight] = useState<number | undefined>(initialData?.weight)
  const [activationDate, setActivationDate] = useState(initialData?.activationDate || '')
  const [expirationDate, setExpirationDate] = useState(initialData?.expirationDate || '')
  const [status, setStatus] = useState<'active' | 'inactive'>(initialData?.status || 'inactive')
  const [standardCriteria, setStandardCriteria] = useState<StandardFieldCriteria[]>(
    initialData?.standardFieldCriteria || []
  )
  const [customCriteria, setCustomCriteria] = useState<CustomFieldCriteria[]>(
    initialData?.customFieldCriteria || []
  )
  const [actions, setActions] = useState<RuleActions>(initialData?.actions || {})
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

  // Workflow-specific state (only for workflow rules)
  const [triggerEvents, setTriggerEvents] = useState<TriggerEvent[]>(initialData?.triggerEvents || [])
  const [requestTypeFilter, setRequestTypeFilter] = useState<RequestTypeFilter>(
    initialData?.requestTypeFilter || null
  )
  const [fireOnce, setFireOnce] = useState<boolean>(initialData?.fireOnce || false)

  // TAT-specific state
  const [tatParameters, setTatParameters] = useState<TATParameters>({
    sourceDateTimeField: initialData?.tatParameters?.sourceDateTimeField || 'NOTIFICATION_DATE_TIME',
    units: initialData?.tatParameters?.units || 72,
    unitsOfMeasure: initialData?.tatParameters?.unitsOfMeasure || 'HOURS',
    dueTime: initialData?.tatParameters?.dueTime || null,
    holidayDates: initialData?.tatParameters?.holidayDates || [],
    holidayCategory: initialData?.tatParameters?.holidayCategory || null,
    holidayOffset: initialData?.tatParameters?.holidayOffset || null,
    clinicalsRequestedResponseThresholdHours: initialData?.tatParameters?.clinicalsRequestedResponseThresholdHours || null,
    dateOperator: initialData?.tatParameters?.dateOperator || null,
    autoExtend: initialData?.tatParameters?.autoExtend || false,
    extendStatusReason: initialData?.tatParameters?.extendStatusReason || null,
  })
  const [holidayDateInput, setHolidayDateInput] = useState('')

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
    const ruleType = rule?.ruleType || currentRuleType

    // Prepare rule data based on type
    const ruleData: Record<string, unknown> = {
      code,
      ruleDesc,
      ruleType,
      standardFieldCriteria: standardCriteria,
      customFieldCriteria: customCriteria,
      weight,
      atoms,
      activationDate,
      expirationDate,
      status,
    }

    // Add type-specific fields
    if (ruleType === 'tat') {
      // TAT rules need tatParameters
      ruleData.tatParameters = tatParameters
    } else if (ruleType === 'workflow') {
      // Workflow rules need actions
      const cleanedActions = { ...actions }
      if (cleanedActions.generateLetters && cleanedActions.generateLetters.length === 0) {
        delete cleanedActions.generateLetters
      }
      ruleData.actions = Object.keys(cleanedActions).length > 0 ? cleanedActions : undefined

      // Add workflow-specific fields
      if (ruleType === 'workflow') {
        if (triggerEvents.length > 0) {
          ruleData.triggerEvents = triggerEvents
        }
        if (requestTypeFilter) {
          ruleData.requestTypeFilter = requestTypeFilter
        }
        if (fireOnce) {
          ruleData.fireOnce = fireOnce
        }
      }
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
        savedRule = await createRule(ruleData as Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>)
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
    <div className="flex flex-col h-full">
      {/* Header - Inline style without modal appearance */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            {rule ? `Edit ${currentRuleType === 'workflow' ? 'Workflow' : currentRuleType === 'tat' ? 'TAT' : 'Rule'}` : `Create ${currentRuleType === 'workflow' ? 'Workflow' : currentRuleType === 'tat' ? 'TAT' : 'New'} Rule`}
          </h3>
          <p className="text-xs text-gray-600 mt-0.5">
            {currentRuleType === 'workflow' && 'Configure automated workflow actions and triggers'}
            {currentRuleType === 'tat' && 'Configure turnaround time calculation parameters'}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setViewMode('form')}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'form'
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Code2 className="w-4 h-4" />
              Form Builder
            </button>
            <button
              onClick={() => setViewMode('visual')}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'visual'
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Layout className="w-4 h-4" />
              Visual Builder
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {viewMode === 'visual' ? (
        <div className="flex-1 overflow-hidden">
          <RuleFlowBuilder
            rule={{
              code,
              ruleDesc,
              ruleType: currentRuleType,
              standardFieldCriteria: standardCriteria,
              customFieldCriteria: customCriteria,
              actions: currentRuleType === 'tat' ? undefined : actions,
              tatParameters: currentRuleType === 'tat' ? tatParameters : undefined,
            }}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto bg-bg-light">
          <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="mb-4 bg-red-50 border-2 border-red-200 rounded-xl p-4 shadow-sm">
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
          <div className="bg-white rounded-xl shadow-sm border border-table-border p-4 mb-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              Rule Information
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

          {/* Standard Field Criteria */}
          <div className="bg-white rounded-xl shadow-sm border border-table-border p-4 mb-4">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900">
                Standard Field Criteria
              </h4>
              <button
                onClick={handleAddStandardCriteria}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Plus className="w-4 h-4 mr-1.5" />
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
          <div className="bg-white rounded-xl shadow-sm border border-table-border p-4 mb-4">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900">
                Custom Field Criteria
              </h4>
              <button
                onClick={handleAddCustomCriteria}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Plus className="w-4 h-4 mr-1.5" />
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

          {/* Workflow-Specific Fields (Trigger Events, Request Type Filter) */}
          {currentRuleType === 'workflow' && (
            <div className="bg-white rounded-xl shadow-sm border border-table-border p-4 mb-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                Workflow Triggers & Filters
              </h4>

              <div className="space-y-6">
                {/* Trigger Events */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Trigger Events
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Select when this workflow rule should fire
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'CREATE_REQUEST' as TriggerEvent, label: 'Create Request' },
                      { value: 'EDIT_REQUEST' as TriggerEvent, label: 'Edit Request' },
                      { value: 'EXTEND_REQUEST' as TriggerEvent, label: 'Extend Request' },
                      { value: 'CREATE_SERVICE' as TriggerEvent, label: 'Create Service' },
                      { value: 'EDIT_SERVICE' as TriggerEvent, label: 'Edit Service' },
                      { value: 'EXTEND_SERVICE' as TriggerEvent, label: 'Extend Service' },
                      { value: 'SAVE_QUESTIONNAIRE' as TriggerEvent, label: 'Save Questionnaire' },
                    ].map((trigger) => (
                      <label
                        key={trigger.value}
                        className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={triggerEvents.includes(trigger.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTriggerEvents([...triggerEvents, trigger.value])
                            } else {
                              setTriggerEvents(
                                triggerEvents.filter((t) => t !== trigger.value)
                              )
                            }
                          }}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-gray-700">{trigger.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Request Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Request Type Filter
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Filter by request type (optional)
                  </p>
                  <div className="flex gap-3">
                    <label className="flex items-center space-x-2 p-3 border rounded-md hover:bg-gray-50 cursor-pointer flex-1">
                      <input
                        type="radio"
                        name="requestTypeFilter"
                        checked={requestTypeFilter === null}
                        onChange={() => setRequestTypeFilter(null)}
                        className="border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">Any Request Type</span>
                    </label>
                    <label className="flex items-center space-x-2 p-3 border rounded-md hover:bg-gray-50 cursor-pointer flex-1">
                      <input
                        type="radio"
                        name="requestTypeFilter"
                        checked={requestTypeFilter === 'INPATIENT'}
                        onChange={() => setRequestTypeFilter('INPATIENT')}
                        className="border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">Inpatient Only</span>
                    </label>
                    <label className="flex items-center space-x-2 p-3 border rounded-md hover:bg-gray-50 cursor-pointer flex-1">
                      <input
                        type="radio"
                        name="requestTypeFilter"
                        checked={requestTypeFilter === 'OUTPATIENT'}
                        onChange={() => setRequestTypeFilter('OUTPATIENT')}
                        className="border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">Outpatient Only</span>
                    </label>
                  </div>
                </div>

                {/* Fire Once */}
                <div>
                  <label className="flex items-center space-x-2 p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fireOnce}
                      onChange={(e) => setFireOnce(e.target.checked)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Fire Once Per Request</span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Rule will only fire one time for each request
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Actions or TAT Parameters based on rule type */}
          {currentRuleType === 'tat' ? (
            /* TAT Parameters */
            <div className="bg-white rounded-xl shadow-sm border border-table-border p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                TAT Calculation Parameters
              </h4>

              <div className="space-y-6">
                {/* Source Date/Time Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {TAT_FIELD_LABELS.sourceDateTimeField} *
                  </label>
                  <p className="text-xs text-gray-500 mb-2">{TAT_FIELD_DESCRIPTIONS.sourceDateTimeField}</p>
                  <select
                    value={tatParameters.sourceDateTimeField}
                    onChange={(e) =>
                      setTatParameters({
                        ...tatParameters,
                        sourceDateTimeField: e.target.value as SourceDateTimeField,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                  >
                    {SOURCE_DATE_TIME_FIELDS.map((field) => (
                      <option key={field.code} value={field.code}>
                        {field.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Units and Units of Measure */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {TAT_FIELD_LABELS.units} *
                    </label>
                    <p className="text-xs text-gray-500 mb-2">{TAT_FIELD_DESCRIPTIONS.units}</p>
                    <input
                      type="number"
                      value={tatParameters.units}
                      onChange={(e) =>
                        setTatParameters({
                          ...tatParameters,
                          units: parseInt(e.target.value) || 0,
                        })
                      }
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {TAT_FIELD_LABELS.unitsOfMeasure} *
                    </label>
                    <p className="text-xs text-gray-500 mb-2">{TAT_FIELD_DESCRIPTIONS.unitsOfMeasure}</p>
                    <select
                      value={tatParameters.unitsOfMeasure}
                      onChange={(e) =>
                        setTatParameters({
                          ...tatParameters,
                          unitsOfMeasure: e.target.value as UnitsOfMeasure,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                    >
                      {UNITS_OF_MEASURE.map((uom) => (
                        <option key={uom.code} value={uom.code}>
                          {uom.description}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Due Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {TAT_FIELD_LABELS.dueTime}
                  </label>
                  <p className="text-xs text-gray-500 mb-2">{TAT_FIELD_DESCRIPTIONS.dueTime}</p>
                  <input
                    type="time"
                    value={tatParameters.dueTime || ''}
                    onChange={(e) =>
                      setTatParameters({
                        ...tatParameters,
                        dueTime: e.target.value || null,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                  />
                </div>

                {/* Holiday Dates */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {TAT_FIELD_LABELS.holidayDates}
                  </label>
                  <p className="text-xs text-gray-500 mb-2">{TAT_FIELD_DESCRIPTIONS.holidayDates}</p>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="date"
                      value={holidayDateInput}
                      onChange={(e) => setHolidayDateInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && holidayDateInput) {
                          const formatted = holidayDateInput.replace(/-/g, '')
                          if (formatted.length === 8) {
                            setTatParameters({
                              ...tatParameters,
                              holidayDates: [
                                ...(tatParameters.holidayDates || []),
                                formatted,
                              ],
                            })
                            setHolidayDateInput('')
                          }
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                    />
                    <button
                      onClick={() => {
                        if (holidayDateInput) {
                          const formatted = holidayDateInput.replace(/-/g, '')
                          if (formatted.length === 8) {
                            setTatParameters({
                              ...tatParameters,
                              holidayDates: [
                                ...(tatParameters.holidayDates || []),
                                formatted,
                              ],
                            })
                            setHolidayDateInput('')
                          }
                        }
                      }}
                      className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {tatParameters.holidayDates && tatParameters.holidayDates.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tatParameters.holidayDates.map((date, index) => (
                        <div
                          key={index}
                          className="inline-flex items-center bg-gray-100 rounded px-2 py-1 text-sm"
                        >
                          <span>
                            {date.slice(0, 4)}-{date.slice(4, 6)}-{date.slice(6, 8)}
                          </span>
                          <button
                            onClick={() => {
                              setTatParameters({
                                ...tatParameters,
                                holidayDates: tatParameters.holidayDates?.filter((_, i) => i !== index),
                              })
                            }}
                            className="ml-2 text-red-600 hover:text-red-800"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Holiday Offset */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {TAT_FIELD_LABELS.holidayOffset}
                  </label>
                  <p className="text-xs text-gray-500 mb-2">{TAT_FIELD_DESCRIPTIONS.holidayOffset}</p>
                  <input
                    type="number"
                    value={tatParameters.holidayOffset || ''}
                    onChange={(e) =>
                      setTatParameters({
                        ...tatParameters,
                        holidayOffset: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    min="0"
                    placeholder="Leave empty for no offset"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                  />
                </div>

                {/* Clinicals Response Threshold */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {TAT_FIELD_LABELS.clinicalsRequestedResponseThresholdHours}
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    {TAT_FIELD_DESCRIPTIONS.clinicalsRequestedResponseThresholdHours}
                  </p>
                  <input
                    type="number"
                    value={tatParameters.clinicalsRequestedResponseThresholdHours || ''}
                    onChange={(e) =>
                      setTatParameters({
                        ...tatParameters,
                        clinicalsRequestedResponseThresholdHours: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    min="0"
                    placeholder="Leave empty if not applicable"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                  />
                </div>

                {/* Holiday Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {TAT_FIELD_LABELS.holidayCategory}
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    {TAT_FIELD_DESCRIPTIONS.holidayCategory}
                  </p>
                  <input
                    type="text"
                    value={tatParameters.holidayCategory || ''}
                    onChange={(e) =>
                      setTatParameters({
                        ...tatParameters,
                        holidayCategory: e.target.value || null,
                      })
                    }
                    placeholder="e.g., SKIPHDAY_CTGY_1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                  />
                </div>

                {/* Date Operator */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {TAT_FIELD_LABELS.dateOperator}
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    {TAT_FIELD_DESCRIPTIONS.dateOperator}
                  </p>
                  <select
                    value={tatParameters.dateOperator || ''}
                    onChange={(e) =>
                      setTatParameters({
                        ...tatParameters,
                        dateOperator: (e.target.value || null) as DateOperator | null,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                  >
                    <option value="">None</option>
                    <option value="=">=</option>
                    <option value="<">&lt;</option>
                    <option value=">">&gt;</option>
                    <option value="<=">&lt;=</option>
                    <option value=">=">&gt;=</option>
                  </select>
                </div>

                {/* Auto Extend */}
                <div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={tatParameters.autoExtend || false}
                      onChange={(e) =>
                        setTatParameters({
                          ...tatParameters,
                          autoExtend: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {TAT_FIELD_LABELS.autoExtend}
                      </label>
                      <p className="text-xs text-gray-500">
                        {TAT_FIELD_DESCRIPTIONS.autoExtend}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Extend Status Reason */}
                {tatParameters.autoExtend && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {TAT_FIELD_LABELS.extendStatusReason}
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      {TAT_FIELD_DESCRIPTIONS.extendStatusReason}
                    </p>
                    <input
                      type="text"
                      value={tatParameters.extendStatusReason || ''}
                      onChange={(e) =>
                        setTatParameters({
                          ...tatParameters,
                          extendStatusReason: e.target.value || null,
                        })
                      }
                      placeholder="e.g., 45DNOCLIN"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Actions */
            <div className="bg-white rounded-xl shadow-sm border border-table-border p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                Actions (Optional)
              </h4>

            <div className="space-y-4">
              {/* Workflow-only actions */}
              {currentRuleType === 'workflow' && (
                <>

              {/* Department Routing */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={!!actions.departmentRouting}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setActions({ ...actions, departmentRouting: { departmentCode: '' } })
                    } else {
                      const { departmentRouting: _departmentRouting, ...rest } = actions
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
                      const { close: _close, ...rest } = actions
                      setActions(rest)
                    }
                  }}
                  className="rounded border-gray-300"
                />
                <label className="text-sm font-medium text-gray-700">Close/Discharge Request</label>
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
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={!!actions.generateLetters && actions.generateLetters.length > 0}
                    onChange={(e) => {
                      if (!e.target.checked) {
                        const { generateLetters: _generateLetters, ...rest } = actions
                        setActions(rest)
                      } else {
                        setActions({
                          ...actions,
                          generateLetters: [{ letterName: '' }],
                        })
                      }
                    }}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Generate Letter
                  </label>
                </div>
                {actions.generateLetters && actions.generateLetters.length > 0 && (
                  <>
                    <div className="flex items-center justify-between pl-6">
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
                        className="inline-flex items-center px-2 py-1 text-xs bg-primary-light hover:bg-primary text-primary hover:text-white rounded"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Letter Template
                      </button>
                    </div>
                    <div className="space-y-2 pl-6">
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
                                const { generateLetters: _generateLetters, ...rest } = actions
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
                  </>
                )}
              </div>

                </>
              )}

              {/* Workflow-only actions (Create Task, Transfer, Create Program) */}
              {currentRuleType === 'workflow' && (
                <>
                  {/* Create Task */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={!!actions.createTask}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setActions({
                              ...actions,
                              createTask: {
                                typeCode: '',
                                reasonCode: '',
                                units: 0,
                                unitsUomCode: 'DAYS' as const,
                                calculationField: 'REQUEST_DUE_DATE',
                                priorityCode: '',
                              },
                            })
                          } else {
                            const { createTask: _createTask, ...rest } = actions
                            setActions(rest)
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <label className="text-sm font-medium text-gray-700">Create Task</label>
                    </div>
                    {actions.createTask && (
                      <div className="ml-6 space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Type Code *
                          </label>
                          <input
                            type="text"
                            value={actions.createTask.typeCode}
                            onChange={(e) =>
                              setActions({
                                ...actions,
                                createTask: {
                                  ...actions.createTask!,
                                  typeCode: e.target.value,
                                },
                              })
                            }
                            placeholder="e.g., IBX Retro TAT Tracking"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Reason Code *
                          </label>
                          <input
                            type="text"
                            value={actions.createTask.reasonCode}
                            onChange={(e) =>
                              setActions({
                                ...actions,
                                createTask: {
                                  ...actions.createTask!,
                                  reasonCode: e.target.value,
                                },
                              })
                            }
                            placeholder="e.g., Lack of Clinical"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Priority Code *
                          </label>
                          <input
                            type="text"
                            value={actions.createTask.priorityCode}
                            onChange={(e) =>
                              setActions({
                                ...actions,
                                createTask: {
                                  ...actions.createTask!,
                                  priorityCode: e.target.value,
                                },
                              })
                            }
                            placeholder="e.g., HIGH"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Units *
                            </label>
                            <input
                              type="number"
                              value={actions.createTask.units}
                              onChange={(e) =>
                                setActions({
                                  ...actions,
                                  createTask: {
                                    ...actions.createTask!,
                                    units: parseInt(e.target.value) || 0,
                                  },
                                })
                              }
                              placeholder="e.g., 5"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Units UOM *
                            </label>
                            <select
                              value={actions.createTask.unitsUomCode}
                              onChange={(e) =>
                                setActions({
                                  ...actions,
                                  createTask: {
                                    ...actions.createTask!,
                                    unitsUomCode: e.target.value as any,
                                  },
                                })
                              }
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                            >
                              <option value="MINUTES">Minutes</option>
                              <option value="HOURS">Hours</option>
                              <option value="DAYS">Days</option>
                              <option value="WEEKS">Weeks</option>
                              <option value="MONTHS">Months</option>
                              <option value="YEARS">Years</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Calculation Field *
                          </label>
                          <input
                            type="text"
                            value={actions.createTask.calculationField}
                            onChange={(e) =>
                              setActions({
                                ...actions,
                                createTask: {
                                  ...actions.createTask!,
                                  calculationField: e.target.value,
                                },
                              })
                            }
                            placeholder="e.g., REQUEST_DUE_DATE"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Owner Department Code (Optional)
                          </label>
                          <input
                            type="text"
                            value={actions.createTask.ownerDepartmentCode || ''}
                            onChange={(e) =>
                              setActions({
                                ...actions,
                                createTask: {
                                  ...actions.createTask!,
                                  ownerDepartmentCode: e.target.value || undefined,
                                },
                              })
                            }
                            placeholder="e.g., UMTATIBC"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Owner User ID (Optional)
                          </label>
                          <input
                            type="text"
                            value={actions.createTask.ownerUserId || ''}
                            onChange={(e) =>
                              setActions({
                                ...actions,
                                createTask: {
                                  ...actions.createTask!,
                                  ownerUserId: e.target.value || undefined,
                                },
                              })
                            }
                            placeholder="e.g., USER123"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Description (Optional)
                          </label>
                          <textarea
                            value={actions.createTask.description || ''}
                            onChange={(e) =>
                              setActions({
                                ...actions,
                                createTask: {
                                  ...actions.createTask!,
                                  description: e.target.value || undefined,
                                },
                              })
                            }
                            placeholder="Task description"
                            rows={2}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Create Appeal Tasks */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={!!actions.createAppealTasks && actions.createAppealTasks.length > 0}
                        onChange={(e) => {
                          if (!e.target.checked) {
                            const { createAppealTasks: _createAppealTasks, ...rest } = actions
                            setActions(rest)
                          } else {
                            setActions({
                              ...actions,
                              createAppealTasks: [{
                                typeCode: '',
                                priorityCode: '',
                                reasonCode: '',
                                units: 0,
                                unitsUomCode: 'DAYS' as const,
                                calculationField: 'REQUEST_DUE_DATE',
                              }],
                            })
                          }
                        }}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label className="text-sm font-medium text-gray-700">
                        Create Appeal Task
                      </label>
                    </div>
                    {actions.createAppealTasks && actions.createAppealTasks.length > 0 && (
                      <div className="ml-6 space-y-3">
                        {actions.createAppealTasks.map((task, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-md border border-gray-200">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Type Code *
                                </label>
                                <input
                                  type="text"
                                  value={task.typeCode}
                                  onChange={(e) => {
                                    const updated = [...actions.createAppealTasks!]
                                    updated[index] = { ...updated[index], typeCode: e.target.value }
                                    setActions({ ...actions, createAppealTasks: updated })
                                  }}
                                  placeholder="e.g., TYPE1"
                                  className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Priority Code *
                                </label>
                                <input
                                  type="text"
                                  value={task.priorityCode}
                                  onChange={(e) => {
                                    const updated = [...actions.createAppealTasks!]
                                    updated[index] = { ...updated[index], priorityCode: e.target.value }
                                    setActions({ ...actions, createAppealTasks: updated })
                                  }}
                                  placeholder="e.g., PRIORITY1"
                                  className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Reason Code *
                                </label>
                                <input
                                  type="text"
                                  value={task.reasonCode}
                                  onChange={(e) => {
                                    const updated = [...actions.createAppealTasks!]
                                    updated[index] = { ...updated[index], reasonCode: e.target.value }
                                    setActions({ ...actions, createAppealTasks: updated })
                                  }}
                                  placeholder="e.g., REASON1"
                                  className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Units *
                                </label>
                                <input
                                  type="number"
                                  value={task.units}
                                  onChange={(e) => {
                                    const updated = [...actions.createAppealTasks!]
                                    updated[index] = { ...updated[index], units: parseInt(e.target.value, 10) || 0 }
                                    setActions({ ...actions, createAppealTasks: updated })
                                  }}
                                  placeholder="e.g., 1"
                                  className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Units UOM Code *
                                </label>
                                <select
                                  value={task.unitsUomCode}
                                  onChange={(e) => {
                                    const updated = [...actions.createAppealTasks!]
                                    updated[index] = { ...updated[index], unitsUomCode: e.target.value as any }
                                    setActions({ ...actions, createAppealTasks: updated })
                                  }}
                                  className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md"
                                >
                                  <option value="MINUTES">Minutes</option>
                                  <option value="HOURS">Hours</option>
                                  <option value="DAYS">Days</option>
                                  <option value="WEEKS">Weeks</option>
                                  <option value="MONTHS">Months</option>
                                  <option value="YEARS">Years</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Calculation Field *
                                </label>
                                <input
                                  type="text"
                                  value={task.calculationField}
                                  onChange={(e) => {
                                    const updated = [...actions.createAppealTasks!]
                                    updated[index] = { ...updated[index], calculationField: e.target.value }
                                    setActions({ ...actions, createAppealTasks: updated })
                                  }}
                                  placeholder="e.g., REQUEST_DUE_DATE"
                                  className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Owner Department Code (Optional)
                                </label>
                                <input
                                  type="text"
                                  value={task.ownerDepartmentCode || ''}
                                  onChange={(e) => {
                                    const updated = [...actions.createAppealTasks!]
                                    updated[index] = { ...updated[index], ownerDepartmentCode: e.target.value || undefined }
                                    setActions({ ...actions, createAppealTasks: updated })
                                  }}
                                  placeholder="e.g., DEPT1"
                                  className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Owner User ID (Optional)
                                </label>
                                <input
                                  type="text"
                                  value={task.ownerUserId || ''}
                                  onChange={(e) => {
                                    const updated = [...actions.createAppealTasks!]
                                    updated[index] = { ...updated[index], ownerUserId: e.target.value || undefined }
                                    setActions({ ...actions, createAppealTasks: updated })
                                  }}
                                  placeholder="e.g., USER1"
                                  className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md"
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Description (Optional)
                                </label>
                                <input
                                  type="text"
                                  value={task.description || ''}
                                  onChange={(e) => {
                                    const updated = [...actions.createAppealTasks!]
                                    updated[index] = { ...updated[index], description: e.target.value || undefined }
                                    setActions({ ...actions, createAppealTasks: updated })
                                  }}
                                  placeholder="e.g., This is an example description"
                                  className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md"
                                />
                              </div>
                            </div>
                            {actions.createAppealTasks!.length > 1 && (
                              <button
                                onClick={() => {
                                  const updated = actions.createAppealTasks!.filter((_, i) => i !== index)
                                  if (updated.length === 0) {
                                    const { createAppealTasks: _createAppealTasks, ...rest } = actions
                                    setActions(rest)
                                  } else {
                                    setActions({ ...actions, createAppealTasks: updated })
                                  }
                                }}
                                className="mt-2 text-xs text-red-600 hover:text-red-800"
                              >
                                Remove Task
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            setActions({
                              ...actions,
                              createAppealTasks: [
                                ...(actions.createAppealTasks || []),
                                {
                                  typeCode: '',
                                  priorityCode: '',
                                  reasonCode: '',
                                  units: 0,
                                  unitsUomCode: 'DAYS' as const,
                                  calculationField: 'REQUEST_DUE_DATE',
                                },
                              ],
                            })
                          }}
                          className="text-xs text-primary hover:text-primary-hover"
                        >
                          + Add Another Appeal Task
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Transfer Ownership */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={!!actions.transferOwnership}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setActions({
                              ...actions,
                              transferOwnership: { transferTo: '' },
                            })
                          } else {
                            const { transferOwnership: _transferOwnership, ...rest } = actions
                            setActions(rest)
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <label className="text-sm font-medium text-gray-700">
                        Transfer Ownership
                      </label>
                    </div>
                    {actions.transferOwnership && (
                      <input
                        type="text"
                        value={actions.transferOwnership.transferTo}
                        onChange={(e) =>
                          setActions({
                            ...actions,
                            transferOwnership: { transferTo: e.target.value },
                          })
                        }
                        placeholder="Transfer to (e.g., Dept: BHIP)"
                        className="w-full ml-6 px-3 py-2 text-sm border border-gray-300 rounded-md"
                      />
                    )}
                  </div>

                  {/* Create CM Referral */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={!!actions.createCMReferral}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setActions({
                              ...actions,
                              createCMReferral: {
                                programCode: '',
                                sourceCode: '',
                                severityCode: '',
                                ownerDepartmentCode: '',
                              },
                            })
                          } else {
                            const { createCMReferral: _createCMReferral, ...rest } = actions
                            setActions(rest)
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <label className="text-sm font-medium text-gray-700">Create CM Referral</label>
                    </div>
                    {actions.createCMReferral && (
                      <div className="ml-6 grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Program Code *
                          </label>
                          <input
                            type="text"
                            value={actions.createCMReferral.programCode}
                            onChange={(e) =>
                              setActions({
                                ...actions,
                                createCMReferral: {
                                  ...actions.createCMReferral!,
                                  programCode: e.target.value,
                                },
                              })
                            }
                            placeholder="e.g., PROGRAM1"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Source Code *
                          </label>
                          <input
                            type="text"
                            value={actions.createCMReferral.sourceCode}
                            onChange={(e) =>
                              setActions({
                                ...actions,
                                createCMReferral: {
                                  ...actions.createCMReferral!,
                                  sourceCode: e.target.value,
                                },
                              })
                            }
                            placeholder="e.g., SOURCE1"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Severity Code *
                          </label>
                          <input
                            type="text"
                            value={actions.createCMReferral.severityCode}
                            onChange={(e) =>
                              setActions({
                                ...actions,
                                createCMReferral: {
                                  ...actions.createCMReferral!,
                                  severityCode: e.target.value,
                                },
                              })
                            }
                            placeholder="e.g., SEVERITY1"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Owner Department Code *
                          </label>
                          <input
                            type="text"
                            value={actions.createCMReferral.ownerDepartmentCode}
                            onChange={(e) =>
                              setActions({
                                ...actions,
                                createCMReferral: {
                                  ...actions.createCMReferral!,
                                  ownerDepartmentCode: e.target.value,
                                },
                              })
                            }
                            placeholder="e.g., DEPT3"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Create Program */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={!!actions.createProgram}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setActions({
                              ...actions,
                              createProgram: { programName: '' },
                            })
                          } else {
                            const { createProgram: _createProgram, ...rest } = actions
                            setActions(rest)
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <label className="text-sm font-medium text-gray-700">Create Program</label>
                    </div>
                    {actions.createProgram && (
                      <input
                        type="text"
                        value={actions.createProgram.programName}
                        onChange={(e) =>
                          setActions({
                            ...actions,
                            createProgram: { programName: e.target.value },
                          })
                        }
                        placeholder="Program name (e.g., Transition of Care)"
                        className="w-full ml-6 px-3 py-2 text-sm border border-gray-300 rounded-md"
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          )}
        </div>
        </div>
      )}

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
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

          {/* Hide values input for VALUED/NOT_VALUED operators */}
          {criteria.operator !== 'VALUED' && criteria.operator !== 'NOT_VALUED' && (
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
          )}
          {/* Show info message for VALUED/NOT_VALUED operators */}
          {(criteria.operator === 'VALUED' || criteria.operator === 'NOT_VALUED') && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Values
              </label>
              <div className="text-xs text-gray-500 italic px-2 py-1 bg-gray-50 rounded-md border border-gray-200">
                No values required for {criteria.operator.replace(/_/g, ' ')} operator
              </div>
            </div>
          )}

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
              FieldID
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
              operator={criteria.operator as StandardOperator}
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
                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-primary-light text-primary"
              >
                {value}
                <button
                  onClick={() => handleRemove(value)}
                  className="ml-1 text-primary hover:text-primary-hover"
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
