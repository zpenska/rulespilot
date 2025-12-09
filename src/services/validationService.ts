import {
  StandardFieldCriteria,
  CustomFieldCriteria,
  ValidationError,
  Rule,
  StandardOperator,
  RuleActions,
} from '../types/rules'
import { FIELD_DEFINITIONS } from '../config/fieldDefinitions'

/**
 * Validation Service
 * Validates rules according to business requirements
 */

/**
 * Validate a standard field criteria
 */
export const validateStandardCriteria = (
  criteria: StandardFieldCriteria,
  isTATRule: boolean = false
): ValidationError[] => {
  const errors: ValidationError[] = []
  const fieldDef = FIELD_DEFINITIONS[criteria.field]

  if (!fieldDef) {
    errors.push({
      field: criteria.field,
      message: 'Invalid field name',
    })
    return errors
  }

  // For TAT rules, operator is implicitly "IN" and not stored in the criteria
  // Skip operator validation for TAT rules
  if (!isTATRule) {
    // Validate operator is allowed for this field
    if (!fieldDef.allowedOperators.includes(criteria.operator)) {
      errors.push({
        field: criteria.field,
        message: `Operator ${criteria.operator} is not allowed for ${criteria.field}`,
      })
    }
  }

  // For TAT rules, assume "IN" operator for validation
  const operatorForValidation = isTATRule ? 'IN' : criteria.operator

  // Validate value count based on operator
  const valueCountError = validateValueCount(operatorForValidation, criteria.values)
  if (valueCountError) {
    errors.push({
      field: criteria.field,
      message: valueCountError,
    })
  }

  // Validate data type
  const dataTypeErrors = validateDataType(
    fieldDef.dataType,
    criteria.values,
    operatorForValidation
  )
  errors.push(...dataTypeErrors.map((msg) => ({ field: criteria.field, message: msg })))

  // Validate provider role for provider fields
  if (fieldDef.requiresProviderRole && !criteria.providerRole) {
    errors.push({
      field: criteria.field,
      message: 'Provider role is required for provider fields',
    })
  }

  // Validate alternate ID type
  if (fieldDef.requiresAlternateIdType && !criteria.alternateIdType) {
    errors.push({
      field: criteria.field,
      message: 'Alternate ID type is required for PROVIDER_ALTERNATE_ID',
    })
  }

  return errors
}

/**
 * Validate custom field criteria
 */
export const validateCustomCriteria = (
  criteria: CustomFieldCriteria,
  isTATRule: boolean = false
): ValidationError[] => {
  const errors: ValidationError[] = []

  // For TAT rules, operator is implicitly "IN" and not stored in the criteria
  // Skip operator validation for TAT rules
  if (!isTATRule) {
    // Custom fields only support IN and NOT_IN
    if (criteria.operator !== 'IN' && criteria.operator !== 'NOT_IN') {
      errors.push({
        field: criteria.templateId,
        message: 'Custom fields only support IN and NOT_IN operators',
      })
    }
  }

  // Must have at least one value
  if (!criteria.values || criteria.values.length === 0) {
    errors.push({
      field: criteria.templateId,
      message: 'At least one value is required',
    })
  }

  // Association must be valid
  if (!['MEMBER', 'ENROLLMENT', 'REQUEST', 'SERVICE'].includes(criteria.association)) {
    errors.push({
      field: criteria.templateId,
      message: 'Association must be MEMBER, ENROLLMENT, REQUEST, or SERVICE',
    })
  }

  return errors
}

/**
 * Validate value count based on operator
 */
const validateValueCount = (
  operator: StandardOperator,
  values: string[]
): string | null => {
  // VALUED and NOT_VALUED operators don't require values
  if (operator === 'VALUED' || operator === 'NOT_VALUED') {
    if (values && values.length > 0) {
      return `Operator ${operator} should not have any values`
    }
    return null
  }

  if (!values || values.length === 0) {
    return 'At least one value is required'
  }

  switch (operator) {
    case 'EQUALS':
    case 'GREATER_THAN':
    case 'GREATER_THAN_OR_EQUAL_TO':
    case 'LESS_THAN':
    case 'LESS_THAN_OR_EQUAL_TO':
      if (values.length !== 1) {
        return `Operator ${operator} requires exactly 1 value`
      }
      break

    case 'EQUALS_STANDARD_FIELD':
    case 'NOT_EQUALS_STANDARD_FIELD':
      // First value must be the field name to compare against
      // Second value (if field is provider field) must be provider role
      // Third value (if field is PROVIDER_ALTERNATE_ID) must be alternate ID type
      if (values.length === 0) {
        return `Operator ${operator} requires at least 1 value (the field name to compare against)`
      }
      break

    case 'BETWEEN':
      // BETWEEN requires at least 2 values (can have multiple pairs for string ranges)
      if (values.length < 2) {
        return 'BETWEEN operator requires at least 2 values (lower and upper bound)'
      }
      // For multiple ranges, must have even number of values
      if (values.length % 2 !== 0) {
        return 'BETWEEN operator with multiple ranges requires an even number of values'
      }
      break

    case 'IN':
    case 'NOT_IN':
      if (values.length === 0) {
        return 'At least one value is required for IN/NOT_IN operators'
      }
      break
  }

  return null
}

