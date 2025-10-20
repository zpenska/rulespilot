import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { FileText } from 'lucide-react'

export interface RequestTypeFieldNodeData {
  values: string[]
  operator: string
  [key: string]: any
}

function RequestTypeFieldNode({ data }: NodeProps) {
  const { values, operator } = data as unknown as RequestTypeFieldNodeData

  const displayValues = values || []
  const isNegation = operator === 'NOT_IN'

  return (
    <div className="rounded-lg shadow-md border-2 border-teal-300 bg-teal-50 p-3 min-w-[180px]">
      <Handle type="target" position={Position.Left} className="!bg-teal-600 !w-3 !h-3" />

      <div className="flex items-start space-x-2">
        <FileText className="w-4 h-4 mt-0.5 flex-shrink-0 text-teal-700" />
        <div className="flex-1">
          <div className="text-xs font-medium text-teal-900 mb-1">Request Type</div>
          {displayValues.length === 0 ? (
            <div className="text-xs text-teal-700 bg-teal-100 px-2 py-1 rounded text-center">
              Any Type
            </div>
          ) : (
            <div className="space-y-1">
              {isNegation && (
                <div className="text-[10px] text-teal-600 font-medium mb-1">NOT:</div>
              )}
              {displayValues.map((value, idx) => (
                <div
                  key={idx}
                  className="text-xs px-2 py-1 rounded text-center font-medium bg-teal-100 text-teal-800"
                >
                  {value}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-teal-600 !w-3 !h-3" />
    </div>
  )
}

export default memo(RequestTypeFieldNode)
