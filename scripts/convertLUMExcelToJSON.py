#!/usr/bin/env python3
"""
Convert LUM UM Rules Excel file to AUTO_WORKFLOW_RULES JSON format.

This script reads the LUM UM Rules.xlsx file which uses a horizontal triplet structure
(Field-Operator-Value pattern) and converts it to the AUTO_WORKFLOW_RULES JSON format
that can be imported into the Rules Pilot application.

Usage:
    python3 scripts/convertLUMExcelToJSON.py <input_excel_file> <output_json_file>

Example:
    python3 scripts/convertLUMExcelToJSON.py "LUM UM Rules.xlsx" "lum-workflow-rules.json"
"""

import pandas as pd
import json
import sys
import re
from typing import List, Dict, Any, Optional

# Field name mappings: Excel field name -> Application field name
FIELD_MAPPINGS = {
    'Outcome Status': 'REVIEW_OUTCOME_STATUS',
    'Outcome Status ': 'REVIEW_OUTCOME_STATUS',  # Handle trailing space
    'Outcome Reason': 'REVIEW_OUTCOME_STATUS_REASON',
    'Outcome  Reason': 'REVIEW_OUTCOME_STATUS_REASON',  # Handle double space
    'Review Type': 'SERVICE_REVIEW_TYPE',
    'Member Line of Business': 'ENROLLMENT_LINE_OF_BUSINESS',
    'Request Type': 'REQUEST_TYPE',
    'Urgency': 'REQUEST_URGENCY',
    'Urgency ': 'REQUEST_URGENCY',  # Handle trailing space
    'Treatment Type': 'SERVICE_TREATMENT_TYPE',
    'Member State': 'MEMBER_STATE',
    'Member Client': 'MEMBER_CLIENT',
    'Plan': 'ENROLLMENT_PLAN',
}

# Operator mappings: Excel operator -> Application operator
OPERATOR_MAPPINGS = {
    'is any of': 'IN',
    'is none of': 'NOT_IN',
    'is': 'EQUALS',
    'is not': 'NOT_EQUALS',
}

# Action keyword mappings
ACTION_KEYWORDS = {
    'Reassign to': 'departmentRouting',
    'Task Type': 'createTask',
}


def normalize_field_name(field_name: str) -> str:
    """Normalize field name by stripping whitespace."""
    if pd.isna(field_name):
        return ''
    return str(field_name).strip()


def split_multi_values(value: Any) -> List[str]:
    """Split multi-line values into a list."""
    if pd.isna(value):
        return []

    value_str = str(value).strip()
    if '\n' in value_str:
        # Split by newline and filter out empty strings
        return [v.strip() for v in value_str.split('\n') if v.strip()]
    else:
        return [value_str]


def parse_criteria_triplets(row: pd.Series, start_idx: int, end_idx: int) -> List[Dict[str, Any]]:
    """
    Parse horizontal triplets (Field-Operator-Value) from the row.

    Args:
        row: The Excel row as a pandas Series
        start_idx: Starting column index
        end_idx: Ending column index (exclusive)

    Returns:
        List of standardFieldCriteria dictionaries
    """
    criteria = []
    idx = start_idx

    while idx < end_idx:
        # Try to read a triplet: field, operator, value
        if idx + 2 >= end_idx:
            break

        field_name = normalize_field_name(row.iloc[idx])
        operator = normalize_field_name(row.iloc[idx + 1])
        value = row.iloc[idx + 2]

        # Stop if we hit an empty field name
        if not field_name or field_name.lower() in ['action', 'task type', 'set task due to', 'task reason']:
            break

        # Map field name
        if field_name not in FIELD_MAPPINGS:
            raise ValueError(f"Unknown field name: '{field_name}'. Please add mapping to FIELD_MAPPINGS dictionary.")

        mapped_field = FIELD_MAPPINGS[field_name]

        # Map operator
        if operator not in OPERATOR_MAPPINGS:
            raise ValueError(f"Unknown operator: '{operator}' for field '{field_name}'. Please add mapping to OPERATOR_MAPPINGS dictionary.")

        mapped_operator = OPERATOR_MAPPINGS[operator]

        # Split multi-values
        values = split_multi_values(value)

        if values:  # Only add if there are values
            criteria.append({
                "operator": mapped_operator,
                "field": mapped_field,
                "values": values
            })

        # Move to next triplet
        idx += 3

    return criteria


def find_action_column_index(columns: List[str]) -> int:
    """Find the index of the 'Action' column or first action-related column."""
    for idx, col in enumerate(columns):
        col_str = str(col).strip() if not pd.isna(col) else ''
        if col_str.lower() in ['action', 'task type']:
            return idx
    return -1


def parse_actions(row: pd.Series, action_start_idx: int) -> Dict[str, Any]:
    """
    Parse action columns into the actions dictionary.

    Args:
        row: The Excel row as a pandas Series
        action_start_idx: Starting index for action columns

    Returns:
        Dictionary of actions
    """
    actions = {}

    # Check for "Reassign to" action
    action_type = normalize_field_name(row.iloc[action_start_idx])

    if action_type == 'Reassign to' and action_start_idx + 1 < len(row):
        dept_code = normalize_field_name(row.iloc[action_start_idx + 1])
        if dept_code:
            actions['departmentRouting'] = {
                'departmentCode': dept_code
            }

    # Check for "Task Type" action
    elif action_type == 'Task Type':
        task_type = None
        task_reason = None
        days_until_due = None

        # Look for task details in subsequent columns
        idx = action_start_idx + 1
        while idx < len(row):
            col_value = normalize_field_name(row.iloc[idx])

            if not col_value:
                idx += 1
                continue

            # Check if this is a column header or value
            if idx + 1 < len(row):
                next_value = row.iloc[idx + 1]

                if col_value == 'Task Type':
                    task_type = normalize_field_name(next_value)
                    idx += 2
                elif col_value == 'Task Reason':
                    task_reason = normalize_field_name(next_value)
                    idx += 2
                elif col_value == 'Set Task Due to':
                    due_value = normalize_field_name(next_value)
                    # Extract number from string like "3 Business Days"
                    match = re.search(r'(\d+)', due_value)
                    if match:
                        days_until_due = int(match.group(1))
                    idx += 2
                else:
                    # Might be a value without a header
                    if not task_type:
                        task_type = col_value
                    elif not task_reason:
                        task_reason = col_value
                    idx += 1
            else:
                idx += 1

        if task_type:
            actions['createTask'] = {
                'taskType': task_type,
                'taskReason': task_reason or 'Review Required',
                'daysUntilDue': days_until_due or 3
            }

    return actions