/**
 * Validate data type
 */
const validateDataType = (
  dataType: string,
  values: string[],
  operator: StandardOperator
): string[] => {
  const errors: string[] = []

  // Skip data type validation for operators that don't use literal values
  if (operator === 'VALUED' || operator === 'NOT_VALUED' ||
      operator === 'EQUALS_STANDARD_FIELD' || operator === 'NOT_EQUALS_STANDARD_FIELD') {
    return errors
  }

  values.forEach((value) => {
    switch (dataType) {
      case 'INTEGER':
        if (!isValidInteger(value)) {
          errors.push(`Value "${value}" is not a valid integer`)
        }
        break

      case 'DATE':
        if (!isValidDate(value)) {
          errors.push(`Value "${value}" is not a valid date (must be YYYY-MM-DD)`)
        }
        break

      case 'BOOLEAN':
        if (!isValidBoolean(value)) {
          errors.push(`Value "${value}" is not a valid boolean (true/false)`)
        }
        break
    }
  })

  // Additional validation for BETWEEN operator
  if (operator === 'BETWEEN' && values.length === 2) {
    if (dataType === 'INTEGER') {
      const lower = parseInt(values[0])
      const upper = parseInt(values[1])
      if (!isNaN(lower) && !isNaN(upper) && lower > upper) {
        errors.push('Lower bound must be less than or equal to upper bound')
      }
    } else if (dataType === 'DATE') {
      if (isValidDate(values[0]) && isValidDate(values[1])) {
        const lower = new Date(values[0])
        const upper = new Date(values[1])
        if (lower > upper) {
          errors.push('Start date must be before or equal to end date')
        }
      }
    }
  }

  return errors
}

/**
 * Check if value is a valid integer
 */
const isValidInteger = (value: string): boolean => {
  return /^-?\d+$/.test(value)
}

/**
 * Check if value is a valid date (YYYY-MM-DD)
 */
const isValidDate = (value: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(value)) {
    return false
  }

  const date = new Date(value)
  return !isNaN(date.getTime()) && value === date.toISOString().split('T')[0]
}

/**
 * Check if value is a valid boolean
 */
const isValidBoolean = (value: string): boolean => {
  return value === 'true' || value === 'false'
}

/**
 * Validate actions
 */
