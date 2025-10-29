import { memo, useState, useEffect, useRef } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { ConditionNodeData } from '../../utils/ruleFlowConverter'
import { Filter, ChevronDown } from 'lucide-react'
import { FIELD_DEFINITIONS } from '../../config/fieldDefinitions'
import { getActiveDictionary } from '../../services/dictionaryService'
import { DictionaryItem } from '../../types/rules'

function ConditionNode({ data }: NodeProps) {
  const { criteria, type } = data as unknown as ConditionNodeData
  const [isEditingOperator, setIsEditingOperator] = useState(false)
  const [isEditingValues, setIsEditingValues] = useState(false)
  const [dictionaryOptions, setDictionaryOptions] = useState<DictionaryItem[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load dictionary options for the field
  useEffect(() => {
    const loadDictionary = async () => {
      if (type === 'standard' && criteria && 'field' in criteria) {
        const fieldName = criteria.field
        const fieldDef = FIELD_DEFINITIONS[fieldName as keyof typeof FIELD_DEFINITIONS]

        if (fieldDef?.dictionaryKey) {
          try {
            const items = await getActiveDictionary(fieldDef.dictionaryKey)
            setDictionaryOptions(items)
          } catch (error) {
            console.error('Error loading dictionary:', error)
          }
        } else {
          setDictionaryOptions([])
        }
      }
    }

    loadDictionary()
  }, [type, criteria])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        isEditingValues &&
        dictionaryOptions.length > 0
      ) {
        setIsEditingValues(false)
      }
    }

    if (isEditingValues && dictionaryOptions.length > 0) {
      // Use timeout to avoid immediate closure
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 0)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isEditingValues, dictionaryOptions])

  const getFieldLabel = () => {
    if (!criteria) return 'New Condition'
    if (type === 'standard' && 'field' in criteria) {
      return criteria.field || 'Select Field'
    } else if ('association' in criteria) {
      const assoc = criteria.association || 'MEMBER'
      const template = criteria.templateId || 'template'
      return `${assoc}.${template}`
    }
    return 'Select Field'
  }

  const getOperator = () => {
    if (!criteria || !criteria.operator) return 'IN'
    const op = criteria.operator

    // Format operator for display
    const operatorMap: Record<string, string> = {
      'IN': 'IN',
      'NOT_IN': 'NOT IN',
      'EQUALS': '=',
      'GREATER_THAN_OR_EQUAL_TO': '≥',
      'GREATER_THAN': '>',
      'LESS_THAN_OR_EQUAL_TO': '≤',
      'LESS_THAN': '<',
      'BETWEEN': 'BETWEEN'
    }

    return operatorMap[op] || op.replace(/_/g, ' ')
  }

  const getValues = () => {
    if (!criteria || !criteria.values) return '(empty)'
    const values = criteria.values
    if (values.length === 0) return '(empty)'
    if (values.length > 2) return `${values.slice(0, 2).join(', ')}... (+${values.length - 2})`
    return values.join(', ')
  }

  const operatorOptions = ['IN', 'NOT_IN', 'EQUALS', 'GREATER_THAN', 'GREATER_THAN_OR_EQUAL_TO', 'LESS_THAN', 'LESS_THAN_OR_EQUAL_TO', 'BETWEEN']

  return (
    <div className="bg-white rounded-lg shadow-sm border border-table-border p-3 min-w-[250px]">
      <Handle type="target" position={Position.Top} className="!bg-primary !w-3 !h-3" />

      <div className="flex items-start space-x-2">
        <Filter className="w-4 h-4 text-primary mt-0.5" />
        <div className="flex-1">
          <div className="text-xs font-medium text-gray-500 mb-1">
            {type === 'standard' ? 'Standard Field' : 'Custom Field'}
          </div>
          <div className="text-sm font-semibold text-gray-900 mb-1">{getFieldLabel()}</div>
          <div className="text-xs text-gray-600 flex items-center">
            {isEditingOperator ? (
              <select
                value={criteria?.operator || 'IN'}
                onChange={(e) => {
                  if (criteria) {
                    criteria.operator = e.target.value as any
                  }
                  setIsEditingOperator(false)
                }}
                onBlur={() => setIsEditingOperator(false)}
                autoFocus
                className="text-xs border border-primary rounded px-1 py-0.5 font-medium"
              >
                {operatorOptions.map((op) => (
                  <option key={op} value={op}>
                    {op.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            ) : (
              <span
                className="font-medium cursor-pointer hover:bg-gray-100 px-1 rounded"
                onClick={() => setIsEditingOperator(true)}
              >
                {getOperator()}
              </span>
            )}
            <span className="mx-1">:</span>
            <div className="relative flex-1" ref={dropdownRef}>
              {isEditingValues ? (
                dictionaryOptions.length > 0 ? (
                  <div
                    className="absolute z-50 mt-1 w-72 bg-white border border-primary rounded shadow-lg max-h-60 overflow-y-auto"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="sticky top-0 bg-gray-50 px-2 py-1 border-b border-gray-200 flex items-center justify-between">
                      <div className="text-xs font-medium text-gray-700">
                        Select values
                      </div>
                      <button
                        onClick={() => setIsEditingValues(false)}
                        className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                      >
                        Close
                      </button>
                    </div>
                    {dictionaryOptions.map((item) => (
                      <label
                        key={item.code}
                        className="flex items-start px-2 py-1.5 hover:bg-blue-50 cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={criteria?.values?.includes(item.code)}
                          onChange={(e) => {
                            if (criteria) {
                              if (e.target.checked) {
                                criteria.values = [...(criteria.values || []), item.code]
                              } else {
                                criteria.values = (criteria.values || []).filter((v) => v !== item.code)
                              }
                            }
                          }}
                          className="mt-0.5 mr-2"
                        />
                        <span className="flex-1">
                          <span className="font-medium">{item.code}</span>
                          {item.description && (
                            <span className="text-gray-600"> - {item.description}</span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={criteria?.values?.join(', ') || ''}
                    onChange={(e) => {
                      if (criteria) {
                        criteria.values = e.target.value.split(',').map((v) => v.trim())
                      }
                    }}
                    onBlur={() => setIsEditingValues(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setIsEditingValues(false)
                    }}
                    autoFocus
                    className="text-xs border border-primary rounded px-1 py-0.5 w-full"
                    placeholder="Enter values..."
                  />
                )
              ) : (
                <span
                  className="text-gray-700 cursor-pointer hover:bg-gray-100 px-1 rounded inline-flex items-center"
                  onClick={() => setIsEditingValues(true)}
                >
                  {getValues()}
                  {dictionaryOptions.length > 0 && (
                    <ChevronDown className="w-3 h-3 ml-1 text-gray-400" />
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-3 !h-3" />
    </div>
  )
}

export default memo(ConditionNode)
