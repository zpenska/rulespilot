import { Node, Edge } from '@xyflow/react'
import { Rule, TriggerEvent, RequestTypeFilter } from '../types/rules'

interface RuleColor {
  node: string
  edge: string
  label: string
}

// Generate distinct colors for rule paths
function generateRuleColor(index: number): RuleColor {
  const colors = [
    { node: '#e3f2fd', edge: '#1976d2', label: '#0d47a1' }, // Blue
    { node: '#f3e5f5', edge: '#7b1fa2', label: '#4a148c' }, // Purple
    { node: '#e8f5e9', edge: '#388e3c', label: '#1b5e20' }, // Green
    { node: '#fff3e0', edge: '#f57c00', label: '#e65100' }, // Orange
    { node: '#fce4ec', edge: '#c2185b', label: '#880e4f' }, // Pink
    { node: '#e0f7fa', edge: '#0097a7', label: '#006064' }, // Cyan
    { node: '#f1f8e9', edge: '#689f38', label: '#33691e' }, // Light Green
    { node: '#fff8e1', edge: '#fbc02d', label: '#f57f17' }, // Yellow
    { node: '#fbe9e7', edge: '#d84315', label: '#bf360c' }, // Deep Orange
    { node: '#ede7f6', edge: '#5e35b1', label: '#311b92' }, // Deep Purple
  ]
  return colors[index % colors.length]
}

interface TriggerGroup {
  triggers: TriggerEvent[]
  requestTypeFilter: RequestTypeFilter
  rules: { rule: Rule; color: RuleColor }[]
}

/**
 * Merge multiple workflow rules into a unified flow structure
 */
