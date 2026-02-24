# Collection Department System - Architecture Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND APPLICATION                             │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Collections Page (Main UI)                    │   │
│  │                   src/pages/Collections.jsx                       │   │
│  │                                                                   │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │   │
│  │  │   Payment    │  │  Reminder    │  │  Checklist   │          │   │
│  │  │ Collection   │  │    System    │  │   Manager    │          │   │
│  │  │   Tab        │  │     Tab      │  │     Tab      │          │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘          │   │
│  │                                                                   │   │
│  │  ┌────────────────────────────────────────────────────┐         │   │
│  │  │           Statistics Dashboard                      │         │   │
│  │  │  • Total Outstanding  • Today's Reminders          │         │   │
│  │  │  • Total Collected    • Overdue Payments           │         │   │
│  │  └────────────────────────────────────────────────────┘         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    ↕                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                  Modal Components Layer                          │   │
│  │              src/components/CollectionModals.jsx                 │   │
│  │                                                                   │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │   │
│  │  │   Add    │  │  Record  │  │   Add    │  │   Add    │        │   │
│  │  │ Payment  │  │ Payment  │  │ Reminder │  │Checklist │        │   │
│  │  │  Modal   │  │  Modal   │  │  Modal   │  │  Modal   │        │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    ↕                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Service Layer (API)                           │   │
│  │               src/services/collectionService.js                  │   │
│  │                                                                   │   │
│  │  • Payment Operations      • Activity Logging                    │   │
│  │  • Reminder Management     • Settings Management                 │   │
│  │  • Checklist Operations    • Real-time Subscriptions             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕
                    ┌──────────────────────────┐
                    │   Supabase Client API    │
                    │   (Authentication &      │
                    │    WebSocket)            │
                    └──────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE BACKEND                                  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Database Layer (PostgreSQL)                   │   │
│  │                                                                   │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │   │
│  │  │  collection_   │  │  collection_   │  │  collection_   │    │   │
│  │  │   payments     │  │   reminders    │  │   checklist    │    │   │
│  │  │                │  │                │  │                │    │   │
│  │  │ • Customer     │  │ • Due dates    │  │ • Tasks        │    │   │
│  │  │ • Amounts      │  │ • Messages     │  │ • Priorities   │    │   │
│  │  │ • Status       │  │ • Assigned to  │  │ • Due dates    │    │   │
│  │  │ • Priority     │  │ • Status       │  │ • Categories   │    │   │
│  │  └────────────────┘  └────────────────┘  └────────────────┘    │   │
│  │                                                                   │   │
│  │  ┌────────────────┐  ┌──────────────────────────────────┐       │   │
│  │  │  collection_   │  │  collection_department_settings  │       │   │
│  │  │  activity_log  │  │                                  │       │   │
│  │  │                │  │ • Reminder timing                │       │   │
│  │  │ • All actions  │  │ • Working hours                  │       │   │
│  │  │ • Timestamps   │  │ • Notification prefs             │       │   │
│  │  │ • Outcomes     │  │ • Escalation rules               │       │   │
│  │  └────────────────┘  └──────────────────────────────────┘       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Database Triggers                             │   │
│  │                                                                   │   │
│  │  1. update_updated_at_column()                                   │   │
│  │     └─> Auto-updates timestamp on every change                   │   │
│  │                                                                   │   │
│  │  2. calculate_balance_remaining()                                │   │
│  │     └─> Auto-calculates balance and updates status              │   │
│  │                                                                   │   │
│  │  3. auto_create_payment_reminder()                               │   │
│  │     └─> Creates reminder when payment added                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Row Level Security (RLS)                      │   │
│  │                                                                   │   │
│  │  • SELECT: Authenticated users can view all data                 │   │
│  │  • INSERT: Authenticated users can create records                │   │
│  │  • UPDATE: Authenticated users can update records                │   │
│  │  • DELETE: Authenticated users can delete records                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Real-time Subscriptions                       │   │
│  │                                                                   │   │
│  │  • Payment changes → Broadcast to all clients                    │   │
│  │  • Reminder updates → Broadcast to all clients                   │   │
│  │  • Checklist changes → Broadcast to all clients                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Payment Creation Flow

