import { Rule, StandardFieldCriteria, CustomFieldCriteria } from '../types/rules'

/**
 * Calculate the number of atoms (criteria fields) in a rule
 * Atoms = count of all criteria (standard + custom)
 */
export function calculateAtoms(
  rule: Partial<Rule> | { standardFieldCriteria?: StandardFieldCriteria[]; customFieldCriteria?: CustomFieldCriteria[] }
): number {
  const standardCount = rule.standardFieldCriteria?.length || 0
  const customCount = rule.customFieldCriteria?.length || 0
  return standardCount + customCount
}

/**
 * Get atoms count from a rule, calculating if not stored
 */
export function getAtoms(rule: Rule): number {
  return rule.atoms ?? calculateAtoms(rule)
}
