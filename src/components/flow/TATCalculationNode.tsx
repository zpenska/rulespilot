import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Clock, Calendar, CalendarDays, CalendarClock } from 'lucide-react'
import { TATParameters } from '../../types/rules'

export interface TATCalculationNodeData extends TATParameters {
  [key: string]: any
}

function TATCalculationNode({ data }: NodeProps) {
  const tatData = data as unknown as TATCalculationNodeData

  const getIcon = () => {
    switch (tatData.unitsOfMeasure) {
      case 'HOURS':
        return Clock
      case 'CALENDAR_DAYS':
        return Calendar
      case 'BUSINESS_DAYS':
        return CalendarDays
      default:
        return CalendarClock
    }
  }

  const Icon = getIcon()

  const formatUnitsOfMeasure = (uom: string) => {
    switch (uom) {
      case 'HOURS':
        return 'Hours'
      case 'CALENDAR_DAYS':
        return 'Calendar Days'
      case 'BUSINESS_DAYS':
        return 'Business Days'
      default:
        return uom
    }
  }

  const formatSourceField = (field: string) => {
    return field.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className="rounded-lg shadow-md border-2 border-teal-400 bg-gradient-to-br from-teal-50 to-cyan-50 p-4 min-w-[280px]">
      <Handle type="target" position={Position.Left} className="!bg-teal-500 !w-3 !h-3" />

      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start space-x-2 border-b border-teal-200 pb-2">
          <Icon className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-xs font-medium text-teal-700 mb-0.5">TAT Calculation</div>
            <div className="text-sm font-bold text-teal-900">Due Date/Time</div>
          </div>
        </div>

        {/* Source Field */}
        <div className="bg-white/60 rounded px-2 py-1.5">
          <div className="text-xs text-gray-600 mb-0.5">Source Field</div>
          <div className="text-sm font-semibold text-gray-900">
            {formatSourceField(tatData.sourceDateTimeField)}
          </div>
        </div>

        {/* Duration */}
        <div className="bg-white/60 rounded px-2 py-1.5">
          <div className="text-xs text-gray-600 mb-0.5">Duration</div>
          <div className="text-sm font-semibold text-gray-900">
            {tatData.units} {formatUnitsOfMeasure(tatData.unitsOfMeasure)}
          </div>
        </div>

        {/* Due Time (if specified) */}
        {tatData.dueTime && (
          <div className="bg-white/60 rounded px-2 py-1.5">
            <div className="text-xs text-gray-600 mb-0.5">Due Time</div>
            <div className="text-sm font-semibold text-gray-900">{tatData.dueTime}</div>
          </div>
        )}

        {/* Holiday Configuration */}
        {(tatData.holidayDates && tatData.holidayDates.length > 0) || tatData.holidayOffset ? (
          <div className="bg-white/60 rounded px-2 py-1.5">
            <div className="text-xs text-gray-600 mb-0.5">Holiday Configuration</div>
            {tatData.holidayDates && tatData.holidayDates.length > 0 && (
              <div className="text-xs text-gray-700 mb-1">
                {tatData.holidayDates.length} holiday{tatData.holidayDates.length > 1 ? 's' : ''} defined
              </div>
            )}
            {tatData.holidayOffset && (
              <div className="text-xs text-gray-700">
                Offset: +{tatData.holidayOffset} day{tatData.holidayOffset > 1 ? 's' : ''}
              </div>
            )}
          </div>
        ) : null}

        {/* Clinicals Threshold */}
        {tatData.clinicalsRequestedResponseThresholdHours && (
          <div className="bg-white/60 rounded px-2 py-1.5">
            <div className="text-xs text-gray-600 mb-0.5">Clinicals Response Threshold</div>
            <div className="text-sm font-semibold text-gray-900">
              {tatData.clinicalsRequestedResponseThresholdHours} hours
            </div>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!bg-teal-500 !w-3 !h-3" />
    </div>
  )
}

export default memo(TATCalculationNode)
