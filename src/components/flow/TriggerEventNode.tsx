import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Zap } from 'lucide-react'
import { TriggerEvent } from '../../types/rules'

export interface TriggerEventNodeData {
  triggerEvents: TriggerEvent[]
  [key: string]: unknown
}

const TRIGGER_LABELS: Record<TriggerEvent, string> = {
  CREATE_REQUEST: 'Create Request',
  EDIT_REQUEST: 'Edit Request',
  EXTEND_REQUEST: 'Extend Request',
  CREATE_SERVICE: 'Create Service',
  EDIT_SERVICE: 'Edit Service',
  EXTEND_SERVICE: 'Extend Service',
  SAVE_QUESTIONNAIRE: 'Save Questionnaire',
}

function TriggerEventNode({ data }: NodeProps) {
  const { triggerEvents = [] } = data as unknown as TriggerEventNodeData

  return (
    <div className="rounded-lg shadow-md border-2 border-purple-300 bg-purple-50 p-3 min-w-[180px]">
      <div className="flex items-start space-x-2">
        <Zap className="w-4 h-4 mt-0.5 flex-shrink-0 text-purple-700" />
        <div className="flex-1">
          <div className="text-xs font-medium text-purple-900 mb-1">Workflow Trigger</div>
          {triggerEvents.length === 0 ? (
            <div className="text-xs text-purple-600 italic">No triggers selected</div>
          ) : (
            <div className="space-y-0.5">
              {triggerEvents.map((event) => (
                <div
                  key={event}
                  className="text-xs text-purple-700 bg-purple-100 px-2 py-0.5 rounded"
                >
                  {TRIGGER_LABELS[event]}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-purple-600 !w-3 !h-3" />
    </div>
  )
}

export default memo(TriggerEventNode)