export const validateActions = (actions?: RuleActions): ValidationError[] => {
  const errors: ValidationError[] = []

  if (!actions) {
    return errors
  }

  // Validate departmentRouting
  if (actions.departmentRouting) {
    if (!actions.departmentRouting.departmentCode || actions.departmentRouting.departmentCode.trim() === '') {
      errors.push({
        field: 'actions.departmentRouting.departmentCode',
        message: 'Department code is required for departmentRouting action',
      })
    }
  }

  // Validate generateLetters
  if (actions.generateLetters) {
    if (!Array.isArray(actions.generateLetters) || actions.generateLetters.length === 0) {
      errors.push({
        field: 'actions.generateLetters',
        message: 'At least one letter is required for generateLetters action',
      })
    } else {
      actions.generateLetters.forEach((letter, index) => {
        if (!letter.letterName || letter.letterName.trim() === '') {
          errors.push({
            field: `actions.generateLetters[${index}].letterName`,
            message: `Letter name is required for letter at index ${index}`,
          })
        }
      })
    }
  }

  // Validate close
  if (actions.close) {
    if (!actions.close.dispositionCode || actions.close.dispositionCode.trim() === '') {
      errors.push({
        field: 'actions.close.dispositionCode',
        message: 'Disposition code is required for close action',
      })
    }
  }

  // Validate createTask
  if (actions.createTask) {
    const task = actions.createTask
    if (!task.typeCode || task.typeCode.trim() === '') {
      errors.push({
        field: 'actions.createTask.typeCode',
        message: 'Type code is required for createTask action',
      })
    }
    if (!task.priorityCode || task.priorityCode.trim() === '') {
      errors.push({
        field: 'actions.createTask.priorityCode',
        message: 'Priority code is required for createTask action',
      })
    }
    if (!task.reasonCode || task.reasonCode.trim() === '') {
      errors.push({
        field: 'actions.createTask.reasonCode',
        message: 'Reason code is required for createTask action',
      })
    }
    if (task.units === undefined || task.units === null) {
      errors.push({
        field: 'actions.createTask.units',
        message: 'Units is required for createTask action',
      })
    }
    if (!task.unitsUomCode || task.unitsUomCode.trim() === '') {
      errors.push({
        field: 'actions.createTask.unitsUomCode',
        message: 'Units UOM code is required for createTask action',
      })
    }
    if (!task.calculationField || task.calculationField.trim() === '') {
      errors.push({
        field: 'actions.createTask.calculationField',
        message: 'Calculation field is required for createTask action',
      })
    }
    if (!task.ownerDepartmentCode || task.ownerDepartmentCode.trim() === '') {
      errors.push({
        field: 'actions.createTask.ownerDepartmentCode',
        message: 'Owner department code is required for createTask action',
      })
    }
  }

  // Validate createAppealTasks
  if (actions.createAppealTasks) {
    if (!Array.isArray(actions.createAppealTasks) || actions.createAppealTasks.length === 0) {
      errors.push({
        field: 'actions.createAppealTasks',
        message: 'At least one appeal task is required for createAppealTasks action',
      })
    } else {
      actions.createAppealTasks.forEach((task, index) => {
        if (!task.typeCode || task.typeCode.trim() === '') {
          errors.push({
            field: `actions.createAppealTasks[${index}].typeCode`,
            message: `Type code is required for appeal task at index ${index}`,
          })
        }
        if (!task.priorityCode || task.priorityCode.trim() === '') {
          errors.push({
            field: `actions.createAppealTasks[${index}].priorityCode`,
            message: `Priority code is required for appeal task at index ${index}`,
          })
        }
        if (!task.reasonCode || task.reasonCode.trim() === '') {
          errors.push({
            field: `actions.createAppealTasks[${index}].reasonCode`,
            message: `Reason code is required for appeal task at index ${index}`,
          })
        }
        if (task.units === undefined || task.units === null) {
          errors.push({
            field: `actions.createAppealTasks[${index}].units`,
            message: `Units is required for appeal task at index ${index}`,
          })
        }
        if (!task.unitsUomCode || task.unitsUomCode.trim() === '') {
          errors.push({
            field: `actions.createAppealTasks[${index}].unitsUomCode`,
            message: `Units UOM code is required for appeal task at index ${index}`,
          })
        }
        if (!task.calculationField || task.calculationField.trim() === '') {
          errors.push({
            field: `actions.createAppealTasks[${index}].calculationField`,
            message: `Calculation field is required for appeal task at index ${index}`,
          })
        }
        if (!task.ownerDepartmentCode || task.ownerDepartmentCode.trim() === '') {
          errors.push({
            field: `actions.createAppealTasks[${index}].ownerDepartmentCode`,
            message: `Owner department code is required for appeal task at index ${index}`,
          })
        }
      })
    }
  }

  // Validate assignSkill
  if (actions.assignSkill) {
    if (!actions.assignSkill.skillCode || actions.assignSkill.skillCode.trim() === '') {
      errors.push({
        field: 'actions.assignSkill.skillCode',
        message: 'Skill code is required for assignSkill action',
      })
    }
  }

  // Validate assignLicenses
  if (actions.assignLicenses) {
    if (!Array.isArray(actions.assignLicenses.licenseCodes) || actions.assignLicenses.licenseCodes.length === 0) {
      errors.push({
        field: 'actions.assignLicenses.licenseCodes',
        message: 'At least one license code is required for assignLicenses action',
      })
    }
  }

  // Validate generateWorkflowMessage
  if (actions.generateWorkflowMessage) {
    if (!actions.generateWorkflowMessage.message || actions.generateWorkflowMessage.message.trim() === '') {
      errors.push({
        field: 'actions.generateWorkflowMessage.message',
        message: 'Message is required for generateWorkflowMessage action',
      })
    }
    if (!actions.generateWorkflowMessage.messageType || actions.generateWorkflowMessage.messageType.trim() === '') {
      errors.push({
        field: 'actions.generateWorkflowMessage.messageType',
        message: 'Message type is required for generateWorkflowMessage action',
      })
    }
  }

  // Validate createCMReferral
  if (actions.createCMReferral) {
    if (!actions.createCMReferral.programCode || actions.createCMReferral.programCode.trim() === '') {
      errors.push({
        field: 'actions.createCMReferral.programCode',
        message: 'Program code is required for createCMReferral action',
      })
    }
    if (!actions.createCMReferral.sourceCode || actions.createCMReferral.sourceCode.trim() === '') {
      errors.push({
        field: 'actions.createCMReferral.sourceCode',
        message: 'Source code is required for createCMReferral action',
      })
    }
    if (!actions.createCMReferral.severityCode || actions.createCMReferral.severityCode.trim() === '') {
      errors.push({
        field: 'actions.createCMReferral.severityCode',
        message: 'Severity code is required for createCMReferral action',
      })
    }
    if (!actions.createCMReferral.ownerDepartmentCode || actions.createCMReferral.ownerDepartmentCode.trim() === '') {
      errors.push({
        field: 'actions.createCMReferral.ownerDepartmentCode',
        message: 'Owner department code is required for createCMReferral action',
      })
    }
  }

  return errors
}

