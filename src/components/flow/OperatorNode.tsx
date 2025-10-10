import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Equal, X } from 'lucide-react'

export interface OperatorNodeData {
  operator: string
  [key: string]: any
}

function OperatorNode({ data }: NodeProps) {
  const { operator } = data as unknown as OperatorNodeData

  const getOperatorDisplay = () => {
    const operatorMap: Record<string, string> = {
      IN: 'IN',
      NOT_IN: 'NOT IN',
      EQUALS: '=',
      GREATER_THAN_OR_EQUAL_TO: '≥',
      GREATER_THAN: '>',
      LESS_THAN_OR_EQUAL_TO: '≤',
      LESS_THAN: '<',
      BETWEEN: 'BETWEEN',
    }
    return operatorMap[operator] || operator
  }

  const getOperatorIcon = () => {
    if (operator === 'NOT_IN' || operator.includes('NOT')) {
      return <X className="w-4 h-4" />
    }
    return <Equal className="w-4 h-4" />
  }

  return (
    <div className="bg-indigo-50 rounded-lg shadow-sm border-2 border-indigo-200 p-3 min-w-[120px]">
      <Handle type="target" position={Position.Left} className="!bg-indigo-600 !w-3 !h-3" />

      <div className="flex items-center justify-center space-x-2">
        <div className="text-indigo-600">{getOperatorIcon()}</div>
        <div className="text-sm font-bold text-indigo-700">{getOperatorDisplay()}</div>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-indigo-600 !w-3 !h-3" />
    </div>
  )
}

export default memo(OperatorNode)
