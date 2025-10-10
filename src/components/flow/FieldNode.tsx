import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Database } from 'lucide-react'

export interface FieldNodeData {
  fieldName: string
  category?: string
  [key: string]: any
}

function FieldNode({ data }: NodeProps) {
  const { fieldName, category } = data as unknown as FieldNodeData

  const getCategoryColor = () => {
    switch (category) {
      case 'Enrollment':
        return 'bg-primary-light text-primary border-primary'
      case 'Member':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'Provider':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'Request':
        return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'Review Outcome':
        return 'bg-pink-50 text-pink-700 border-pink-200'
      case 'Service':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200'
      case 'Stage':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const formatFieldName = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ')
  }

  return (
    <div className={`rounded-lg shadow-sm border-2 p-3 min-w-[180px] ${getCategoryColor()}`}>
      <Handle type="target" position={Position.Left} className="!bg-gray-600 !w-3 !h-3" />

      <div className="flex items-start space-x-2">
        <Database className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="text-xs font-medium opacity-70 mb-1">{category || 'Field'}</div>
          <div className="text-sm font-semibold">{formatFieldName(fieldName)}</div>
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-gray-600 !w-3 !h-3" />
    </div>
  )
}

export default memo(FieldNode)
