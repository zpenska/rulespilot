import { Node, Edge } from '@xyflow/react'
import { Rule, TriggerEvent, RequestTypeFilter, StandardFieldCriteria, CustomFieldCriteria } from '../types/rules'

interface RuleColor {
  node: string
  edge: string
  label: string
}

/**
 * Generate a unique signature for a condition to detect duplicates
 */
function getConditionSignature(
  type: 'standard' | 'custom',
  criteria: StandardFieldCriteria | CustomFieldCriteria
): string {
  if (type === 'standard') {
    const std = criteria as StandardFieldCriteria
    return `std:${std.field}:${std.operator}:${JSON.stringify(std.values.sort())}`
  } else {
    const cust = criteria as CustomFieldCriteria
    return `cust:${cust.association}:${cust.templateId}:${cust.operator}:${JSON.stringify(cust.values.sort())}`
  }
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
    const key = triggers.sort().join(',') || 'no-trigger'

    if (!groups.has(key)) {
      groups.set(key, {
        triggers,
        rules: [],
      })
    }

    groups.get(key)!.rules.push({
      rule,
      color: generateRuleColor(index),
    })
  })

  let yOffset = 0
  const VERTICAL_GROUP_SPACING = 3000
  const HORIZONTAL_SPACING = 450
  const VERTICAL_RULE_SPACING = 250

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

    // Group rules by request type filter within this trigger group
    const requestTypeGroups = new Map<string, { rule: Rule; color: RuleColor }[]>()
    group.rules.forEach((ruleData) => {
      const filterKey = ruleData.rule.requestTypeFilter || 'none'
      if (!requestTypeGroups.has(filterKey)) {
        requestTypeGroups.set(filterKey, [])
      }
      requestTypeGroups.get(filterKey)!.push(ruleData)
    })

    // Process each request type group separately
    let requestTypeYOffset = yOffset - ((requestTypeGroups.size - 1) * VERTICAL_RULE_SPACING * 3) / 2

    requestTypeGroups.forEach((rulesWithFilter, filterKey) => {
      let requestTypeXOffset = xOffset
      let branchNodeId: string | null = null

      // Create request type branch node if it's not 'none'
      if (filterKey !== 'none') {
        branchNodeId = `branch-${filterKey}-${yOffset}-${requestTypeYOffset}`
        nodes.push({
          id: branchNodeId,
          type: 'requestTypeBranchNode',
          position: { x: requestTypeXOffset, y: requestTypeYOffset },
          data: {
            requestTypeFilter: filterKey as RequestTypeFilter,
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

        requestTypeXOffset += HORIZONTAL_SPACING
      }

      // Group rules by their first condition within this request type
      const firstConditionGroups = new Map<string, { rule: Rule; color: RuleColor }[]>()

      rulesWithFilter.forEach((ruleData) => {
        const { rule } = ruleData
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

        if (allCriteria.length > 0) {
          const firstCondition = allCriteria[0]
          const signature = getConditionSignature(firstCondition.type, firstCondition.criteria)
          if (!firstConditionGroups.has(signature)) {
            firstConditionGroups.set(signature, [])
          }
          firstConditionGroups.get(signature)!.push(ruleData)
        } else {
          // Rules with no conditions - treat as separate group
          firstConditionGroups.set(`no-condition-${rule.id}`, [ruleData])
        }
      })

      // Create individual rule paths for this request type, consolidating shared first conditions
      let conditionGroupYOffset = requestTypeYOffset - ((firstConditionGroups.size - 1) * VERTICAL_RULE_SPACING) / 2

      firstConditionGroups.forEach((rulesWithSameFirstCondition, signature) => {
      const firstRule = rulesWithSameFirstCondition[0].rule
      const firstCriteria = [
        ...(firstRule.standardFieldCriteria || []).map((c, i) => ({
          type: 'standard' as const,
          criteria: c,
          index: i,
        })),
        ...(firstRule.customFieldCriteria || []).map((c, i) => ({
          type: 'custom' as const,
          criteria: c,
          index: i + (firstRule.standardFieldCriteria?.length || 0),
        })),
      ]

      let sharedFirstConditionId: string | null = null

        // Create shared first condition node if rules have conditions
        if (firstCriteria.length > 0) {
          const firstCondition = firstCriteria[0]
          sharedFirstConditionId = `shared-condition-${signature}-${filterKey}`

          // Use neutral styling for shared nodes
          nodes.push({
            id: sharedFirstConditionId,
            type: 'conditionNode',
            position: { x: requestTypeXOffset, y: conditionGroupYOffset },
            data: {
              type: firstCondition.type,
              criteria: firstCondition.criteria,
              index: firstCondition.index,
            },
            style: {
              backgroundColor: '#f0f0f5',
              borderColor: '#9ca3af',
              borderWidth: 3,
            },
          })

          // Connect shared first condition to branch node or trigger
          const sourceNodeId = branchNodeId || lastSharedNodeId
          if (sourceNodeId) {
            edges.push({
              id: `e-${sourceNodeId}-${sharedFirstConditionId}`,
              source: sourceNodeId,
              target: sharedFirstConditionId,
              type: 'default',
              style: { stroke: '#6b7280', strokeWidth: 2 },
            })
          }
        }

        // Now create each rule's remaining path
        let ruleYOffset = conditionGroupYOffset - ((rulesWithSameFirstCondition.length - 1) * VERTICAL_RULE_SPACING) / 2

        rulesWithSameFirstCondition.forEach(({ rule, color }) => {
          const rulePrefix = `rule-${rule.id}`
          let ruleXOffset = requestTypeXOffset + HORIZONTAL_SPACING

        // Gather all criteria for this rule
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

        let lastNodeId = sharedFirstConditionId

        // Create remaining condition nodes (skip first one as it's shared)
        allCriteria.slice(1).forEach((item, index) => {
          const actualIndex = index + 1
          const nodeId = `${rulePrefix}-condition-${actualIndex}`

          // Add AND logic node before this condition
          if (lastNodeId) {
            const logicNodeId = `${rulePrefix}-logic-${actualIndex - 1}`
            nodes.push({
              id: logicNodeId,
              type: 'logicNode',
              position: { x: ruleXOffset - 75, y: ruleYOffset },
              data: {
                logic: 'AND',
              },
              style: {
                backgroundColor: color.node,
                borderColor: color.edge,
              },
            })

            // Connect previous node to logic
            edges.push({
              id: `e-${lastNodeId}-${logicNodeId}`,
              source: lastNodeId,
              target: logicNodeId,
              type: 'default',
              style: { stroke: color.edge, strokeWidth: 2 },
            })

            // Connect logic to this condition
            edges.push({
              id: `e-${logicNodeId}-${nodeId}`,
              source: logicNodeId,
              target: nodeId,
              type: 'default',
              style: { stroke: color.edge, strokeWidth: 2 },
            })
          }

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

          lastNodeId = nodeId
          ruleXOffset += HORIZONTAL_SPACING + 150
        })

        // Add action nodes for this rule
        if (rule.actions) {
          const actionEntries = Object.entries(rule.actions).filter(
            ([_, value]) => value !== undefined
          )

          actionEntries.forEach(([actionType, actionData], index) => {
            const actionNodeId = `${rulePrefix}-action-${index}`

            // Add AND logic node before first action if we have conditions
            if (index === 0 && lastNodeId) {
              const logicNodeId = `${rulePrefix}-logic-to-actions`
              nodes.push({
                id: logicNodeId,
                type: 'logicNode',
                position: { x: ruleXOffset - 75, y: ruleYOffset },
                data: {
                  logic: 'AND',
                },
                style: {
                  backgroundColor: color.node,
                  borderColor: color.edge,
                },
              })

              edges.push({
                id: `e-${lastNodeId}-${logicNodeId}`,
                source: lastNodeId,
                target: logicNodeId,
                type: 'default',
                style: { stroke: color.edge, strokeWidth: 2 },
              })

              edges.push({
                id: `e-${logicNodeId}-${actionNodeId}`,
                source: logicNodeId,
                target: actionNodeId,
                type: 'default',
                style: { stroke: color.edge, strokeWidth: 2 },
              })

              lastNodeId = actionNodeId
            } else if (index > 0) {
              // Connect actions sequentially
              edges.push({
                id: `e-${rulePrefix}-action-${index - 1}-${actionNodeId}`,
                source: `${rulePrefix}-action-${index - 1}`,
                target: actionNodeId,
                type: 'default',
                style: { stroke: color.edge, strokeWidth: 2 },
              })
            }

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

            ruleXOffset += HORIZONTAL_SPACING
          })
        }

          ruleYOffset += VERTICAL_RULE_SPACING
        })

        conditionGroupYOffset += VERTICAL_RULE_SPACING
      })

      requestTypeYOffset += VERTICAL_RULE_SPACING * 3
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