/**
 * Validate entire rule
 */
export const validateRule = (rule: Partial<Rule>): ValidationError[] => {
  const errors: ValidationError[] = []

  // Validate rule code
  if (!rule.code || rule.code.trim() === '') {
    errors.push({
      field: 'code',
      message: 'Rule code is required',
    })
  } else if (rule.code.length < 3 || rule.code.length > 100) {
    errors.push({
      field: 'code',
      message: 'Rule code must be between 3 and 100 characters',
    })
  } else if (!/^[a-zA-Z0-9_-]+$/.test(rule.code)) {
    errors.push({
      field: 'code',
      message: 'Rule code can only contain letters, numbers, underscores, and hyphens',
    })
  }

  // Validate rule name (ruleDesc field)
  if (!rule.ruleDesc || rule.ruleDesc.trim() === '') {
    errors.push({
      field: 'ruleDesc',
      message: 'Rule name is required',
    })
  } else if (rule.ruleDesc.length > 200) {
    errors.push({
      field: 'ruleDesc',
      message: 'Rule name must be 200 characters or less',
    })
  }

  // Validate at least one criteria exists
  const hasStandardCriteria =
    rule.standardFieldCriteria && rule.standardFieldCriteria.length > 0
  const hasCustomCriteria =
    rule.customFieldCriteria && rule.customFieldCriteria.length > 0

  if (!hasStandardCriteria && !hasCustomCriteria) {
    errors.push({
      field: 'criteria',
      message: 'At least one criteria (standard or custom) is required',
    })
  }

  // Validate standard field criteria
  // For TAT rules, skip operator validation (operator is implicitly "IN")
  const isTATRule = !!rule.tatParameters
  if (rule.standardFieldCriteria) {
    rule.standardFieldCriteria.forEach((criteria) => {
      const criteriaErrors = validateStandardCriteria(criteria, isTATRule)
      errors.push(...criteriaErrors)
    })
  }

  // Validate custom field criteria
  if (rule.customFieldCriteria) {
    rule.customFieldCriteria.forEach((criteria) => {
      const criteriaErrors = validateCustomCriteria(criteria, isTATRule)
      errors.push(
        ...criteriaErrors.map((err) => ({
          ...err,
        }))
      )
    })
  }

  // Validate actions
  const actionsErrors = validateActions(rule.actions)
  errors.push(...actionsErrors)

  // Validate weight
  if (rule.weight !== undefined && rule.weight < 0) {
    errors.push({
      field: 'weight',
      message: 'Weight must be a non-negative number',
    })
  }

  // Validate activation date
  if (rule.activationDate && !isValidDate(rule.activationDate)) {
    errors.push({
      field: 'activationDate',
      message: 'Activation date must be in YYYY-MM-DD format',
    })
  }

  return errors
}

/**
 * Check if rule is valid
 */
export const isRuleValid = (rule: Partial<Rule>): boolean => {
  return validateRule(rule).length === 0
}

/**
 * Get validation error message
 */
export const getValidationMessage = (errors: ValidationError[]): string => {
  if (errors.length === 0) return ''
  if (errors.length === 1) return errors[0].message

  return `${errors.length} validation errors:\n${errors.map((e) => `- ${e.message}`).join('\n')}`
}