```
User Action: Click "Add Payment"
           ↓
┌──────────────────────┐
│  AddPaymentModal     │ ← User fills form
│  Opens              │
└──────────────────────┘
           ↓
┌──────────────────────┐
│  Form Validation     │ ← Check required fields
└──────────────────────┘
           ↓
┌──────────────────────┐
│  collectionService   │ ← Call createPayment()
│  .createPayment()    │
└──────────────────────┘
           ↓
┌──────────────────────┐
│  Supabase Insert     │ ← Insert into collection_payments
└──────────────────────┘
           ↓
┌──────────────────────┐
│  Trigger Fires       │ ← auto_create_payment_reminder()
└──────────────────────┘
           ↓
┌──────────────────────┐
│  Reminder Created    │ ← Auto-created 3 days before
└──────────────────────┘
           ↓
┌──────────────────────┐
│  Real-time Broadcast │ ← WebSocket notification
└──────────────────────┘
           ↓
┌──────────────────────┐
│  UI Updates          │ ← Table refreshes automatically
│  Automatically       │
└──────────────────────┘
```

### 2. Record Payment Flow

```
User Action: Click $ icon on payment
           ↓
┌──────────────────────┐
│  RecordPaymentModal  │ ← Shows payment details
│  Opens               │
└──────────────────────┘
           ↓
┌──────────────────────┐
│  User Enters Amount  │ ← Amount & payment method
└──────────────────────┘
           ↓
┌──────────────────────┐
│  collectionService   │ ← Call recordPayment()
│  .recordPayment()    │
└──────────────────────┘
           ↓
┌──────────────────────┐
│  Update Payment      │ ← Update amount_paid
│  Record              │
└──────────────────────┘
           ↓
┌──────────────────────┐
│  Trigger Fires       │ ← calculate_balance_remaining()
└──────────────────────┘
           ↓
┌──────────────────────┐
│  Balance Calculated  │ ← New balance = total - paid
│  Status Updated      │    Status auto-updates
└──────────────────────┘
           ↓
┌──────────────────────┐
│  Activity Logged     │ ← Log in activity_log
└──────────────────────┘
           ↓
┌──────────────────────┐
│  Real-time Update    │ ← Broadcast changes
└──────────────────────┘
           ↓
┌──────────────────────┐
│  UI Refreshes        │ ← Table & stats update
└──────────────────────┘
```

### 3. Reminder System Flow

```
┌──────────────────────┐
│  Daily Cron Job      │ ← (Future: Scheduled function)
│  OR                  │
│  User Opens Page     │
└──────────────────────┘
           ↓
┌──────────────────────┐
│  getTodaysReminders()│ ← Query reminders for today
└──────────────────────┘
           ↓
┌──────────────────────┐
│  Display in          │ ← Show in red alert box
│  "Today's Reminders" │
└──────────────────────┘
           ↓
┌──────────────────────┐
│  Collection Staff    │ ← Contacts customer
│  Takes Action        │
└──────────────────────┘
           ↓
┌──────────────────────┐
│  Staff Clicks        │ ← Mark reminder as done
│  Acknowledge         │
└──────────────────────┘
           ↓
┌──────────────────────┐
│  acknowledgeReminder()│ ← Update status to 'acknowledged'
└──────────────────────┘
           ↓
┌──────────────────────┐
│  Action Logged       │ ← Save action_taken text
└──────────────────────┘
           ↓
┌──────────────────────┐
│  Reminder Hidden     │ ← No longer in pending list
│  from Today's List   │
└──────────────────────┘
```

### 4. Real-time Update Flow

```
┌──────────────────────┐
│  User A makes change │ ← Updates a payment
│  (Add, Update, etc)  │
└──────────────────────┘
           ↓
┌──────────────────────┐
│  Database Updated    │ ← Supabase PostgreSQL
└──────────────────────┘
           ↓
┌──────────────────────┐
│  Supabase Real-time  │ ← Detects change
│  Detects Change      │
└──────────────────────┘
           ↓
┌──────────────────────┐
│  WebSocket Broadcast │ ← Sends to all subscribers
└──────────────────────┘
           ↓
┌──────────────────────┬──────────────┬──────────────┐
│    User B            │   User C     │   User D     │
│  (Collection Staff)  │  (Manager)   │  (Staff)     │
└──────────────────────┴──────────────┴──────────────┘
           ↓                  ↓              ↓
┌──────────────────────┐  ┌────────────┐  ┌────────────┐
│  Subscription        │  │ Callback   │  │ Callback   │
│  Callback Triggered  │  │ Triggered  │  │ Triggered  │
└──────────────────────┘  └────────────┘  └────────────┘
           ↓                  ↓              ↓
┌──────────────────────┐  ┌────────────┐  ┌────────────┐
│  UI Auto-Updates     │  │ UI Updates │  │ UI Updates │
│  (No refresh needed) │  │            │  │            │
└──────────────────────┘  └────────────┘  └────────────┘
```

