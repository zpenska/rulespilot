/**
 * Skills Rule Configuration
 *
 * Defines actions specific to Skills-based routing rules.
 * Skills rules assign skills and licenses to requests for proper routing.
 */

export const SKILLS_ACTIONS = [
  {
    type: 'assignSkill',
    label: 'Assign Skill',
    description: 'Assign a single skill to a request. If multiple rules match, the first skill wins.'
  },
  {
    type: 'assignLicense',
    label: 'Assign Licenses',
    description: 'Assign multiple licenses to a request. If multiple rules match, the first set of licenses wins.'
  }
] as const
