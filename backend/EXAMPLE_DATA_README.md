# CRM System Example Data

This document explains how to populate your CRM system with realistic example data for testing and demonstration purposes.

## Quick Start

### Windows
Run the batch script:
```bash
cd backend
create_example_data.bat
```

### Linux/Mac
Run the Django management command:
```bash
cd backend
python manage.py create_example_data --clear
```

## What Data Gets Created

### 1. Users (5 users)
- **Admin User**: admin@example.com / admin123
- **Manager**: manager@example.com / password123  
- **Sales Team**: 
  - sales1@example.com / password123 (Mike Davis)
  - sales2@example.com / password123 (Emily Chen)
  - sales3@example.com / password123 (David Wilson)

### 2. Customers (6 customers)
Realistic customer data including:
- **TechCorp Solutions** (San Francisco, USA) - HIGH engagement, ACTIVE
- **InnovateTech Europe** (Paris, France) - MEDIUM engagement, PROSPECT
- **Future Corp Japan** (Tokyo, Japan) - VIP engagement, ACTIVE
- **Global Dynamics UAE** (Dubai, UAE) - HIGH engagement, LEAD
- **Startup Ventures Inc** (Austin, USA) - MEDIUM engagement, ACTIVE
- **LatinTech Mexico** (Mexico City, Mexico) - LOW engagement, INACTIVE

Each customer includes:
- Contact information (name, email, phone)
- Company details and website
- Geographic region and location
- Engagement level and status
- Assigned owner from the sales team
- Notes and last contact date

### 3. Sales Opportunities (6 sales)
- **Enterprise Software License** - $150,000 (NEGOTIATION)
- **Consulting Services** - $75,000 (PROPOSAL)
- **Premium Support Package** - $25,000 (WON)
- **Starter Package** - $35,000 (CONTACTED)
- **Custom Integration** - $20,000 (NEW)
- **Renewal Discussion** - $50,000 (LOST)

Each sale includes:
- Customer association
- Assigned sales representative
- Expected close dates
- Priority levels
- Detailed descriptions
- Sale notes and updates

### 4. Tasks (8 tasks)
Variety of task types with different:
- Due dates (past, present, future)
- Priority levels (High, Medium, Low)
- Status (Pending, In Progress, Completed, Overdue)
- Assignments to different team members
- Task comments for collaboration

### 5. Calendar Events (5 events)
Scheduled meetings and activities:
- **Demo meetings** with prospects
- **Follow-up calls** with customers
- **Contract review meetings**
- **Sales pipeline reviews**
- **Customer onboarding sessions**

Events include participants, locations, and are linked to customers/sales.

### 6. Notifications (4 notifications)
Sample notifications across categories:
- **Task notifications** (due date reminders)
- **Sales notifications** (new opportunities)
- **Customer notifications** (updates)
- **System notifications** (maintenance alerts)

### 7. Notification Categories & Preferences
- Pre-configured notification categories with icons and colors
- User notification preferences for each team member
- Email and in-app notification settings

### 8. Reports & Dashboard Widgets
#### Report Templates (3 templates)
- **Monthly Sales Performance** - Revenue and conversion metrics
- **Customer Engagement Report** - Engagement analysis by region
- **Task Completion Analysis** - Team productivity metrics

#### Dashboard Widgets (4 widgets)
- **Sales Pipeline** (Bar Chart) - Opportunities by status
- **Monthly Revenue** (Line Chart) - Revenue trends over time
- **Tasks Overview** (Donut Chart) - Task status distribution
- **Top Customers** (Table) - High-value customer list

#### User Dashboards
- Personalized dashboard for each user
- Widgets configured and positioned
- Auto-refresh settings

## Command Options

### Clear Existing Data
```bash
python manage.py create_example_data --clear
```
This will remove all existing example data before creating new data.

### Add to Existing Data
```bash
python manage.py create_example_data
```
This will add example data without clearing existing data (may create duplicates).

## Data Relationships

The example data is interconnected:
- **Customers** are assigned to **Users** (sales reps)
- **Sales** opportunities are linked to **Customers** and **Users**
- **Tasks** are assigned to **Users** and may relate to **Customers**
- **Calendar Events** can be associated with **Customers** and **Sales**
- **Notifications** are sent to **Users** about various activities
- **Reports** and **Dashboards** display aggregated data from all sections

## Use Cases

This example data is perfect for:
- **Testing** application functionality
- **Demonstrations** to stakeholders
- **Training** new team members
- **Development** of new features
- **Performance testing** with realistic data volume

## Security Note

The example users have simple passwords for testing purposes. In production:
- Use strong, unique passwords
- Enable password change requirements
- Configure proper authentication policies
- Set up appropriate user roles and permissions

## Customization

To modify the example data:
1. Edit `backend/customers/management/commands/create_example_data.py`
2. Modify the data dictionaries in each creation method
3. Adjust quantities, relationships, and content as needed
4. Run the command to apply changes

## Troubleshooting

If you encounter errors:
1. Ensure all Django migrations are applied: `python manage.py migrate`
2. Check that PostgreSQL is running and accessible
3. Verify all apps are installed and configured correctly
4. Review the command output for specific error messages

## Next Steps

After creating example data:
1. Log in with any of the provided user credentials
2. Explore different sections of the CRM
3. Test functionality with realistic data
4. Create additional custom data as needed
5. Set up proper backup procedures for your real data 