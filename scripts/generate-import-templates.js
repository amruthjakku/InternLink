/**
 * Template Generator for Cohort-College Import Feature
 * This script creates clean import templates for real college data
 */

const fs = require('fs');
const path = require('path');

function generateImportTemplates() {
  console.log('📄 Generating import templates for Cohort-College feature...');

  // Create clean CSV template with instructions
  const csvTemplate = `cohortName,collegeName,action
"Your Cohort Name Here","Your College Name Here","assign"
"Another Cohort Name","Another College Name","assign"
"Example Cohort","Example College","unassign"`;

  // Create Excel-compatible template (tab-separated)
  const excelTemplate = `cohortName	collegeName	action
Your Cohort Name Here	Your College Name Here	assign
Another Cohort Name	Another College Name	assign
Example Cohort	Example College	unassign`;

  // Create detailed instructions file
  const instructions = `# Cohort-College Import Instructions

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

\`\`\`csv
cohortName,collegeName,action
"Winter 2024 Bootcamp","Stanford University","assign"
"Spring 2025 Program","MIT","assign"
"Summer 2024 Cohort","Harvard University","unassign"
\`\`\`

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
`;

  // Ensure public directory exists
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Write template files
  try {
    fs.writeFileSync(path.join(publicDir, 'cohort-college-import-template.csv'), csvTemplate);
    console.log('✅ Created CSV template: /public/cohort-college-import-template.csv');

    fs.writeFileSync(path.join(publicDir, 'cohort-college-import-template.txt'), excelTemplate);
    console.log('✅ Created Excel template: /public/cohort-college-import-template.txt');

    fs.writeFileSync(path.join(publicDir, 'cohort-college-import-instructions.md'), instructions);
    console.log('✅ Created instructions: /public/cohort-college-import-instructions.md');

    console.log('\n🎉 Templates generated successfully!');
    console.log('\n📋 Available Templates:');
    console.log('   • CSV Template: cohort-college-import-template.csv');
    console.log('   • Excel Template: cohort-college-import-template.txt');
    console.log('   • Instructions: cohort-college-import-instructions.md');
    console.log('\n💡 These templates are now available for download in the admin dashboard!');

  } catch (error) {
    console.error('❌ Error generating templates:', error);
  }
}

// Run the template generator
generateImportTemplates();