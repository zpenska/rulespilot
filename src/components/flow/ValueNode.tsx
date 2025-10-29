import { memo, useState } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Hash, Calendar, Type } from 'lucide-react'

export interface ValueNodeData {
  values: string[]
  dataType?: 'STRING' | 'INTEGER' | 'DATE'
  [key: string]: unknown
}

function ValueNode({ data }: NodeProps) {
  const { values = [], dataType = 'STRING' } = data as unknown as ValueNodeData
  const [isEditing, setIsEditing] = useState(false)

  const getIcon = () => {
    switch (dataType) {
      case 'INTEGER':
        return <Hash className="w-4 h-4" />
      case 'DATE':
        return <Calendar className="w-4 h-4" />
      default:
        return <Type className="w-4 h-4" />
    }
  }

  const getValueDisplay = () => {
    if (values.length === 0) return '(click to add values)'
    if (values.length === 1) return values[0]
    if (values.length === 2) return values.join(', ')
    return `${values.slice(0, 2).join(', ')}... (+${values.length - 2})`
  }

  return (
    <div className="bg-slate-50 rounded-lg shadow-sm border-2 border-slate-200 p-3 min-w-[160px]">
      <Handle type="target" position={Position.Left} className="!bg-slate-600 !w-3 !h-3" />

      <div className="flex items-start space-x-2">
        <div className="text-slate-600 mt-0.5">{getIcon()}</div>
        <div className="flex-1">
          <div className="text-xs font-medium text-slate-500 mb-1">Values</div>
          <div className="text-sm text-slate-700">
            {isEditing ? (
              <input
                type="text"
                placeholder="Enter value..."
                className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
                onBlur={() => setIsEditing(false)}
                autoFocus
              />
            ) : (
              <div
                onClick={() => setIsEditing(true)}
                className="cursor-pointer hover:bg-slate-100 px-1 py-0.5 rounded text-xs"
              >
                {getValueDisplay()}
              </div>
            )}
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-slate-600 !w-3 !h-3" />
    </div>
  )
}

export default memo(ValueNode)
