#!/usr/bin/env python3
"""
Convert TAT Rules Excel file to JSON format for import into the Rules Builder UI.

This script reads an Excel file containing TAT (Turnaround Time) rules and converts
them into the TATRuleExport JSON format expected by the application.
"""

import pandas as pd
import json
import sys
from datetime import datetime

# Field mappings from Excel columns to standardFieldCriteria field names
FIELD_MAPPINGS = {
    'TX_TYPE': 'SERVICE_TREATMENT_TYPE',
    'URGENCY': 'REQUEST_URGENCY',
    'REVIEW_TYPE': 'SERVICE_REVIEW_TYPE',
    'REQUEST_TYPE': 'REQUEST_TYPE',
    'CLIENT': 'MEMBER_CLIENT',
    'LOB': 'ENROLLMENT_LINE_OF_BUSINESS',
    'PLAN_TYPE': 'ENROLLMENT_PLAN',
    'TX_SETTING': 'REQUEST_TREATMENT_SETTING',
    'STATUS': 'REVIEW_OUTCOME_STATUS',
    'STATUS_REASON': 'REVIEW_OUTCOME_STATUS_REASON',
}

# Units of measure mappings
UNITS_MAPPING = {
    'HR': 'HOURS',
    'BD': 'BUSINESS_DAYS',
    'CD': 'CALENDAR_DAYS',
}

# Source date/time field mappings
SOURCE_DATE_MAPPING = {
    'NOTIFYDATE': 'NOTIFICATION_DATE_TIME',
    'STATUSCHANGEDATE': 'STATUS_CHANGE_DATE_TIME',
    'REQUESTDATE': 'REQUEST_DATE_TIME',
    'RECEIPTDATE': 'RECEIPT_DATE_TIME',
    'RECEIVEDDATE': 'RECEIVED_DATE_TIME',
}


def is_valid_value(value):
    """Check if a value is valid (not *, [NULL], or NaN)."""
    if pd.isna(value):
        return False
    if isinstance(value, str):
        if value.strip() in ['*', '[NULL]', '']:
            return False
    return True


def parse_holiday_dates(value):
    """Parse holiday dates string into array."""
    if not is_valid_value(value):
        return []

    # Handle different possible formats
    if isinstance(value, str):
        # Split by comma or space
        dates = [d.strip() for d in value.replace(',', ' ').split() if d.strip()]
        # Filter out invalid values
        return [d for d in dates if d not in ['*', '[NULL]']]

    return []


def convert_row_to_tat_rule(row):
    """Convert a single Excel row to a TATRuleExport object."""

    # Initialize the rule structure
    rule = {
        'ruleDesc': row['DUE_DATE_AUTO_CALC_RULE_DESC'],
        'isActive': bool(row['ACTIVE'] == 1),
        'weight': int(row['WEIGHT']) if pd.notna(row['WEIGHT']) else 100,
        'units': int(row['DUE_DATE']) if pd.notna(row['DUE_DATE']) else 72,
        'unitsOfMeasure': UNITS_MAPPING.get(row['DUE_DATE_UNITS'], 'HOURS'),
        'sourceDateTimeField': SOURCE_DATE_MAPPING.get(
            row['DATE_TO_CALC_FROM'],
            'NOTIFICATION_DATE_TIME'
        ),
        'standardFieldCriteria': [],
        'customFieldCriteria': None,
        'dueTime': None,
        'holidayDates': [],
        'holidayCategory': None,
        'holidayOffset': None,
        'clinicalsRequestedResponseThresholdHours': None,
        'dateOperator': None,
        'autoExtend': False,
        'extendStatusReason': None,
    }

    # Add dueTime if present
    if is_valid_value(row.get('DUE_DATE_TIME')):
        due_time = str(row['DUE_DATE_TIME']).strip()
        # Handle time format (could be HH:MM:SS or HH:MM)
        if ':' in due_time:
            parts = due_time.split(':')
            rule['dueTime'] = f"{parts[0].zfill(2)}:{parts[1].zfill(2)}"

    # Add holiday dates (if it's actual dates, not a category code)
    skip_holidays = row.get('SKIP_HOLIDAY_DATES')
    if is_valid_value(skip_holidays):
        skip_holidays_str = str(skip_holidays).strip()
        # Check if it looks like a category code (contains letters)
        if any(c.isalpha() for c in skip_holidays_str):
            # It's a category code
            rule['holidayCategory'] = skip_holidays_str
        else:
            # It's a list of dates
            rule['holidayDates'] = parse_holiday_dates(skip_holidays)

    # Add holiday offset
    if is_valid_value(row.get('OFFSET_VALUE')):
        rule['holidayOffset'] = int(row['OFFSET_VALUE'])

    # Add date operator
    if is_valid_value(row.get('DATE_OPERATOR')):
        rule['dateOperator'] = str(row['DATE_OPERATOR']).strip()

    # Add auto extend fields
    if is_valid_value(row.get('AUTO_EXTEND')) and row['AUTO_EXTEND'] == 1:
        rule['autoExtend'] = True
        if is_valid_value(row.get('EXTEND_STATUS_RSN')):
            rule['extendStatusReason'] = str(row['EXTEND_STATUS_RSN']).strip()

    # Build standard field criteria
    for excel_col, standard_field in FIELD_MAPPINGS.items():
        if excel_col in row and is_valid_value(row[excel_col]):
            value = str(row[excel_col]).strip()

            # Create criteria object
            criteria = {
                'field': standard_field,
                'values': [value]
            }

            rule['standardFieldCriteria'].append(criteria)

    return rule


def convert_excel_to_json(excel_file_path, output_json_path=None):
    """
    Convert TAT rules Excel file to JSON format.

    Args:
        excel_file_path: Path to the Excel file
        output_json_path: Path for the output JSON file (optional)

    Returns:
        Dictionary containing the rules array
    """

    print(f"Reading Excel file: {excel_file_path}")
    df = pd.read_excel(excel_file_path, sheet_name=0)

    print(f"Found {len(df)} rows in Excel file")

    # Convert each row to a TAT rule
    rules = []
    for idx, row in df.iterrows():
        try:
            rule = convert_row_to_tat_rule(row)
            rules.append(rule)
            print(f"✓ Converted row {idx + 1}: {rule['ruleDesc'][:50]}...")
        except Exception as e:
            print(f"✗ Error converting row {idx + 1}: {e}")
            continue

    # Create the final structure
    result = {
        'rules': rules
    }

    # Save to file if output path provided
    if output_json_path:
        with open(output_json_path, 'w') as f:
            json.dump(result, f, indent=2)
        print(f"\n✓ Successfully converted {len(rules)} rules")
        print(f"✓ JSON saved to: {output_json_path}")

    return result


def main():
    """Main entry point for the script."""

    if len(sys.argv) < 2:
        print("Usage: python convertTATExcelToJSON.py <excel_file> [output_json]")
        print("\nExample:")
        print('  python convertTATExcelToJSON.py "src/Sample Files/TAT_PullQ_IBX_20251017.xlsx" "IBX_TAT_Rules.json"')
        sys.exit(1)

    excel_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None

    # Generate default output filename if not provided
    if not output_file:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_file = f"TAT_Rules_{timestamp}.json"

    convert_excel_to_json(excel_file, output_file)


if __name__ == '__main__':
    main()