---

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Collections.jsx                          │
│                    (Main Container)                         │
│                                                             │
│  State Management:                                          │
│  • payments, reminders, checklist                          │
│  • loading, activeTab                                       │
│  • modal visibility flags                                   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Tab Navigation                           │  │
│  │  [Payments] [Reminders] [Checklist]                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                      ↓                                      │
│  ┌──────────────────┬──────────────────┬────────────────┐  │
│  │                  │                  │                │  │
│  │ PaymentSection   │ RemindersSection │ ChecklistSection│ │
│  │                  │                  │                │  │
│  │ Props:           │ Props:           │ Props:         │  │
│  │ • payments       │ • reminders      │ • checklist    │  │
│  │ • onAdd          │ • onAcknowledge  │ • onComplete   │  │
│  │ • onRecord       │ • onAdd          │ • onAdd        │  │
│  │ • filters        │ • search         │ • search       │  │
│  │                  │                  │                │  │
│  └──────────────────┴──────────────────┴────────────────┘  │
│                      ↓                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Modal Layer (Conditional Render)         │  │
│  │                                                       │  │
│  │  • AddPaymentModal (if showAddPaymentModal)          │  │
│  │  • RecordPaymentModal (if showRecordPaymentModal)    │  │
│  │  • AddReminderModal (if showAddReminderModal)        │  │
│  │  • AddChecklistModal (if showAddChecklistModal)      │  │
│  └──────────────────────────────────────────────────────┘  │
│                      ↓                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Service Layer Calls                           │  │
│  │                                                       │  │
│  │  collectionService.createPayment()                    │  │
│  │  collectionService.recordPayment()                    │  │
│  │  collectionService.createReminder()                   │  │
│  │  collectionService.createChecklistItem()              │  │
│  │  collectionService.subscribeToPayments()              │  │
│  │  collectionService.subscribeToReminders()             │  │
│  │  collectionService.subscribeToChecklist()             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Relationships

```
┌─────────────────────────┐
│  fleet_rental_          │
│  agreements             │
│                         │
│  • id (PK)              │
│  • customer_name        │
│  • total_amount         │
│  • rental_start_date    │
└────────────┬────────────┘
             │
             │ (Foreign Key)
             ↓
┌─────────────────────────┐
│  collection_            │
│  payments               │
│                         │         ┌─────────────────────┐
│  • id (PK)              │◄────────┤  collection_        │
│  • rental_agreement_id  │         │  reminders          │
│  • customer_name        │         │                     │
│  • payment_amount       │         │  • payment_id (FK)  │
│  • balance_remaining    │         │  • reminder_date    │
│  • payment_status       │         │  • reminder_status  │
│  • collection_priority  │         └─────────────────────┘
└────────────┬────────────┘
             │                      ┌─────────────────────┐
             ├──────────────────────┤  collection_        │
             │                      │  checklist          │
             │                      │                     │
             │                      │  • payment_id (FK)  │
             │                      │  • checklist_title  │
             │                      │  • status           │
             │                      └─────────────────────┘
             │
             │                      ┌─────────────────────┐
             └──────────────────────┤  collection_        │
                                    │  activity_log       │
                                    │                     │
                                    │  • payment_id (FK)  │
                                    │  • activity_type    │
                                    │  • outcome          │
                                    └─────────────────────┘
```

---

## State Management Flow

