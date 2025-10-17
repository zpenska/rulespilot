import { Node, Edge } from '@xyflow/react'
import { Rule, StandardFieldCriteria, CustomFieldCriteria, RuleActions, TATParameters } from '../types/rules'

export interface ConditionNodeData {
  type: 'standard' | 'custom'
  criteria: StandardFieldCriteria | CustomFieldCriteria
  index: number
  [key: string]: any
}

export interface LogicNodeData {
  logic: 'AND' | 'OR'
  [key: string]: any
}

export interface ActionNodeData {
  actionType: string
  actionData: any
  [key: string]: any
}

export interface TATCalculationNodeData extends TATParameters {
  [key: string]: any
}

/**
 * Convert a Rule to React Flow nodes and edges
 */
export function ruleToNodes(rule: Partial<Rule>): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  let xOffset = 0
  let yOffset = 0
  const VERTICAL_SPACING = 120
  const HORIZONTAL_SPACING = 300

  // For workflow rules, add trigger event and request type filter nodes
  let lastWorkflowNodeId: string | null = null

  if (rule.ruleType === 'workflow') {
    // Add trigger event node if triggers exist
    if (rule.triggerEvents && rule.triggerEvents.length > 0) {
      const triggerNodeId = 'trigger-events'
      nodes.push({
        id: triggerNodeId,
        type: 'triggerEventNode',
        position: { x: xOffset, y: yOffset },
        data: {
          triggerEvents: rule.triggerEvents,
        },
      })
      lastWorkflowNodeId = triggerNodeId
      xOffset += HORIZONTAL_SPACING
    }

    // Add request type filter node if filter exists
    if (rule.requestTypeFilter) {
      const branchNodeId = 'request-type-branch'
      nodes.push({
        id: branchNodeId,
        type: 'requestTypeBranchNode',
        position: { x: xOffset, y: yOffset },
        data: {
          requestTypeFilter: rule.requestTypeFilter,
        },
      })

      // Connect trigger to branch if trigger exists
      if (lastWorkflowNodeId) {
        edges.push({
          id: `e-${lastWorkflowNodeId}-${branchNodeId}`,
          source: lastWorkflowNodeId,
          target: branchNodeId,
          type: 'default',
        })
      }

      lastWorkflowNodeId = branchNodeId
      xOffset += HORIZONTAL_SPACING
    }
  }

  // Add criteria nodes (conditions)
  const allCriteria = [
    ...(rule.standardFieldCriteria || []).map((c, i) => ({
      type: 'standard' as const,
      criteria: c,
      index: i,
    })),
    ...(rule.customFieldCriteria || []).map((c, i) => ({
      type: 'custom' as const,
      criteria: c,
      index: i + (rule.standardFieldCriteria?.length || 0),
    })),
  ]

  // Create condition nodes
  allCriteria.forEach((item, index) => {
    const nodeId = `condition-${index}`
    nodes.push({
      id: nodeId,
      type: 'conditionNode',
      position: { x: xOffset, y: yOffset },
      data: {
        type: item.type,
        criteria: item.criteria,
        index: item.index,
      } as ConditionNodeData,
    })

    // Connect first condition to last workflow node (trigger/branch)
    if (index === 0 && lastWorkflowNodeId) {
      edges.push({
        id: `e-${lastWorkflowNodeId}-${nodeId}`,
        source: lastWorkflowNodeId,
        target: nodeId,
        type: 'default',
      })
    }

    // Add AND logic node between conditions (except after last one)
    if (index < allCriteria.length - 1) {
      yOffset += VERTICAL_SPACING
      const logicNodeId = `logic-${index}`
      nodes.push({
        id: logicNodeId,
        type: 'logicNode',
        position: { x: xOffset, y: yOffset },
        data: {
          logic: 'AND',
        } as LogicNodeData,
      })

      // Add edges
      edges.push({
        id: `e-${nodeId}-${logicNodeId}`,
        source: nodeId,
        target: logicNodeId,
        type: 'default',
      })

      yOffset += VERTICAL_SPACING

      // Connect logic node to next condition
      if (index + 1 < allCriteria.length) {
        edges.push({
          id: `e-${logicNodeId}-condition-${index + 1}`,
          source: logicNodeId,
          target: `condition-${index + 1}`,
          type: 'default',
        })
      }
    }
  })

  // Add action nodes or TAT calculation node based on rule type
  const lastConditionId = allCriteria.length > 0 ? `condition-${allCriteria.length - 1}` : null

  if (rule.ruleType === 'tat' && rule.tatParameters) {
    // Add TAT calculation node
    yOffset += VERTICAL_SPACING
    const tatNodeId = 'tat-calculation'

    nodes.push({
      id: tatNodeId,
      type: 'tatCalculationNode',
      position: { x: HORIZONTAL_SPACING, y: yOffset },
      data: rule.tatParameters as TATCalculationNodeData,
    })

    // Connect last condition to TAT node
    if (lastConditionId) {
      edges.push({
        id: `e-${lastConditionId}-${tatNodeId}`,
        source: lastConditionId,
        target: tatNodeId,
        type: 'default',
      })
    }
  } else if (rule.actions) {
    // Add action nodes for workflow rules
    let actionIndex = 0

    yOffset += VERTICAL_SPACING

    const actionEntries = Object.entries(rule.actions).filter(
      ([_, value]) => value !== undefined
    )

    actionEntries.forEach(([actionType, actionData], index) => {
      const nodeId = `action-${actionIndex++}`
      nodes.push({
        id: nodeId,
        type: 'actionNode',
        position: { x: HORIZONTAL_SPACING, y: yOffset + index * VERTICAL_SPACING },
        data: {
          actionType,
          actionData,
        } as ActionNodeData,
      })

      // Connect last condition to first action
      if (index === 0 && lastConditionId) {
        edges.push({
          id: `e-${lastConditionId}-${nodeId}`,
          source: lastConditionId,
          target: nodeId,
          type: 'default',
        })
      }

      // Connect actions sequentially
      if (index > 0) {
        edges.push({
          id: `e-action-${index - 1}-${nodeId}`,
          source: `action-${actionIndex - 2}`,
          target: nodeId,
          type: 'default',
        })
      }
    })
  }

  return { nodes, edges }
}

