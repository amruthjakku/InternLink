# How to Use Cohort-College Management Feature

## Quick Start Guide

### 1. Access the Feature
1. Login as admin/super-admin
2. Navigate to **Admin Dashboard**
3. Click **Cohort System** tab
4. Select **Colleges** sub-tab

### 2. View Current Assignments
- See all cohorts displayed as cards
- Click any cohort to view its college assignments
- View statistics: colleges count, interns, mentors, total users

### 3. Manual Assignment (Single Operations)
1. Click on a cohort to select it
2. Click **"Manage Colleges"** button
3. Check/uncheck colleges to assign/unassign
4. Click **"Assign"** or **"Unassign"** button

### 4. Bulk Import (Recommended for Multiple Operations)

#### Step 1: Get Current Data
Before importing, check your existing data:
- View cohorts in the dashboard to see exact names
- Go to **College Management** to see all college names
- Note: Names are **case-sensitive**

#### Step 2: Download Template
1. Click **"Import CSV"** button
2. Download either:
   - **CSV Template** (recommended for most users)
   - **Excel Template** (tab-separated, for Excel users)

#### Step 3: Prepare Your Data
Replace the example data with your real information:

```csv
cohortName,collegeName,action
"Winter 2024 Bootcamp","Stanford University","assign"
"Spring 2025 Program","MIT","assign"
"Summer 2024 Cohort","Harvard University","unassign"
```

#### Step 4: Import
1. Either upload your CSV file OR copy-paste the data
2. Click **"Import"** button
3. Review the results for any errors

## Important Rules

### Data Requirements
- **Cohort names** must match exactly (case-sensitive)
- **College names** must match exactly (case-sensitive)
- Both cohort and college must already exist in the system
- Only **active** users will be affected

### Actions Explained
- **assign**: Moves all unassigned users from the specified college to the specified cohort
- **unassign**: Removes all users from the specified college from the specified cohort

### What Gets Processed
✅ **Will be processed:**
- Active users with no current cohort assignment (for "assign")
- Active users currently in the specified cohort from the specified college (for "unassign")

❌ **Will be skipped:**
- Users already assigned to other cohorts (for "assign")
- Users not in the specified cohort (for "unassign")
- Inactive users

## Common Use Cases

### 1. New Semester Setup
```csv
cohortName,collegeName,action
"Spring 2025 Data Science","University of California","assign"
"Spring 2025 Data Science","Stanford University","assign"
"Spring 2025 Web Dev","MIT","assign"
```

### 2. Mid-Semester Adjustments
```csv
cohortName,collegeName,action
"Fall 2024 AI Program","Community College A","unassign"
"Spring 2025 AI Program","Community College A","assign"
```

### 3. End of Program Cleanup
```csv
cohortName,collegeName,action
"Completed Summer 2024","Harvard University","unassign"
"Completed Summer 2024","Yale University","unassign"
```

## Error Handling

### Common Errors and Solutions

**"Cohort not found"**
- Check spelling and capitalization
- Verify cohort exists in Cohort Management

**"College not found"**
- Check spelling and capitalization  
- Verify college exists in College Management

**"No users found for assignment"**
- College has no unassigned users
- All users from this college are already in cohorts

**"No users found for unassignment"**
- No users from this college are in the specified cohort

### Tips for Success
1. **Copy exact names** from the dashboard
2. **Use quotes** around names containing commas or special characters
3. **Test with small batches** first
4. **Review results** after each import
5. **Keep backups** of your import files

## Getting Help

If you need assistance:
1. Check the exact cohort and college names in their respective management sections
2. Review the import results for specific error messages
3. Start with smaller test imports to verify the data format
4. Use the manual assignment feature for single operations

## Template Files Available

After running the setup, these templates are available in your `/public` directory:
- `cohort-college-import-template.csv` - Clean CSV template
- `cohort-college-import-template.txt` - Excel-compatible template
- `cohort-college-import-instructions.md` - Detailed instructions

You can download these directly from the admin dashboard or access them via the file system.