def generate_rule_description(criteria: List[Dict[str, Any]], actions: Dict[str, Any]) -> str:
    """Generate a human-readable rule description from criteria and actions."""
    # Summarize criteria
    criteria_parts = []
    for c in criteria[:3]:  # Take first 3 criteria for description
        field = c['field'].replace('_', ' ').title()
        operator_text = 'is' if c['operator'] == 'IN' else 'is not'
        values_text = ', '.join(c['values'][:2])  # Take first 2 values
        if len(c['values']) > 2:
            values_text += '...'
        criteria_parts.append(f"{field} {operator_text} {values_text}")

    criteria_summary = '; '.join(criteria_parts)

    # Summarize actions
    action_parts = []
    if 'departmentRouting' in actions:
        action_parts.append(f"Route to {actions['departmentRouting']['departmentCode']}")
    if 'createTask' in actions:
        task_type = actions['createTask']['taskType']
        action_parts.append(f"Create {task_type} task")

    action_summary = ' & '.join(action_parts)

    return f"{criteria_summary} → {action_summary}"


def convert_excel_to_json(input_file: str, output_file: str) -> None:
    """
    Convert LUM UM Rules Excel file to AUTO_WORKFLOW_RULES JSON format.

    Args:
        input_file: Path to input Excel file
        output_file: Path to output JSON file
    """
    print(f"Reading Excel file: {input_file}")
    df = pd.read_excel(input_file)

    print(f"Found {len(df)} rules to convert")

    # Find where actions start (look for "Action" column in first row)
    action_col_idx = -1
    for idx, col in enumerate(df.columns):
        first_row_value = normalize_field_name(df.iloc[0, idx])
        if first_row_value.lower() in ['action', 'task type']:
            action_col_idx = idx
            break

    # If not found in first row, look for a column named similar to action
    if action_col_idx == -1:
        for idx in range(len(df.columns)):
            # Check multiple rows for action keywords
            for row_idx in range(min(3, len(df))):
                cell_value = normalize_field_name(df.iloc[row_idx, idx])
                if cell_value.lower() in ['action', 'reassign to', 'task type']:
                    action_col_idx = idx
                    break
            if action_col_idx != -1:
                break

    if action_col_idx == -1:
        # Default to column 13 based on research
        action_col_idx = 13
        print(f"Warning: Could not find 'Action' column, assuming column index {action_col_idx}")
    else:
        print(f"Found action column at index: {action_col_idx}")

    rules = []

    for row_idx, row in df.iterrows():
        try:
            print(f"\nProcessing rule {row_idx + 1}...")

            # Parse criteria (columns 0 to action_col_idx)
            criteria = parse_criteria_triplets(row, 0, action_col_idx)

            if not criteria:
                print(f"  Skipping row {row_idx + 1}: No criteria found")
                continue

            print(f"  Found {len(criteria)} criteria")

            # Parse actions (columns from action_col_idx onwards)
            actions = parse_actions(row, action_col_idx)

            if not actions:
                print(f"  Warning: No actions found for row {row_idx + 1}")
            else:
                print(f"  Found actions: {list(actions.keys())}")

            # Generate rule description
            rule_desc = generate_rule_description(criteria, actions)

            # Generate rule code
            rule_code = f"LUM{str(row_idx + 1).zfill(3)}"

            # Build rule object
            rule = {
                "code": rule_code,
                "ruleDesc": rule_desc,
                "standardFieldCriteria": criteria,
                "customFieldCriteria": [],
                "isActive": True,
                "weight": 100,
                "actions": actions
            }

            rules.append(rule)
            print(f"  ✓ Successfully converted rule: {rule_code}")

        except ValueError as e:
            print(f"\n✗ ERROR processing row {row_idx + 1}: {e}")
            print(f"  Please fix the mapping and try again.")
            sys.exit(1)
        except Exception as e:
            print(f"\n✗ UNEXPECTED ERROR processing row {row_idx + 1}: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)

    # Build final output
    output = {
        "type": "AUTO_WORKFLOW_RULES",
        "rules": rules
    }

    # Write to JSON file
    print(f"\nWriting {len(rules)} rules to: {output_file}")
    with open(output_file, 'w') as f:
        json.dump(output, f, indent=2)

    print(f"\n✓ Successfully converted {len(rules)} rules!")
    print(f"Output file: {output_file}")
    print(f"\nYou can now import this file into your application using the 'Import Rules' feature.")


def main():
    if len(sys.argv) != 3:
        print("Usage: python3 convertLUMExcelToJSON.py <input_excel_file> <output_json_file>")
        print("\nExample:")
        print('  python3 scripts/convertLUMExcelToJSON.py "LUM UM Rules.xlsx" "lum-workflow-rules.json"')
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    convert_excel_to_json(input_file, output_file)


if __name__ == "__main__":
    main()
