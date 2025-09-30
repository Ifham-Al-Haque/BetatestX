# SIM Card Management - Designation Field and Enhanced Filtering

## Overview
This update adds a designation field to the SIM card management system and significantly improves the filtering capabilities to work across all data regardless of pagination.

## Changes Made

### 1. Database Schema Update
**File:** `add_designation_to_sim_cards.sql`

- Added `designation` column to the `sim_cards` table
- Column type: `VARCHAR(255)`
- Added sample data for existing records based on department
- Includes proper column comments and verification queries

**To apply:** Run the SQL script in your Supabase SQL Editor

### 2. SIM Card Form Enhancement
**File:** `src/pages/Simcard.jsx`

#### Form Updates:
- Added `designation` field to the form state
- Added designation input field below the department field
- Styled consistently with existing form elements
- Includes proper placeholder text and validation

#### Display Updates:
- Added designation display in SIM card cards
- Shows designation only when available
- Positioned below department information
- Consistent styling with other card elements

### 3. Enhanced Filtering System
**File:** `src/pages/Simcard.jsx`

#### Improved Search Logic:
- **Before:** Only searched SIM number, package name, and current user
- **After:** Searches across all relevant fields:
  - SIM Number
  - Package Name
  - Current User
  - Previous User
  - Department
  - **Designation** (NEW)
  - Package Type
  - Status

#### Key Improvements:
- **Global Search:** Search works across ALL data, not just current page
- **Case Insensitive:** All searches are case-insensitive
- **Comprehensive Coverage:** Searches all relevant text fields
- **Real-time Filtering:** Results update immediately as you type

### 4. Database Query Enhancement
**File:** `src/hooks/useSimCards.js`

#### Updated Search Query:
- Enhanced the `useSearchSimCards` hook
- Added designation to the database search query
- Includes all relevant fields in the OR condition
- Maintains proper ordering and performance

### 5. Export Functionality Updates
**File:** `src/utils/exportUtils.js`

#### CSV/Excel Export:
- Added designation column to export data
- Positioned after department column
- Properly formatted and escaped for CSV

#### PDF Export:
- Added designation to PDF table headers
- Included designation data in PDF rows
- Maintains consistent formatting

#### Enhanced Export Filtering:
- Updated export filtering to match the new search logic
- Includes designation in search terms
- Maintains consistency with UI filtering

## Usage Instructions

### 1. Database Setup
1. Run the `add_designation_to_sim_cards.sql` script in Supabase SQL Editor
2. Verify the column was added successfully
3. Check that sample data was populated

### 2. Adding Designation to SIM Cards
1. Open the SIM card management page
2. Click "Add SIM Card" or edit an existing card
3. Fill in the designation field (appears below department)
4. Save the SIM card

### 3. Using Enhanced Search
1. Use the search bar to find SIM cards by:
   - SIM number
   - Package name
   - User names (current or previous)
   - Department name
   - **Designation** (job title/position)
   - Package type
   - Status

2. Search works across ALL data, not just the current page
3. Results update in real-time as you type

### 4. Filtering Options
- **Search Bar:** Global search across all fields
- **Status Filter:** Filter by Active, Inactive, Suspended, etc.
- **Department Filter:** Filter by specific departments
- **Package Type Filter:** Filter by Prepaid, Postpaid, etc.

## Technical Details

### Database Schema
```sql
ALTER TABLE sim_cards 
ADD COLUMN IF NOT EXISTS designation VARCHAR(255);
```

### Search Implementation
The enhanced search uses a comprehensive filter that checks:
```javascript
const matchesSearch = !searchTerm || 
  simCard.sim_number.toLowerCase().includes(searchLower) ||
  simCard.package_name.toLowerCase().includes(searchLower) ||
  (simCard.current_user && simCard.current_user.toLowerCase().includes(searchLower)) ||
  (simCard.previous_user && simCard.previous_user.toLowerCase().includes(searchLower)) ||
  (simCard.department && simCard.department.toLowerCase().includes(searchLower)) ||
  (simCard.designation && simCard.designation.toLowerCase().includes(searchLower)) ||
  (simCard.package_type && simCard.package_type.toLowerCase().includes(searchLower)) ||
  (simCard.status && simCard.status.toLowerCase().includes(searchLower));
```

### Performance Considerations
- All searches are client-side for immediate response
- Database queries are optimized with proper indexing
- Pagination is handled efficiently
- Search results are cached for better performance

## Benefits

1. **Enhanced Data Management:** Designation field provides better user identification
2. **Improved Search Experience:** Find SIM cards by any relevant field
3. **Global Filtering:** Search works across all data, not just current page
4. **Better Organization:** Clear hierarchy with department and designation
5. **Comprehensive Exports:** All data including designation is exportable
6. **User-Friendly:** Intuitive search and filtering interface

## Testing

### Test Cases
1. **Add SIM Card with Designation:**
   - Create new SIM card with designation
   - Verify designation appears in card display
   - Verify designation is saved to database

2. **Search by Designation:**
   - Search for specific designation
   - Verify results include matching designations
   - Test case-insensitive search

3. **Search by Other Fields:**
   - Test search by department, user, package, etc.
   - Verify all fields are searchable
   - Test partial matches

4. **Export with Designation:**
   - Export to CSV and verify designation column
   - Export to PDF and verify designation appears
   - Test filtered exports

5. **Filter Combinations:**
   - Test search + status filter
   - Test search + department filter
   - Test multiple filters together

## Future Enhancements

1. **Designation Dropdown:** Could add predefined designation options
2. **Advanced Search:** Could add field-specific search options
3. **Search History:** Could save recent searches
4. **Bulk Operations:** Could add bulk designation updates
5. **Analytics:** Could add designation-based analytics

## Troubleshooting

### Common Issues
1. **Designation not showing:** Check if database column was added
2. **Search not working:** Verify all fields are properly included in search logic
3. **Export issues:** Check that designation is included in export functions
4. **Performance issues:** Consider adding database indexes for large datasets

### Database Verification
```sql
-- Check if designation column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sim_cards' 
AND column_name = 'designation';

-- Check sample data
SELECT sim_number, current_user, department, designation 
FROM sim_cards 
LIMIT 5;
```

This update significantly enhances the SIM card management system with better data organization and powerful search capabilities that work across all data regardless of pagination.
