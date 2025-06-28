# Cohort Colleges Management Feature

## Overview
This feature allows administrators to manage the relationship between cohorts and colleges in the InternLink system. Admins can view which colleges are assigned to each cohort, manage assignments, and bulk import college-cohort relationships.

## Features

### 1. Visual Cohort-College Management
- **Tab Location**: Admin Dashboard → Cohort System → Colleges Tab
- **Functionality**: 
  - View all active cohorts with their college assignments
  - Click on cohorts to see detailed college breakdown
  - Visual indicators for selected cohorts
  - Statistics for each cohort (colleges, interns, mentors, total users)

### 2. Individual College Assignment
- **Manual Assignment**: Select a cohort and manually assign/unassign colleges
- **Bulk Operations**: Assign multiple colleges to a cohort at once
- **Real-time Updates**: Changes reflect immediately in the UI

### 3. CSV/Excel Import System
- **Supported Formats**: CSV, Excel (.xlsx, .xls), and tab-separated files
- **Template Downloads**: Available in both CSV and Excel-compatible formats
- **File Upload**: Drag-and-drop or click to upload functionality
- **Manual Input**: Copy-paste CSV data directly into the interface

## Data Model

### Updated Cohort Schema
```javascript
{
  name: String,
  description: String,
  startDate: Date,
  endDate: Date,
  mentorId: ObjectId (ref: User),
  collegeId: ObjectId (ref: College), // NEW: Primary college association
  maxInterns: Number,
  currentInterns: Number,
  memberCount: Number,
  createdBy: String,
  isActive: Boolean
}
```

### User-Cohort-College Relationship
- Users have both `college` and `cohortId` fields
- Cohorts can have a primary `collegeId`
- Multiple colleges can have users in the same cohort

## API Endpoints

### 1. GET `/api/admin/cohorts-colleges`
**Purpose**: Fetch all cohorts with their college information
**Response**:
```javascript
{
  cohorts: [
    {
      _id: "cohort_id",
      name: "Cohort Name",
      description: "Description",
      colleges: [
        {
          college: { _id: "college_id", name: "College Name" },
          users: [...user_objects],
          interns: 5,
          mentors: 2,
          superMentors: 1
        }
      ],
      totalUsers: 8,
      totalInterns: 5,
      totalMentors: 2
    }
  ],
  colleges: [...all_colleges],
  total: 10
}
```

### 2. POST `/api/admin/cohorts-colleges`
**Purpose**: Assign/unassign colleges to/from cohorts
**Body**:
```javascript
{
  cohortId: "cohort_id",
  collegeIds: ["college_id1", "college_id2"],
  action: "assign" | "unassign"
}
```

### 3. GET `/api/admin/import-college-cohort`
**Purpose**: Get import template and available options
**Response**:
```javascript
{
  description: "CSV template for importing college-cohort assignments",
  headers: ["cohortName", "collegeName", "action"],
  sampleData: [...sample_rows],
  availableCohorts: [...cohort_names],
  availableColleges: [...college_names],
  validActions: ["assign", "unassign"],
  instructions: [...instruction_list]
}
```

### 4. POST `/api/admin/import-college-cohort`
**Purpose**: Bulk import college-cohort assignments
**Body**:
```javascript
{
  assignments: [
    {
      cohortName: "Summer Cohort 2024",
      collegeName: "ABC University",
      action: "assign"
    }
  ]
}
```

## Import File Format

### CSV Template
```csv
cohortName,collegeName,action
"Your Cohort Name Here","Your College Name Here","assign"
"Another Cohort Name","Another College Name","assign"  
"Example Cohort","Example College","unassign"
```

### Required Columns
- **cohortName**: Exact name of the cohort (case-sensitive)
- **collegeName**: Exact name of the college (case-sensitive)
- **action**: Either "assign" or "unassign"

### Import Rules
1. **assign**: Assigns all unassigned users from the college to the cohort
2. **unassign**: Removes all users from the college from the cohort
3. Case-sensitive matching for cohort and college names
4. Empty lines are skipped
5. Invalid entries are reported in results

## User Interface

### Main Cohorts View
- Grid layout showing all cohorts
- Click to select/deselect cohorts
- Visual indicators for selection
- Statistics cards for each cohort
- Preview of assigned colleges (first 3 shown)

