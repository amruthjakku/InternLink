# Cohort-College Import Instructions

## File Format Requirements

### CSV Format (Recommended)
- Use commas to separate values
- Wrap text containing commas in quotes
- Supported file extensions: .csv

### Excel Format
- Tab-separated values work best
- Can be saved as .txt from Excel
- Use "Data > Text to Columns" when opening in Excel

## Required Columns

1. **cohortName** - Exact name of the cohort (case-sensitive)
2. **collegeName** - Exact name of the college (case-sensitive)  
3. **action** - Either "assign" or "unassign"

## Actions Explained

- **assign**: Assigns all unassigned users from the specified college to the specified cohort
- **unassign**: Removes all users from the specified college from the specified cohort

## Example CSV Content

```csv
cohortName,collegeName,action
"Winter 2024 Bootcamp","Stanford University","assign"
"Spring 2025 Program","MIT","assign"
"Summer 2024 Cohort","Harvard University","unassign"
```

## Important Notes

1. **Case Sensitivity**: Cohort and college names must match exactly
2. **Existing Data**: Only existing cohorts and colleges can be used
3. **User Status**: Only active users will be affected
4. **Validation**: Invalid entries will be skipped and reported
5. **Batch Processing**: All valid operations are processed together

## Steps to Import

1. Download the CSV or Excel template
2. Replace example data with your real cohort and college names
3. Set appropriate actions (assign/unassign)
4. Save the file
5. Upload through Admin Dashboard > Cohort System > Colleges > Import CSV
6. Review the import results

## Error Handling

Common issues and solutions:
- **"Cohort not found"**: Check spelling and ensure cohort exists
- **"College not found"**: Check spelling and ensure college exists  
- **"No users found"**: College has no unassigned users for assignment
- **"No assignments"**: No users from college in cohort for unassignment

## Getting Current Data

To see existing cohorts and colleges:
1. Go to Admin Dashboard > Cohort System > Colleges
2. View existing cohorts and their current college assignments
3. Use Admin Dashboard > College Management to see all colleges
