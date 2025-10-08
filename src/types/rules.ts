// Rule Builder Types
export type ConditionOperator = 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'greaterThanOrEqual' | 'lessThanOrEqual'

export type ActionType = 'setValue' | 'sendEmail' | 'webhook' | 'calculate' | 'aiProcess'

export interface Condition {
  id: string
  field: string
  operator: ConditionOperator
  value: string | number | boolean
}

export interface Action {
  id: string
  type: ActionType
  config: Record<string, any>
}

export interface Rule {
  id: string
  name: string
  description?: string
  conditions: Condition[]
  actions: Action[]
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

export interface RuleGroup {
  id: string
  name: string
  rules: Rule[]
  operator: 'AND' | 'OR'
}
