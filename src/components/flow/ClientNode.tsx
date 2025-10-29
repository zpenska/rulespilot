import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Building } from 'lucide-react'

export interface ClientNodeData {
  values: string[]
  operator: string
  [key: string]: unknown
}

function ClientNode({ data }: NodeProps) {
  const { values, operator } = data as unknown as ClientNodeData

  const displayValues = values || []
  const isNegation = operator === 'NOT_IN'

  return (
    <div className="rounded-lg shadow-md border-2 border-cyan-300 bg-cyan-50 p-3 min-w-[180px]">
      <Handle type="target" position={Position.Left} className="!bg-cyan-600 !w-3 !h-3" />

      <div className="flex items-start space-x-2">
        <Building className="w-4 h-4 mt-0.5 flex-shrink-0 text-cyan-700" />
        <div className="flex-1">
          <div className="text-xs font-medium text-cyan-900 mb-1">Client</div>
          {displayValues.length === 0 ? (
            <div className="text-xs text-cyan-700 bg-cyan-100 px-2 py-1 rounded text-center">
              Any Client
            </div>
          ) : (
            <div className="space-y-1">
              {isNegation && (
                <div className="text-[10px] text-cyan-600 font-medium mb-1">NOT:</div>
              )}
              {displayValues.map((value, idx) => (
                <div
                  key={idx}
                  className="text-xs px-2 py-1 rounded text-center font-medium bg-cyan-100 text-cyan-800"
                >
                  {value}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-cyan-600 !w-3 !h-3" />
    </div>
  )
}

export default memo(ClientNode)
