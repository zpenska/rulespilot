import { create } from 'zustand'
import type { Rule, RuleGroup } from '../types/rules'

interface RulesState {
  rules: Rule[]
  ruleGroups: RuleGroup[]
  selectedRuleId: string | null
  setRules: (rules: Rule[]) => void
  setRuleGroups: (groups: RuleGroup[]) => void
  addRule: (rule: Rule) => void
  updateRule: (id: string, updates: Partial<Rule>) => void
  deleteRule: (id: string) => void
  selectRule: (id: string | null) => void
  addRuleGroup: (group: RuleGroup) => void
  updateRuleGroup: (id: string, updates: Partial<RuleGroup>) => void
  deleteRuleGroup: (id: string) => void
}

export const useRulesStore = create<RulesState>((set) => ({
  rules: [],
  ruleGroups: [],
  selectedRuleId: null,

  setRules: (rules) => set({ rules }),

  setRuleGroups: (ruleGroups) => set({ ruleGroups }),

  addRule: (rule) =>
    set((state) => ({
      rules: [...state.rules, rule],
    })),

  updateRule: (id, updates) =>
    set((state) => ({
      rules: state.rules.map((rule) =>
        rule.id === id ? { ...rule, ...updates, updatedAt: new Date() } : rule
      ),
    })),

  deleteRule: (id) =>
    set((state) => ({
      rules: state.rules.filter((rule) => rule.id !== id),
      selectedRuleId: state.selectedRuleId === id ? null : state.selectedRuleId,
    })),

  selectRule: (id) =>
    set(() => ({
      selectedRuleId: id,
    })),

  addRuleGroup: (group) =>
    set((state) => ({
      ruleGroups: [...state.ruleGroups, group],
    })),

  updateRuleGroup: (id, updates) =>
    set((state) => ({
      ruleGroups: state.ruleGroups.map((group) =>
        group.id === id ? { ...group, ...updates } : group
      ),
    })),

  deleteRuleGroup: (id) =>
    set((state) => ({
      ruleGroups: state.ruleGroups.filter((group) => group.id !== id),
    })),
}))
