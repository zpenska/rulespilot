import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Zap, Building2, XCircle, Mail, CheckSquare, ArrowRightLeft, FolderPlus, LucideIcon } from 'lucide-react'

export interface ActionNodeData {
  actionType: string
  actionData?: Record<string, unknown>
  [key: string]: unknown
}

function ActionNode({ data }: NodeProps) {
  const { actionType, actionData } = data as unknown as ActionNodeData

  const getActionConfig = () => {
    const configs: Record<string, { label: string; color: string; icon: LucideIcon }> = {
      departmentRouting: {
        label: 'Department Routing',
        color: 'bg-orange-50 text-orange-700 border-orange-200',
        icon: Building2,
      },
      close: {
        label: 'Close/Discharge',
        color: 'bg-red-50 text-red-700 border-red-200',
        icon: XCircle,
      },
      generateLetters: {
        label: 'Generate Letters',
        color: 'bg-green-50 text-green-700 border-green-200',
        icon: Mail,
      },
      createTask: {
        label: 'Create Task',
        color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        icon: CheckSquare,
      },
      transferOwnership: {
        label: 'Transfer Ownership',
        color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        icon: ArrowRightLeft,
      },
      createProgram: {
        label: 'Create Program',
        color: 'bg-teal-50 text-teal-700 border-teal-200',
        icon: FolderPlus,
      },
    }

    return (
      configs[actionType] || {
        label: actionType,
        color: 'bg-gray-50 text-gray-700 border-gray-200',
        icon: Zap,
      }
    )
  }

  const config = getActionConfig()
  const Icon = config.icon
  const nodeColor = config.color

  const getActionDetails = (): string => {
    if (!actionData) return '(click to configure)'

    if (actionType === 'departmentRouting') {
      return (actionData.departmentCode as string) || '(click to set department)'
    }
    if (actionType === 'close') {
      return (actionData.dispositionCode as string) || '(click to set disposition)'
    }
    if (actionType === 'generateLetters') {
      if (Array.isArray(actionData)) {
        if (actionData.length === 0) return '(click to add letters)'
        return actionData.map((l) => l.letterName).join(', ')
      }
      return '(click to configure)'
    }
    if (actionType === 'createTask') {
      const taskType = (actionData.taskType as string) || ''
      const taskReason = (actionData.taskReason as string) || ''
      const days = actionData.daysUntilDue
      const owner = (actionData.taskOwner as string) || ''

      const parts: string[] = []
      if (taskType) parts.push(taskType)
      if (taskReason) parts.push(taskReason)
      if (days) parts.push(`${days} days`)
      if (owner) parts.push(owner)

      if (parts.length === 0) return '(click to configure)'
      return parts.slice(0, 2).join(' • ') + (parts.length > 2 ? '...' : '')
    }
    if (actionType === 'transferOwnership') {
      return (actionData.transferTo as string) || '(click to set transfer target)'
    }
    if (actionType === 'createProgram') {
      return (actionData.programName as string) || '(click to set program name)'
    }

    return '(click to configure)'
  }

  return (
    <div className={`rounded-lg shadow-sm border-2 p-3 min-w-[200px] ${nodeColor}`}>
      <Handle type="target" position={Position.Left} className="!bg-gray-600 !w-3 !h-3" />

      <div className="flex items-start space-x-2">
        <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="text-xs font-medium opacity-70 mb-1">Action</div>
          <div className="text-sm font-semibold mb-1">{config.label}</div>
          <div className="text-xs opacity-80">{getActionDetails()}</div>
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-gray-600 !w-3 !h-3" />
    </div>
  )
}

export default memo(ActionNode)