```
┌─────────────────────────────────────────────────────────┐
│                  React Component State                  │
│                                                         │
│  useState hooks:                                        │
│  • [payments, setPayments]                             │
│  • [reminders, setReminders]                           │
│  • [checklist, setChecklist]                           │
│  • [loading, setLoading]                               │
│  • [activeTab, setActiveTab]                           │
└─────────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────────┐
│              useEffect Lifecycle Hooks                  │
│                                                         │
│  • On Mount: Load all data                             │
│  • Subscribe to real-time updates                      │
│  • On Unmount: Cleanup subscriptions                   │
└─────────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────────┐
│                 Service Layer Methods                   │
│                                                         │
│  • Fetch data from Supabase                            │
│  • Update state with fetched data                      │
│  • Handle errors                                        │
└─────────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────────┐
│                  Real-time Callbacks                    │
│                                                         │
│  • On payment change → reload payments                 │
│  • On reminder change → reload reminders               │
│  • On checklist change → reload checklist              │
└─────────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────────┐
│                    UI Re-renders                        │
│                                                         │
│  • State update triggers re-render                     │
│  • Virtual DOM diff                                     │
│  • Only changed components update                      │
└─────────────────────────────────────────────────────────┘
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                      │
│                                                         │
│  • User Authentication (via AuthContext)                │
│  • JWT Token stored                                     │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ↓ (Include JWT in requests)
┌─────────────────────────────────────────────────────────┐
│                   Supabase Edge                         │
│                                                         │
│  • Validate JWT Token                                   │
│  • Check user authentication                            │
│  • Apply RLS policies                                   │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ↓ (If authorized)
┌─────────────────────────────────────────────────────────┐
│                 PostgreSQL Database                     │
│                                                         │
│  Row Level Security (RLS):                             │
│  ┌───────────────────────────────────────────────────┐ │
│  │  SELECT: WHERE user is authenticated              │ │
│  │  INSERT: WITH CHECK user is authenticated         │ │
│  │  UPDATE: WHERE user is authenticated              │ │
│  │  DELETE: WHERE user is authenticated              │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  Future Enhancement: Role-based access                 │
│  ┌───────────────────────────────────────────────────┐ │
│  │  Managers: Full access                            │ │
│  │  Collection Staff: Read/Write own assigned        │ │
│  │  Viewers: Read-only                               │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND STACK                       │
│                                                         │
│  • React 18+           - UI Framework                   │
│  • Framer Motion       - Animations                     │
│  • Lucide React        - Icon Library                   │
│  • Tailwind CSS        - Styling                        │
│  • React Hooks         - State Management               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    BACKEND STACK                        │
│                                                         │
│  • Supabase            - Backend as a Service           │
│  • PostgreSQL 15       - Database                       │
│  • PostgREST           - RESTful API                    │
│  • pg_triggers         - Database Triggers              │
│  • Realtime            - WebSocket Server               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   SECURITY STACK                        │
│                                                         │
│  • Supabase Auth       - Authentication                 │
│  • JWT Tokens          - Authorization                  │
│  • Row Level Security  - Data Access Control            │
│  • HTTPS/WSS           - Encrypted Transport            │
└─────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      USERS                              │
│                                                         │
│  Collection Staff → Managers → Administrators           │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ↓ (HTTPS)
┌─────────────────────────────────────────────────────────┐
│                   CDN / Hosting                         │
│                  (Vercel, Netlify, etc)                 │
│                                                         │
│  • Static React Build                                   │
│  • Global Edge Network                                  │
│  • SSL Certificate                                      │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ↓ (API Calls)
┌─────────────────────────────────────────────────────────┐
│                   Supabase Cloud                        │
│                                                         │
│  ┌────────────────────────────────────────────────┐    │
│  │  API Layer (PostgREST)                         │    │
│  └────────────────────────────────────────────────┘    │
│                        ↕                                │
│  ┌────────────────────────────────────────────────┐    │
│  │  Database (PostgreSQL)                         │    │
│  │  • Multi-zone replication                      │    │
│  │  • Automated backups                           │    │
│  │  • Point-in-time recovery                      │    │
│  └────────────────────────────────────────────────┘    │
│                        ↕                                │
│  ┌────────────────────────────────────────────────┐    │
│  │  Realtime Server                               │    │
│  │  • WebSocket connections                       │    │
│  │  • Change data capture                         │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

This architecture provides:
- ✅ **Scalability** - Can handle growing data and users
- ✅ **Performance** - Optimized with indexes and caching
- ✅ **Security** - Multi-layer security approach
- ✅ **Real-time** - Instant updates across all users
- ✅ **Maintainability** - Clean separation of concerns
- ✅ **Extensibility** - Easy to add new features

---

**Version**: 1.0.0  
**Last Updated**: October 10, 2025

