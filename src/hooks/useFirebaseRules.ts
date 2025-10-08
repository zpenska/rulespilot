import { useEffect } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useRulesStore } from '../store/rulesStore'
import { rulesService, ruleGroupsService } from '../services/firebase/firestore'
import type { Rule, RuleGroup } from '../types/rules'

// Custom hook to sync Firestore with Zustand store
export const useFirebaseRules = () => {
  const { setRules, setRuleGroups } = useRulesStore()

  useEffect(() => {
    // Real-time listener for rules
    const rulesQuery = query(collection(db, 'rules'), orderBy('updatedAt', 'desc'))
    const unsubscribeRules = onSnapshot(rulesQuery, (snapshot) => {
      const rules: Rule[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        rules.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          conditions: data.conditions,
          actions: data.actions,
          enabled: data.enabled,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        })
      })
      setRules(rules)
    })

    // Real-time listener for rule groups
    const ruleGroupsQuery = query(collection(db, 'ruleGroups'))
    const unsubscribeRuleGroups = onSnapshot(ruleGroupsQuery, (snapshot) => {
      const groups: RuleGroup[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        groups.push({
          id: doc.id,
          name: data.name,
          rules: data.rules,
          operator: data.operator,
        })
      })
      setRuleGroups(groups)
    })

    // Cleanup listeners on unmount
    return () => {
      unsubscribeRules()
      unsubscribeRuleGroups()
    }
  }, [setRules, setRuleGroups])

  return {
    rulesService,
    ruleGroupsService,
  }
}