export function mergeWorkflowRules(rules: Rule[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  // Filter to only workflow rules
  const workflowRules = rules.filter((r) => r.ruleType === 'workflow')

  if (workflowRules.length === 0) {
    return { nodes, edges }
  }

  // Group rules by trigger events and request type filter
  const groups = new Map<string, TriggerGroup>()

  workflowRules.forEach((rule, index) => {
    const triggers = rule.triggerEvents || []
    const requestTypeFilter = rule.requestTypeFilter || null
    const key = `${triggers.sort().join(',')}-${requestTypeFilter || 'any'}`

    if (!groups.has(key)) {
      groups.set(key, {
        triggers,
        requestTypeFilter,
        rules: [],
      })
    }

    groups.get(key)!.rules.push({
      rule,
      color: generateRuleColor(index),
    })
  })

  let yOffset = 0
  const VERTICAL_GROUP_SPACING = 400
  const HORIZONTAL_SPACING = 300
  const VERTICAL_RULE_SPACING = 150

  // Create flows for each group
  groups.forEach((group) => {
    let xOffset = 0
    let lastSharedNodeId: string | null = null

    // Create shared trigger node if triggers exist
    if (group.triggers.length > 0) {
      const triggerNodeId = `trigger-${group.triggers.join('-')}-${yOffset}`
      nodes.push({
        id: triggerNodeId,
        type: 'triggerEventNode',
        position: { x: xOffset, y: yOffset },
        data: {
          triggerEvents: group.triggers,
        },
      })
      lastSharedNodeId = triggerNodeId
      xOffset += HORIZONTAL_SPACING
    }

    // Create shared request type branch node if filter exists
    if (group.requestTypeFilter) {
      const branchNodeId = `branch-${group.requestTypeFilter}-${yOffset}`
      nodes.push({
        id: branchNodeId,
        type: 'requestTypeBranchNode',
        position: { x: xOffset, y: yOffset },
        data: {
          requestTypeFilter: group.requestTypeFilter,
        },
      })

      // Connect trigger to branch
      if (lastSharedNodeId) {
        edges.push({
          id: `e-${lastSharedNodeId}-${branchNodeId}`,
          source: lastSharedNodeId,
          target: branchNodeId,
          type: 'default',
        })
      }

      lastSharedNodeId = branchNodeId
      xOffset += HORIZONTAL_SPACING
    }

    // Create individual rule paths branching from shared entry point
    let ruleYOffset = yOffset - ((group.rules.length - 1) * VERTICAL_RULE_SPACING) / 2

    group.rules.forEach(({ rule, color }) => {
      const rulePrefix = `rule-${rule.id}`
      let ruleXOffset = xOffset

      // Gather all criteria
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

      // Create condition nodes for this rule
      allCriteria.forEach((item, index) => {
        const nodeId = `${rulePrefix}-condition-${index}`
        nodes.push({
          id: nodeId,
          type: 'conditionNode',
          position: { x: ruleXOffset, y: ruleYOffset },
          data: {
            type: item.type,
            criteria: item.criteria,
            index: item.index,
            ruleColor: color.node,
            ruleLabelColor: color.label,
          },
          style: {
            backgroundColor: color.node,
            borderColor: color.edge,
            borderWidth: 2,
          },
        })

        // Connect first condition to shared entry point
        if (index === 0 && lastSharedNodeId) {
          edges.push({
            id: `e-${lastSharedNodeId}-${nodeId}`,
            source: lastSharedNodeId,
            target: nodeId,
            type: 'default',
            style: { stroke: color.edge, strokeWidth: 2 },
            animated: true,
          })
        }

        // Add AND logic node between conditions
        if (index < allCriteria.length - 1) {
          const logicNodeId = `${rulePrefix}-logic-${index}`
          nodes.push({
            id: logicNodeId,
            type: 'logicNode',
            position: { x: ruleXOffset + 150, y: ruleYOffset },
            data: {
              logic: 'AND',
            },
            style: {
              backgroundColor: color.node,
              borderColor: color.edge,
            },
          })

          // Connect condition to logic
          edges.push({
            id: `e-${nodeId}-${logicNodeId}`,
            source: nodeId,
            target: logicNodeId,
            type: 'default',
            style: { stroke: color.edge, strokeWidth: 2 },
          })

          // Connect logic to next condition
          edges.push({
            id: `e-${logicNodeId}-${rulePrefix}-condition-${index + 1}`,
            source: logicNodeId,
            target: `${rulePrefix}-condition-${index + 1}`,
            type: 'default',
            style: { stroke: color.edge, strokeWidth: 2 },
          })
        }
      })

      ruleXOffset += HORIZONTAL_SPACING + 150

      // Add action nodes for this rule
      if (rule.actions) {
        const actionEntries = Object.entries(rule.actions).filter(
          ([_, value]) => value !== undefined
        )
        const lastConditionId =
          allCriteria.length > 0
            ? `${rulePrefix}-condition-${allCriteria.length - 1}`
            : null

        actionEntries.forEach(([actionType, actionData], index) => {
          const actionNodeId = `${rulePrefix}-action-${index}`
          nodes.push({
            id: actionNodeId,
            type: 'actionNode',
            position: { x: ruleXOffset, y: ruleYOffset },
            data: {
              actionType,
              actionData,
            },
            style: {
              backgroundColor: color.node,
              borderColor: color.edge,
              borderWidth: 2,
            },
          })

          // Connect first action to last condition
          if (index === 0 && lastConditionId) {
            edges.push({
              id: `e-${lastConditionId}-${actionNodeId}`,
              source: lastConditionId,
              target: actionNodeId,
              type: 'default',
              style: { stroke: color.edge, strokeWidth: 2 },
            })
          }

          // Connect actions sequentially
          if (index > 0) {
            edges.push({
              id: `e-${rulePrefix}-action-${index - 1}-${actionNodeId}`,
              source: `${rulePrefix}-action-${index - 1}`,
              target: actionNodeId,
              type: 'default',
              style: { stroke: color.edge, strokeWidth: 2 },
            })
          }

          ruleXOffset += HORIZONTAL_SPACING
        })
      }

      ruleYOffset += VERTICAL_RULE_SPACING
    })

    yOffset += VERTICAL_GROUP_SPACING
  })

  return { nodes, edges }
}

/**
 * Get a summary of rule groupings for display
 */
export function getRuleGroupSummary(rules: Rule[]): {
  totalRules: number
  triggerGroups: number
  requestTypeGroups: { inpatient: number; outpatient: number; any: number }
} {
  const workflowRules = rules.filter((r) => r.ruleType === 'workflow')
  const groups = new Map<string, number>()
  const requestTypeGroups = { inpatient: 0, outpatient: 0, any: 0 }

  workflowRules.forEach((rule) => {
    const triggers = rule.triggerEvents || []
    const requestTypeFilter = rule.requestTypeFilter || null
    const key = `${triggers.sort().join(',')}-${requestTypeFilter || 'any'}`

    groups.set(key, (groups.get(key) || 0) + 1)

    if (requestTypeFilter === 'INPATIENT') {
      requestTypeGroups.inpatient++
    } else if (requestTypeFilter === 'OUTPATIENT') {
      requestTypeGroups.outpatient++
    } else {
      requestTypeGroups.any++
    }
  })

  return {
    totalRules: workflowRules.length,
    triggerGroups: groups.size,
    requestTypeGroups,
  }
}