/**
 * Convert React Flow nodes back to Rule format
 * (This is a simplified version - full implementation would need more logic)
 */
export function nodesToRule(
  nodes: Node[],
  _edges: Edge[],
  existingRule: Partial<Rule>
): Partial<Rule> {
  const conditionNodes = nodes.filter((n) => n.type === 'conditionNode')
  const actionNodes = nodes.filter((n) => n.type === 'actionNode')
  const tatCalculationNodes = nodes.filter((n) => n.type === 'tatCalculationNode')

  const standardFieldCriteria: StandardFieldCriteria[] = []
  const customFieldCriteria: CustomFieldCriteria[] = []

  // Extract criteria from condition nodes
  conditionNodes.forEach((node) => {
    const data = node.data as unknown as ConditionNodeData
    if (data.type === 'standard') {
      standardFieldCriteria.push(data.criteria as StandardFieldCriteria)
    } else if (data.type === 'custom') {
      customFieldCriteria.push(data.criteria as CustomFieldCriteria)
    }
  })

  // Check if this is a TAT rule or workflow rule
  if (tatCalculationNodes.length > 0) {
    // TAT rule - extract TAT parameters
    const tatNode = tatCalculationNodes[0]
    const tatParameters = tatNode.data as unknown as TATCalculationNodeData

    return {
      ...existingRule,
      standardFieldCriteria,
      customFieldCriteria,
      tatParameters: {
        sourceDateTimeField: tatParameters.sourceDateTimeField,
        units: tatParameters.units,
        unitsOfMeasure: tatParameters.unitsOfMeasure,
        dueTime: tatParameters.dueTime,
        holidayDates: tatParameters.holidayDates,
        holidayCategory: tatParameters.holidayCategory,
        holidayOffset: tatParameters.holidayOffset,
        clinicalsRequestedResponseThresholdHours: tatParameters.clinicalsRequestedResponseThresholdHours,
        dateOperator: tatParameters.dateOperator,
        autoExtend: tatParameters.autoExtend,
        extendStatusReason: tatParameters.extendStatusReason,
      },
      actions: undefined, // TAT rules don't have actions
    }
  } else {
    // Workflow rule - extract actions from action nodes
    const actions: Partial<RuleActions> = {}
    actionNodes.forEach((node) => {
      const data = node.data as unknown as ActionNodeData
      if (data.actionType && data.actionData) {
        ;(actions as any)[data.actionType] = data.actionData
      }
    })

    return {
      ...existingRule,
      standardFieldCriteria,
      customFieldCriteria,
      actions: Object.keys(actions).length > 0 ? (actions as RuleActions) : undefined,
      tatParameters: undefined, // Workflow rules don't have TAT parameters
    }
  }
}
