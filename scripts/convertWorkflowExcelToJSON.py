#!/usr/bin/env python3
"""
Convert IBX Workflow Rules from Excel to JSON format
Processes "AWF Rules - Request" tab from Adoption Analysis - IBX - External.xlsx
"""

import pandas as pd
import json
import re
from typing import Any, Dict, List, Optional

# Field mappings from Excel Rule Summary to standardFieldCriteria field names
FIELD_MAPPINGS = {
    'Member client': 'MEMBER_CLIENT',
    'Review Type': 'SERVICE_REVIEW_TYPE',
    'Treatment type': 'SERVICE_TREATMENT_TYPE',
    'Urgency': 'REQUEST_URGENCY',
    'Outcome Status Reason': 'REVIEW_OUTCOME_STATUS_REASON',
    'Request Bed Type': 'REQUEST_TREATMENT_SETTING',  # Bed type is a treatment setting
    'Source System': 'REQUEST_ORIGINATING_SYSTEM_SOURCE',
    'CID': 'ENROLLMENT_GROUP_ID',
    'Member Group ID': 'ENROLLMENT_GROUP_ID',
    'Request Type': 'REQUEST_TYPE',
    'Member State': 'MEMBER_STATE',
    'Treatment Type': 'SERVICE_TREATMENT_TYPE',
    'LOB': 'ENROLLMENT_LINE_OF_BUSINESS',
    'Plan': 'ENROLLMENT_PLAN',
    'Service Code': 'SERVICE_CODE',
    'Diagnosis Code': 'REQUEST_DIAGNOSIS_CODE',
    'Task Type': 'REQUEST_CLASSIFICATION',  # Task rules use this
    'Task Reason': 'REQUEST_STATUS',
    'Task Outcome': 'REVIEW_OUTCOME_STATUS',
}

# Operator mappings
OPERATOR_MAPPINGS = {
    'is': 'EQUALS',
    'is not': 'NOT_IN',
    'is in the group': 'IN',
    'is not in the group': 'NOT_IN',
}

def is_valid_value(value: Any) -> bool:
    """Check if a value is valid (not null, not empty, not '(null)')"""
    if pd.isna(value):
        return False
    if isinstance(value, str) and (value.strip() == '' or value.strip() == '(null)'):
        return False
    return True

def parse_rule_summary(summary: str) -> List[Dict[str, Any]]:
    """
    Parse Rule Summary string into standardFieldCriteria

    Example: "Member client is in the group 'All Clients (NO BUPA)' AND Review Type is 'Retrospective'"
    """
    criteria = []

    if not summary or pd.isna(summary):
        return criteria

    # Split by AND/OR (we'll use AND for now as it's most common)
    parts = re.split(r'\s+AND\s+', summary, flags=re.IGNORECASE)

    for part in parts:
        part = part.strip()
        if not part:
            continue

        # Try to match pattern: "Field operator 'value'" or "Field operator value"
        match = re.match(r"(.+?)\s+(is not in the group|is in the group|is not|is)\s+['\"]?(.+?)['\"]?\s*$", part, re.IGNORECASE)

        if match:
            field_name = match.group(1).strip()
            operator_text = match.group(2).strip().lower()
            values_text = match.group(3).strip().strip("'\"")

            # Map field name
            mapped_field = FIELD_MAPPINGS.get(field_name)
            if not mapped_field:
                print(f"WARNING: Unknown field '{field_name}' in: {part}")
                continue

            # Map operator
            operator = OPERATOR_MAPPINGS.get(operator_text, 'IN')

            # Parse values (could be single value or comma-separated if it's a group reference)
            # For now, treat as single value - groups are just reference names
            values = [values_text]

            criteria.append({
                'field': mapped_field,
                'operator': operator,
                'values': values
            })

    return criteria

def parse_trigger_events(row: pd.Series) -> List[str]:
    """Extract trigger events from row"""
    events = []

    if row.get('Create Request') == 'Yes':
        events.append('CREATE_REQUEST')
    if row.get('Edit Request') == 'Yes':
        events.append('EDIT_REQUEST')
    if row.get('Extend Request') == 'Yes':
        events.append('EXTEND_REQUEST')
    if row.get('Create Service') == 'Yes':
        events.append('CREATE_SERVICE')
    if row.get('Edit Service') == 'Yes':
        events.append('EDIT_SERVICE')
    if row.get('Extend Service') == 'Yes':
        events.append('EXTEND_SERVICE')
    if row.get('Save Questionnaire') == 'Yes':
        events.append('SAVE_QUESTIONNAIRE')

    return events

