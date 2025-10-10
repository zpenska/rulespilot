import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { LogicNodeData } from '../../utils/ruleFlowConverter'

function LogicNode({ data }: NodeProps) {
  const { logic } = data as unknown as LogicNodeData

  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="!bg-primary !w-3 !h-3" />

      <div className="bg-primary text-white rounded-full px-4 py-2 text-sm font-bold shadow-md">
        {logic}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-3 !h-3" />
    </div>
  )
}

export default memo(LogicNode)