### Selected Cohort Details
- Expanded view when cohort is selected
- Full list of colleges with user breakdowns
- Individual user listings per college
- Role-based statistics

### Import Modal
- File upload area (drag-and-drop)
- Manual text input option
- Template download buttons (CSV and Excel)
- Real-time import results
- Success/failure/skipped reporting

### Assignment Modal
- Checkbox list of all available colleges
- Assign/Unassign action buttons
- Real-time feedback on operations

## Usage Instructions

### 1. View Cohort Colleges
1. Navigate to Admin Dashboard
2. Click on "Cohort System" tab
3. Select "Colleges" sub-tab
4. Click on any cohort card to view details

### 2. Manual Assignment
1. Select a cohort by clicking on it
2. Click "Manage Colleges" button
3. Check/uncheck colleges to assign/unassign
4. Click "Assign" or "Unassign" button

### 3. Bulk Import
1. Click "Import CSV" button
2. Either:
   - Upload a CSV/Excel file, OR
   - Copy-paste CSV data into the text area
3. Download templates if needed
4. Click "Import" button
5. Review results and any errors

## File Templates

### Sample CSV Content
```csv
cohortName,collegeName,action
"Your Cohort Name Here","Your College Name Here","assign"
"Another Cohort Name","Another College Name","assign"
"Example Cohort","Example College","unassign"
```

### Excel Compatibility
- Tab-separated format for Excel import
- Can be opened in Excel and formatted using "Data > Text to Columns"
- Maintains compatibility with CSV parsers

## Error Handling

### Common Import Errors
- **Cohort not found**: Invalid cohort name
- **College not found**: Invalid college name
- **No users found**: College has no unassigned users (for assign action)
- **No assignments**: No users from college in cohort (for unassign action)

### Success Responses
- **Successful assignments**: Shows count and user details
- **Skipped operations**: Shows reason for skipping
- **Failed operations**: Shows specific error messages

## Technical Implementation

### Database Indexes
```javascript
// Added to Cohort schema
cohortSchema.index({ collegeId: 1 });
```

### Batch Operations
- Uses MongoDB transactions where applicable
- Updates cohort member counts automatically
- Tracks assignment history via `assignedBy` field

### Performance Considerations
- Populates related data efficiently
- Uses aggregation for statistics
- Pagination support for large datasets
- Optimized queries with proper indexing

## Security

### Authorization
- Requires admin or super-admin role
- Session validation on all endpoints
- CSRF protection via Next.js

### Data Validation
- Input sanitization for all fields
- Existence validation for cohorts and colleges
- Business logic validation (e.g., active status checks)

## Testing

### Test Cases
1. Successful assignment of college to cohort
2. Successful unassignment of college from cohort
3. Bulk import with mixed success/failure results
4. Template download functionality
5. File upload and parsing
6. Error handling for invalid data

### Import Templates
Available in `/public/` directory:
- `cohort-college-import-template.csv` - Clean CSV template
- `cohort-college-import-template.txt` - Excel-compatible template  
- `cohort-college-import-instructions.md` - Detailed instructions

## Future Enhancements

### Planned Features
1. **Excel Direct Import**: Native Excel file parsing
2. **Assignment History**: Track changes over time
3. **Notification System**: Alert relevant users of assignments
4. **Advanced Filtering**: Filter cohorts by college, date, etc.
5. **Export Functionality**: Download current assignments as reports
6. **Batch College Operations**: Create colleges during import
7. **Validation Preview**: Preview changes before applying

### Performance Improvements
1. **Caching**: Cache frequently accessed cohort-college data
2. **Background Processing**: Handle large imports asynchronously
3. **Real-time Updates**: WebSocket notifications for changes
4. **Audit Logging**: Comprehensive change tracking

## Troubleshooting

### Common Issues
1. **Import fails**: Check CSV format and required columns
2. **No colleges shown**: Verify college and cohort exist and are active
3. **Assignment doesn't work**: Check user permissions and data consistency
4. **File upload fails**: Verify file format and size limits

### Debug Information
- Check browser console for detailed error messages
- Review server logs for API errors
- Use the debug endpoint `/api/admin/debug-college-data` for data insights