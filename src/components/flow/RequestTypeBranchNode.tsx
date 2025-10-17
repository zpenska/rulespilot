import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { GitBranch } from 'lucide-react'
import { RequestTypeFilter } from '../../types/rules'

export interface RequestTypeBranchNodeData {
  requestTypeFilter: RequestTypeFilter
  [key: string]: any
}

function RequestTypeBranchNode({ data }: NodeProps) {
  const { requestTypeFilter } = data as unknown as RequestTypeBranchNodeData

  return (
    <div className="rounded-lg shadow-md border-2 border-amber-300 bg-amber-50 p-3 min-w-[150px]">
      <Handle type="target" position={Position.Left} className="!bg-amber-600 !w-3 !h-3" />

      <div className="flex items-start space-x-2">
        <GitBranch className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-700" />
        <div className="flex-1">
          <div className="text-xs font-medium text-amber-900 mb-1">Request Type</div>
          {!requestTypeFilter ? (
            <div className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded text-center">
              Any Request Type
            </div>
          ) : (
            <div className="space-y-1">
              <div
                className={`text-xs px-2 py-1 rounded text-center font-medium ${
                  requestTypeFilter === 'INPATIENT'
                    ? 'bg-blue-100 text-blue-800'
                    : requestTypeFilter === 'OUTPATIENT'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {requestTypeFilter === 'INPATIENT' && 'Inpatient'}
                {requestTypeFilter === 'OUTPATIENT' && 'Outpatient'}
              </div>
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="inpatient"
        style={{ top: '40%' }}
        className="!bg-blue-600 !w-3 !h-3"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="outpatient"
        style={{ top: '60%' }}
        className="!bg-green-600 !w-3 !h-3"
      />
    </div>
  )
}

export default memo(RequestTypeBranchNode)
