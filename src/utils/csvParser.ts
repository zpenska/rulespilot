import { DictionaryItem } from '../types/rules'

/**
 * Parses CSV content into dictionary items
 * Handles different CSV formats from the Dictionaries folder
 */
export const parseCSV = (csvContent: string): DictionaryItem[] => {
  const lines = csvContent.trim().split('\n')

  if (lines.length < 2) {
    return []
  }

  // Parse header row
  const headers = parseCSVLine(lines[0])
  const items: DictionaryItem[] = []

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])

    if (values.length === 0) continue

    const item: Record<string, string | boolean> = {}

    headers.forEach((header, index) => {
      const cleanHeader = header.trim()
      const value = values[index]?.trim() || ''

      // Map common column names to standard format
      if (cleanHeader.includes('_Description') || cleanHeader === 'Description') {
        item.description = value
      } else if (cleanHeader === 'Active' || cleanHeader === 'active') {
        item.active = value.toLowerCase() === 'true' || value === '1'
      } else if (!item.code && index === 0) {
        // First column is usually the code
        item.code = value
      } else {
        item[cleanHeader] = value
      }
    })

    // Ensure required fields exist
    if (!item.code) {
      item.code = values[0]?.trim() || ''
    }
    if (!item.description) {
      item.description = values[1]?.trim() || (item.code as string)
    }
    if (item.active === undefined) {
      item.active = true
    }

    if (item.code) {
      items.push(item as DictionaryItem)
    }
  }

  return items
}

/**
 * Parses a single CSV line, handling quoted values
 */
const parseCSVLine = (line: string): string[] => {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }

  // Add last field
  result.push(current)

  return result.map(val => val.trim().replace(/^"|"$/g, ''))
}

/**
 * Loads a CSV file from the public/dictionaries folder
 */
export const loadDictionaryCSV = async (filename: string): Promise<DictionaryItem[]> => {
  try {
    const response = await fetch(`/dictionaries/${filename}`)
    if (!response.ok) {
      throw new Error(`Failed to load ${filename}`)
    }
    const csvContent = await response.text()
    return parseCSV(csvContent)
  } catch (error) {
    console.error(`Error loading dictionary ${filename}:`, error)
    return []
  }
}

/**
 * Dictionary file mapping
 * Maps logical dictionary names to actual CSV files
 */
export const DICTIONARY_FILES: Record<string, string> = {
  // Request fields
  'Request_Classification': 'Request_Classification.csv',
  'Disposition': 'Disposition.csv',
  'Healthcare_Type': 'Healthcare_Type.csv',
  'Request_Intake_Source': 'Request_Intake_Source.csv',
  'Source_System': 'Source_System.csv',
  'Request_Type': 'Request_Type.csv',
  'Request_Urgency': 'Request_Urgency.csv',
  'Availity_Treatment_Setting': 'Availity_Treatment_Setting.csv',

  // Review Outcome fields
  'Outcome_Status': 'Outcome_Status.csv',
  'Outcome_Reason': 'Outcome_Reason.csv',

  // Service fields
  'Review_Type': 'Review_Type.csv',

  // Provider fields
  'provider_tier': 'Provider_Tier.csv',
  'request_provider_role': 'Request_Provider_Role.csv',

  // Other
  'bed_type': 'Bed_Type.csv',
  'requester_type': 'Requester_Type.csv',
  'attachment_category': 'Attachment_Category.csv',
  'deescalate_reason': 'Deescalate_Reason.csv',
  'divert_reason': 'Divert_Reason.csv',

  // Appeal fields
  'Appeal_Status': 'Appeal_Status.csv',
  'Appeal_Type': 'Appeal_Type.csv',
  'Appeal_Level': 'Appeal_Level.csv',
  'Appeal_Process_Type': 'Appeal_Process_Type.csv',
  'Appeal_Reason': 'Appeal_Reason.csv',
  'Appeal_Source': 'Appeal_Source.csv',
  'Appeal_Due_Date_Change_Reason': 'Appeal_Due_Date_Change_Reason.csv',
}

/**
 * Loads all dictionaries from CSV files
 */
export const loadAllDictionaries = async (): Promise<Record<string, DictionaryItem[]>> => {
  const dictionaries: Record<string, DictionaryItem[]> = {}

  const loadPromises = Object.entries(DICTIONARY_FILES).map(async ([key, filename]) => {
    const items = await loadDictionaryCSV(filename)
    dictionaries[key] = items
  })

  await Promise.all(loadPromises)

  return dictionaries
}
