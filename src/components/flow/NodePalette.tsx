import { DragEvent, useState, useMemo } from 'react'
import { ChevronDown, ChevronRight, Filter, GitBranch, Zap, Clock } from 'lucide-react'
import { FIELD_DEFINITIONS } from '../../config/fieldDefinitions'
import { useRulesStore } from '../../store/rulesStore'

interface NodePaletteProps {
  onDragStart: (event: DragEvent, nodeType: string, nodeData?: Record<string, unknown>) => void
}

// Define actions for workflow rules (constant, moved outside component)
const RULES_ACTIONS = [
  { type: 'departmentRouting', label: 'Department Routing' },
  { type: 'close', label: 'Close/Discharge' },
  { type: 'generateLetters', label: 'Generate Letters' },
  { type: 'hints', label: 'Add Hints' },
]

export default function NodePalette({ onDragStart }: NodePaletteProps) {
  const currentRuleType = useRulesStore((state) => state.currentRuleType)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    Conditions: true,
    Logic: false,
    Actions: false,
    TATCalculation: false,
  })

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  // Group fields by category for condition nodes
  const fieldsByCategory = Object.entries(FIELD_DEFINITIONS).reduce(
    (acc, [, def]) => {
      if (!acc[def.category]) acc[def.category] = []
      acc[def.category].push(def)
      return acc
    },
    {} as Record<string, typeof FIELD_DEFINITIONS[keyof typeof FIELD_DEFINITIONS][]>
  )

  const logicOperators = [
    { type: 'AND', label: 'AND' },
    { type: 'OR', label: 'OR' },
  ]

  // Get actions based on current rule type
  const actions = useMemo(() => {
    if (currentRuleType === 'workflow') {
      return RULES_ACTIONS
    }
    return [] // TAT and pullQueue don't have actions in the visual builder
  }, [currentRuleType])

  return (
    <div className="w-72 bg-white border-r border-table-border overflow-y-auto">
      <div className="p-4 border-b border-table-border">
        <h3 className="text-sm font-semibold text-gray-900">Node Palette</h3>
        <p className="text-xs text-gray-500 mt-1">Drag nodes onto canvas</p>
      </div>

      <div className="divide-y divide-gray-200">
        {/* CONDITIONS SECTION */}
        <div>
          <button
            onClick={() => toggleSection('Conditions')}
            className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-50 text-left"
          >
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">Conditions</span>
              <span className="text-xs text-gray-500">({Object.keys(FIELD_DEFINITIONS).length})</span>
            </div>
            {expandedSections['Conditions'] ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {expandedSections['Conditions'] && (
            <div className="pb-2">
              {Object.entries(fieldsByCategory).map(([category, fields]) => (
                <div key={category} className="mb-2">
                  <div className="px-4 py-1 bg-gray-50">
                    <span className="text-xs font-medium text-gray-600">{category}</span>
                  </div>
                  <div className="space-y-1 px-2 py-1">
                    {fields.map((field) => (
                      <div
                        key={field.name}
                        draggable
                        onDragStart={(e) =>
                          onDragStart(e, 'conditionNode', {
                            type: 'standard',
                            criteria: {
                              field: field.name,
                              operator: 'IN',
                              values: [],
                              dataType: field.dataType || 'STRING',
                            },
                          })
                        }
                        className="px-2 py-1.5 text-xs rounded hover:bg-blue-50 cursor-move border border-transparent hover:border-blue-200 transition-colors"
                      >
                        {field.name.replace(/_/g, ' ')}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LOGIC SECTION */}
        <div>
          <button
            onClick={() => toggleSection('Logic')}
            className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-50 text-left"
          >
            <div className="flex items-center space-x-2">
              <GitBranch className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">Logic</span>
              <span className="text-xs text-gray-500">({logicOperators.length})</span>
            </div>
            {expandedSections['Logic'] ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {expandedSections['Logic'] && (
            <div className="px-2 py-2 space-y-1">
              {logicOperators.map((op) => (
                <div
                  key={op.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, 'logicNode', { logic: op.type })}
                  className="px-2 py-1.5 text-xs rounded hover:bg-primary-light cursor-move border border-transparent hover:border-primary transition-colors font-semibold text-primary"
                >
                  {op.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ACTIONS OR TAT CALCULATION SECTION */}
        {currentRuleType === 'tat' ? (
          /* TAT CALCULATION SECTION */
          <div>
            <button
              onClick={() => toggleSection('TATCalculation')}
              className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-50 text-left"
            >
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">TAT Calculation</span>
                <span className="text-xs text-gray-500">(1)</span>
              </div>
              {expandedSections['TATCalculation'] ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {expandedSections['TATCalculation'] && (
              <div className="px-2 py-2 space-y-1">
                <div
                  draggable
                  onDragStart={(e) =>
                    onDragStart(e, 'tatCalculationNode', {
                      sourceDateTimeField: 'NOTIFICATION_DATE_TIME',
                      units: 72,
                      unitsOfMeasure: 'HOURS',
                      dueTime: null,
                      holidayDates: [],
                      holidayOffset: null,
                      clinicalsRequestedResponseThresholdHours: null,
                    })
                  }
                  className="px-2 py-1.5 text-xs rounded hover:bg-teal-50 cursor-move border border-transparent hover:border-teal-200 transition-colors"
                >
                  Due Date/Time Calculation
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ACTIONS SECTION */
          <div>
            <button
              onClick={() => toggleSection('Actions')}
              className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-50 text-left"
            >
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Actions</span>
                <span className="text-xs text-gray-500">({actions.length})</span>
              </div>
              {expandedSections['Actions'] ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {expandedSections['Actions'] && (
              <div className="px-2 py-2 space-y-1">
                {actions.map((action) => (
                  <div
                    key={action.type}
                    draggable
                    onDragStart={(e) => onDragStart(e, 'actionNode', { actionType: action.type })}
                    className="px-2 py-1.5 text-xs rounded hover:bg-green-50 cursor-move border border-transparent hover:border-green-200 transition-colors"
                  >
                    {action.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
