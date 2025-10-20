import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Server } from 'lucide-react'

export interface SourceSystemNodeData {
  values: string[]
  operator: string
  [key: string]: any
}

function SourceSystemNode({ data }: NodeProps) {
  const { values, operator } = data as unknown as SourceSystemNodeData

  const displayValues = values || []
  const isNegation = operator === 'NOT_IN'

  return (
    <div className="rounded-lg shadow-md border-2 border-purple-300 bg-purple-50 p-3 min-w-[180px]">
      <Handle type="target" position={Position.Left} className="!bg-purple-600 !w-3 !h-3" />

      <div className="flex items-start space-x-2">
        <Server className="w-4 h-4 mt-0.5 flex-shrink-0 text-purple-700" />
        <div className="flex-1">
          <div className="text-xs font-medium text-purple-900 mb-1">Source System</div>
          {displayValues.length === 0 ? (
            <div className="text-xs text-purple-700 bg-purple-100 px-2 py-1 rounded text-center">
              Any Source
            </div>
          ) : (
            <div className="space-y-1">
              {isNegation && (
                <div className="text-[10px] text-purple-600 font-medium mb-1">NOT:</div>
              )}
              {displayValues.map((value, idx) => (
                <div
                  key={idx}
                  className="text-xs px-2 py-1 rounded text-center font-medium bg-purple-100 text-purple-800"
                >
                  {value}
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

export default memo(SourceSystemNode)
