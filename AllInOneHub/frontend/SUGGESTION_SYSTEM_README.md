# Suggestion System Implementation

## Overview
The suggestion system has been implemented to allow users to share ideas and feedback for improving the organization. Unlike the complaints system, suggestions can be either general (visible to all users) or user-specific (visible only to the target user).

## Features

### 1. User-Specific Suggestions
- Users can submit suggestions targeted at specific individuals
- Only the target user can see these suggestions
- Useful for providing feedback to colleagues or managers

### 2. General Suggestions
- Suggestions visible to all users in the system
- Promotes collaboration and idea sharing across departments
- Allows users to see what others are thinking about

### 3. Role-Based Access Control
- **Employees**: Can see their own suggestions, suggestions targeted at them, and general suggestions
- **Managers/HR/CS Managers**: Can see all suggestions and manage their status
- **Admins**: Full access to all suggestions and management features

### 4. Voting System
- Users can upvote or downvote suggestions
- Helps prioritize ideas and gather community feedback
- Anonymous voting to encourage honest feedback

### 5. Anonymous Submissions
- Users can submit suggestions anonymously
- Protects users who want to share sensitive feedback
- Maintains privacy while encouraging honest input

## Database Schema

### Tables Created

#### 1. `suggestions` Table
```sql
CREATE TABLE suggestions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'medium',
    status VARCHAR(50) NOT NULL DEFAULT 'open',
    suggestion_type VARCHAR(50) NOT NULL DEFAULT 'general',
    target_user_id UUID REFERENCES auth.users(id),
    target_user_name VARCHAR(255),
    suggester_id UUID NOT NULL REFERENCES auth.users(id),
    suggester_name VARCHAR(255) NOT NULL,
    anonymous BOOLEAN DEFAULT FALSE,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    assigned_to UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE,
    implemented_at TIMESTAMP WITH TIME ZONE,
    implementation_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. `suggestion_categories` Table
```sql
CREATE TABLE suggestion_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(20) DEFAULT 'blue',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Default Categories
- Process Improvement
- Technology
- Communication
- Work Environment
- Training & Development
- Customer Service
- Safety & Security
- Other

## API Endpoints

### Suggestions API (`src/services/suggestionsApi.js`)

#### Core Operations
- `createSuggestion(suggestionData)` - Create new suggestion
- `getSuggestions(userId, userRole)` - Get suggestions with role-based filtering
- `getSuggestionsWithFilters(filters, userId, userRole)` - Get filtered suggestions
- `updateSuggestion(suggestionId, updateData)` - Update suggestion
- `deleteSuggestion(suggestionId)` - Delete suggestion

#### Management Operations
- `updateSuggestionStatus(suggestionId, newStatus)` - Update suggestion status
- `upvoteSuggestion(suggestionId)` - Upvote a suggestion
- `downvoteSuggestion(suggestionId)` - Downvote a suggestion

#### Utility Operations
- `getSuggestionCategories()` - Get all categories
- `getSuggestionStatistics()` - Get suggestion statistics
- `getUsersForTargeting()` - Get users for targeting suggestions

## Components

### 1. Suggestions Page (`src/pages/Suggestions.jsx`)
- Full suggestion management interface
- Create, edit, delete suggestions
- Filter and search suggestions
- Status management for managers/admins
- Voting functionality

### 2. Welcome Page Enhancement (`src/pages/Welcome.jsx`)
- Quick suggestion submission form
- Recent suggestions display
- User details display (Department, Position, Role)
- Quick navigation to suggestions

## User Interface Features

### Suggestion Form
- Title and description fields
- Category and priority selection
- Suggestion type selection (General vs User-Specific)
- Target user selection for user-specific suggestions
- Anonymous submission option

### Suggestion Display
- Priority and status badges
- Suggestion type indicators (Globe for general, Target for user-specific)
- Voting buttons with counts
- Action buttons for editing/deleting
- Status management for authorized users

### Filtering and Search
- Status filtering (Open, In Progress, Implemented, Closed)
- Priority filtering (Low, Medium, High, Urgent)
- Category filtering
- Suggestion type filtering
- Text search across title and description

## Security Features

### Row Level Security (RLS)
- Users can only see their own suggestions
- Users can see suggestions targeted at them
- Users can see general suggestions
- Admins and managers can see all suggestions

### Role-Based Permissions
- **Employees**: Create, view, edit, delete own suggestions
- **Managers/HR/CS Managers**: Full access to all suggestions
- **Admins**: Full system access

## Integration Points

### 1. Navigation
- Added to sidebar navigation for relevant roles
- Quick access from Welcome page
- Integrated with role-based navigation system

### 2. User Management
- Integrates with existing user authentication system
- Uses user profiles for department and position information
- Supports user targeting for specific suggestions

### 3. Toast Notifications
- Success/error messages for all operations
- User feedback for form submissions
- Status update confirmations

## Usage Examples

### Submitting a General Suggestion
1. Navigate to Suggestions page or use Welcome page form
2. Select "General" suggestion type
3. Choose category and priority
4. Fill in title and description
5. Submit (visible to all users)

### Submitting a User-Specific Suggestion
1. Select "User Specific" suggestion type
2. Choose target user from dropdown
3. Fill in suggestion details
4. Submit (visible only to target user)

### Managing Suggestions (Managers/Admins)
1. View all suggestions in the system
2. Update status (Open → In Progress → Implemented)
3. Assign suggestions to team members
4. Add implementation notes
5. Monitor voting and community feedback

## Future Enhancements

### Potential Features
- Suggestion templates for common feedback types
- Automated suggestion routing based on category
- Integration with project management tools
- Suggestion analytics and reporting
- Email notifications for targeted suggestions
- Suggestion collaboration and comments
- Suggestion impact tracking

### Performance Optimizations
- Pagination for large suggestion lists
- Real-time updates using WebSockets
- Caching for frequently accessed data
- Search indexing for better performance

## Setup Instructions

### 1. Database Setup
```bash
# Run the SQL script to create tables
psql -d your_database -f create_suggestions_table.sql
```

### 2. Frontend Integration
- Ensure all components are properly imported
- Add Suggestions route to App.js
- Update navigation components
- Test role-based access control

### 3. Testing
- Test suggestion creation for different user types
- Verify role-based visibility rules
- Test voting functionality
- Validate form validation and error handling

## Troubleshooting

### Common Issues
1. **Suggestions not visible**: Check user role and RLS policies
2. **Form submission errors**: Verify database connection and table structure
3. **Voting not working**: Check API endpoint permissions
4. **Navigation missing**: Verify role-based navigation configuration

### Debug Information
- Check browser console for JavaScript errors
- Verify database queries and RLS policies
- Test API endpoints directly
- Check user role and permissions

## Conclusion

The suggestion system provides a comprehensive platform for organizational feedback and idea sharing. It balances transparency with privacy, allowing both general collaboration and targeted feedback. The role-based access control ensures appropriate visibility while maintaining security and user privacy.

The system is designed to be scalable and can be extended with additional features as organizational needs evolve.
