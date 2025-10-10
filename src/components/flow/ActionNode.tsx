import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Zap, Award, Building2, XCircle, Mail, Lightbulb } from 'lucide-react'

export interface ActionNodeData {
  actionType: string
  actionData?: any
  [key: string]: any
}

function ActionNode({ data }: NodeProps) {
  const { actionType, actionData } = data as unknown as ActionNodeData

  const getActionConfig = () => {
    const configs: Record<string, { label: string; color: string; icon: any }> = {
      assignSkill: {
        label: 'Assign Skill',
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: Award,
      },
      assignLicense: {
        label: 'Assign Licenses',
        color: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: Award,
      },
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
      hints: {
        label: 'Add Hints',
        color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        icon: Lightbulb,
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

  const getActionDetails = () => {
    if (!actionData) return '(click to configure)'

    if (actionType === 'assignSkill') {
      return actionData.skillCode || '(click to set skill)'
    }
    if (actionType === 'assignLicense') {
      if (actionData.licenseCodes && Array.isArray(actionData.licenseCodes)) {
        if (actionData.licenseCodes.length === 0) return '(click to add licenses)'
        if (actionData.licenseCodes.length === 1) return actionData.licenseCodes[0]
        return `${actionData.licenseCodes.length} licenses: ${actionData.licenseCodes.slice(0, 2).join(', ')}${actionData.licenseCodes.length > 2 ? '...' : ''}`
      }
      // Legacy support for single licenseCode
      return actionData.licenseCode || '(click to set licenses)'
    }
    if (actionType === 'departmentRouting') {
      return actionData.departmentCode || '(click to set department)'
    }
    if (actionType === 'close') {
      return actionData.dispositionCode || '(click to set disposition)'
    }
    if (actionType === 'generateLetters') {
      if (Array.isArray(actionData)) {
        if (actionData.length === 0) return '(click to add letters)'
        return actionData.map((l) => l.letterName).join(', ')
      }
      return '(click to configure)'
    }
    if (actionType === 'hints') {
      const msg = actionData.message || actionData.hint || ''
      if (!msg) return '(click to add message)'
      return msg.substring(0, 30) + (msg.length > 30 ? '...' : '')
    }

    return '(click to configure)'
  }

  return (
    <div className={`rounded-lg shadow-sm border-2 p-3 min-w-[200px] ${config.color}`}>
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