def parse_actions(row: pd.Series) -> Optional[Dict[str, Any]]:
    """Extract actions from row"""
    actions = {}

    # Triggered Letter -> generateLetters
    if is_valid_value(row.get('Triggered Letter')):
        letter_name = str(row['Triggered Letter']).strip()
        actions['generateLetters'] = [{'letterName': letter_name}]

    # Task Type, Task Reason, Days, Task Owner, Auto-Close -> createTask
    task_type = row.get('Task Type')
    task_reason = row.get('Task Reason')

    if is_valid_value(task_type) or is_valid_value(task_reason):
        create_task = {}

        if is_valid_value(task_type):
            create_task['taskType'] = str(task_type).strip()
        else:
            create_task['taskType'] = ''

        if is_valid_value(task_reason):
            create_task['taskReason'] = str(task_reason).strip()
        else:
            create_task['taskReason'] = ''

        if is_valid_value(row.get('Days')):
            try:
                days = int(float(row['Days']))
                if days > 0:
                    create_task['daysUntilDue'] = days
            except (ValueError, TypeError):
                pass

        if is_valid_value(row.get('Task Owner')):
            create_task['taskOwner'] = str(row['Task Owner']).strip()

        if is_valid_value(row.get('Auto-Close')) and row['Auto-Close'] == 'Yes':
            create_task['autoClose'] = True

        actions['createTask'] = create_task

    # Transfer -> transferOwnership
    if is_valid_value(row.get('Transfer')) and row['Transfer'] == 'Yes':
        # Transfer doesn't specify where to transfer in Excel, use task owner if available
        transfer_to = 'UNASSIGNED'
        if is_valid_value(row.get('Task Owner')):
            transfer_to = str(row['Task Owner']).strip()
        actions['transferOwnership'] = {'transferTo': transfer_to}

    # Created Program -> createProgram
    if is_valid_value(row.get('Created Program')):
        program_name = str(row['Created Program']).strip()
        actions['createProgram'] = {'programName': program_name}

    return actions if actions else None

def convert_excel_to_json(excel_file: str, sheet_name: str = 'AWF Rules - Request') -> List[Dict[str, Any]]:
    """Convert Excel workflow rules to JSON format"""

    print(f"Reading {sheet_name} from {excel_file}...")
    df = pd.read_excel(excel_file, sheet_name=sheet_name)

    print(f"Found {len(df)} rules")

    rules = []
    skipped = 0

    for idx, row in df.iterrows():
        name = row.get('Name')
        if not is_valid_value(name):
            skipped += 1
            continue

        rule_summary = row.get('Rule Summary')
        if not is_valid_value(rule_summary):
            print(f"WARNING: Rule '{name}' has no Rule Summary, skipping")
            skipped += 1
            continue

        # Parse criteria from Rule Summary
        standard_criteria = parse_rule_summary(str(rule_summary))

        # Parse trigger events
        trigger_events = parse_trigger_events(row)

        # Parse request type filter
        request_type_filter = None
        if is_valid_value(row.get('Request Type')):
            req_type = str(row['Request Type']).strip().upper()
            if req_type in ['INPATIENT', 'OUTPATIENT']:
                request_type_filter = req_type

        # Parse fire once
        fire_once = False
        if is_valid_value(row.get('Fire Once')):
            try:
                fire_once = int(float(row['Fire Once'])) == 1
            except (ValueError, TypeError):
                pass

        # Parse actions
        actions = parse_actions(row)

        # Determine weight (default 100)
        weight = 100

        # Determine active status (default active)
        is_active = True
        if is_valid_value(row.get('Active Date')):
            # If there's an active date, it's active (simplified logic)
            is_active = True

        # Build rule object
        rule = {
            'ruleDesc': str(name).strip(),
            'standardFieldCriteria': standard_criteria,
            'isActive': is_active,
            'weight': weight,
        }

        # Add optional fields
        if trigger_events:
            rule['triggerEvents'] = trigger_events

        if request_type_filter:
            rule['requestTypeFilter'] = request_type_filter

        if fire_once:
            rule['fireOnce'] = fire_once

        if actions:
            rule['actions'] = actions

        rules.append(rule)

    print(f"\nConverted {len(rules)} rules successfully")
    print(f"Skipped {skipped} rules (no name or summary)")

    return rules

def main():
    """Main conversion function"""
    excel_file = '../src/Sample Files/Adoption Analysis - IBX - External.xlsx'
    output_file = '../src/Sample Files/IBX_Workflow_Rules_20251017.json'

    try:
        # Convert Request rules
        rules = convert_excel_to_json(excel_file, 'AWF Rules - Request')

        # Write to JSON
        print(f"\nWriting to {output_file}...")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(rules, f, indent=2, ensure_ascii=False)

        print(f"\n✓ Successfully created {output_file}")
        print(f"✓ Total rules: {len(rules)}")

        # Print statistics
        trigger_counts = {}
        action_counts = {}
        request_type_counts = {'INPATIENT': 0, 'OUTPATIENT': 0, 'ANY': 0}

        for rule in rules:
            # Count triggers
            for trigger in rule.get('triggerEvents', []):
                trigger_counts[trigger] = trigger_counts.get(trigger, 0) + 1

            # Count actions
            actions = rule.get('actions', {})
            for action_type in actions.keys():
                action_counts[action_type] = action_counts.get(action_type, 0) + 1

            # Count request types
            req_type = rule.get('requestTypeFilter')
            if req_type == 'INPATIENT':
                request_type_counts['INPATIENT'] += 1
            elif req_type == 'OUTPATIENT':
                request_type_counts['OUTPATIENT'] += 1
            else:
                request_type_counts['ANY'] += 1

        print("\n=== STATISTICS ===")
        print(f"\nRequest Type Distribution:")
        for req_type, count in request_type_counts.items():
            print(f"  {req_type}: {count}")

        print(f"\nTrigger Event Usage:")
        for trigger, count in sorted(trigger_counts.items(), key=lambda x: -x[1]):
            print(f"  {trigger}: {count}")

        print(f"\nAction Type Usage:")
        for action, count in sorted(action_counts.items(), key=lambda x: -x[1]):
            print(f"  {action}: {count}")

    except FileNotFoundError:
        print(f"ERROR: Could not find {excel_file}")
        print("Make sure the Excel file is in the correct location")
        return 1
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1

    return 0

if __name__ == '__main__':
    exit(main())
