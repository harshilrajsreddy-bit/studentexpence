# Student SpendSense — Smart Student Expense & Pocket Money Manager

A full-stack web application designed specifically for college students to manage pocket money, track daily canteen and commute expenses, set category budgets, receive early overspending threshold warnings, and project remaining cash runway using the **Pocket Money Survival Predictor**.

---

## 1. Executive Summary & Problem Solved

College students face unique financial challenges:
- **Small daily leaks**: Frequent canteen chai, snacks, auto-rickshaw rides, and printouts drain monthly allowances without notice.
- **Runway blindness**: Students rarely know whether remaining cash will survive until the next pocket-money date.
- **Budget overshoots**: Lack of real-time category alerts leads to mid-month exhaustion.
- **Savings friction**: Stashing money for laptops or semester trips is neglected due to lack of incremental milestone targets.

**Student SpendSense** solves this with an algorithmic burn-rate model that computes safe daily spending limits and forecasts runway end dates, backed by a persistent relational database architecture and Row Level Security (RLS).

---

## 2. Technology Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, Lucide React, Recharts.
- **Backend**: Node.js, Express.js REST API, JSON Web Tokens (JWT), Bcrypt password encryption.
- **Data Persistence**:
  - **Temporary Storage Engine**: Volatile in-memory storage (RAM + OS temp directory) for instant guest exploration, privacy, and zero disk residue.
  - **Cloud Production**: Supabase PostgreSQL schemas with Row Level Security (RLS) policies (`supabase/migrations/20261026_init.sql`).
- **Validation**: Zod schema validation on client and server.
- **Date Arithmetic**: date-fns and standard ISO-8601 UTC date indexing.

---

## 3. Core Features Implemented

### 1. Main Dashboard
- **5 Core Summary Cards**:
  1. Total pocket money received this month
  2. Total expenses incurred this month
  3. Current available balance (liquid funds)
  4. Net amount saved this month
  5. Monthly budget usage percentage
- **Daily Spending Rhythm**: Recharts line chart illustrating daily outlays across the month.
- **Category Distribution**: Recharts doughnut chart illustrating expense share.
- **Budget Progress Bars**: Real-time progress with status color codes.
- **Recent Transactions Ledger**: Quick view of recent 5 transactions.
- **Automated Threshold Warnings**: Warning triggers at 75%, 90%, and 100% capacity.

### 2. Signature Feature: Pocket Money Survival Predictor
- Analyzes historical student expenses over a configurable window (14, 30, 45, or 60 days).
- Excludes income deposits and future-dated transactions from burn rate.
- **Mathematical Formula**:
  $$\text{BurnRate}_{\text{daily}} = \frac{\text{Eligible Expenses in Period}}{\text{Days in Period}}$$
  $$\text{Runway}_{\text{days}} = \left\lfloor\frac{\text{Available Balance}}{\text{BurnRate}_{\text{daily}}}\right\rfloor$$
  $$\text{NextDateBalance} = \text{Available Balance} - (\text{BurnRate}_{\text{daily}} \times \text{DaysUntilNextDate})$$
  $$\text{SuggestedDailyCap} = \max\left(0, \frac{\text{Available Balance}}{\text{DaysUntilNextDate}}\right)$$
- **Shortfall Warning**: Triggers critical deficit alerts if projected balance is negative.
- **Zero-Division Safeguards**: Gracefully reports insufficient historical data if no expenses exist.
- **Interactive What-If Simulator**: Real-time slider enabling students to simulate custom daily budgets and observe runway impact.

### 3. Expense and Income Ledger
- Full CRUD: Add, edit, and delete transactions.
- Fields: Amount, Type (Income/Expense), Category, Description, Date, Payment Method (UPI, Cash, Card, Bank Transfer), Notes.
- Search by description and notes.
- Filtering by type, category, and date range.
- Sorting by date and amount (ascending/descending).
- Pagination for large records.
- **1-Click CSV Export**: Downloads CSV file strictly scoped to the authenticated user.

### 4. Smart Budget Manager
- Configure overall monthly pocket money cap.
- Set individual category spending limits (Food & snacks, Transportation, College expenses, Shopping, Entertainment, etc.).
- Color-coded alert tags: Safe (<75%), Caution (75%–89%), Warning (90%–99%), Exceeded (≥100%).
- Month selector for historical audit.

### 5. Savings Goals
- Goal creation (e.g., Coding Laptop, Semester Trip, Emergency Fund).
- Target amount, saved amount, deadline date, and status.
- Automated suggested monthly contribution based on deadline distance.
- Direct Deposit / Withdraw contribution modal.
- Separate archive for completed milestones.

### 6. Spending Insights & Habit Analytics
- Primary expense drain category with percentage share.
- Daily average spending for current month.
- Most expensive single purchase.
- **Weekday vs Weekend Spending Comparison**: Quantifies student weekend dining and entertainment surge.
- **Month-over-Month Trend**: Comparative percentage change against previous month.
- Transparent rule-based savings tips.

### 7. Reports & Print-Friendly Statement
- Printable monthly statement with `@media print` layout.
- Category summary breakdown table with percentage allocations.
- Full ledger transactions with signature/archive blocks.

### 8. Authentication & Presentation Demo Mode
- Sign up with name, email, password, and pocket money preferences.
- Secure JWT sessions with password hashing.
- **1-Click Demo Account**: Instant evaluation access as **Aarav Sharma** (preloaded with 30+ transactions across 30 days).
- **Reset Demo Dataset**: Instant reset button in Profile for repeatable viva demonstrations.

---

## 4. API Endpoints Documentation

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/auth/register` | Create a new student account | No |
| POST | `/api/auth/login` | Sign in with email and password | No |
| POST | `/api/auth/demo-login` | Instant demo login as Aarav Sharma | No |
| GET | `/api/auth/me` | Fetch active user profile | Yes |
| PUT | `/api/auth/profile` | Update user allowance preferences | Yes |
| GET | `/api/transactions` | Query and filter transactions | Yes |
| POST | `/api/transactions` | Record new income or expense | Yes |
| PUT | `/api/transactions/:id` | Update transaction record | Yes |
| DELETE | `/api/transactions/:id` | Delete transaction record | Yes |
| GET | `/api/transactions/export/csv` | Export filtered records to CSV | Yes |
| GET | `/api/budgets` | Fetch monthly category limits & actual spend | Yes |
| POST | `/api/budgets` | Set or update monthly budget limit | Yes |
| DELETE | `/api/budgets/:id` | Remove category budget | Yes |
| GET | `/api/savings-goals` | Fetch active and completed goals | Yes |
| POST | `/api/savings-goals` | Create new savings goal | Yes |
| PUT | `/api/savings-goals/:id` | Update savings goal | Yes |
| POST | `/api/savings-goals/:id/contribute` | Deposit or withdraw savings funds | Yes |
| DELETE | `/api/savings-goals/:id` | Delete savings goal | Yes |
| GET | `/api/analytics/dashboard` | Dashboard summary cards & charts | Yes |
| GET | `/api/analytics/survival` | Pocket Money Survival Predictor data | Yes |
| GET | `/api/analytics/insights` | Habit analytics & weekday vs weekend | Yes |
| GET | `/api/analytics/report` | Monthly report statement | Yes |
| GET | `/api/system/status` | System health & Supabase readiness | No |
| POST | `/api/system/reset-demo` | Re-seed demo dataset | No |

---

## 5. Local Setup & Running Instructions

### Prerequisites
- Node.js v18 or later
- npm v9 or later

### Installation
1. Clone the repository and navigate into the app directory:
   ```bash
   cd student-spendsense
   npm install
   ```

2. Configure environment variables (optional for local run, as zero-config engine defaults are included):
   ```bash
   cp .env.example .env
   ```

3. Start the full-stack development server:
   ```bash
   npm run dev
   ```
   The application will start on `http://localhost:3000`.

4. Build for production:
   ```bash
   npm run build
   npm start
   ```

---

## 6. Supabase PostgreSQL Cloud Deployment

To deploy the database schema to a Supabase PostgreSQL instance:
1. Create a new project in the [Supabase Dashboard](https://supabase.com).
2. Open the **SQL Editor** in Supabase.
3. Paste and run the contents of `supabase/migrations/20261026_init.sql`.
4. (Optional) Run `supabase/seed.sql` to populate sample student data in Supabase.
5. In `.env`, set:
   ```env
   SUPABASE_URL="https://<your-project-ref>.supabase.co"
   SUPABASE_ANON_KEY="<your-anon-key>"
   SUPABASE_SERVICE_ROLE_KEY="<your-service-key>"
   ```

---

## 7. College Project Viva Q&A Reference

1. **How is data isolation enforced between students?**
   - Every transaction, budget, and savings goal contains a `user_id` foreign key.
   - On the Express server, `authenticate` middleware decodes the JWT and binds `req.user.id`. Queries filter by `user_id = req.user.id`.
   - In Supabase PostgreSQL, Row Level Security (RLS) is enabled (`USING (auth.uid() = user_id)`), preventing unauthorized database queries.

2. **Why is the Survival Predictor more effective than simple budget bars?**
   - Budget bars only tell you what percentage of your limit is consumed. They do not tell you **when** you will run out of money.
   - The Survival Predictor factors in **time**: days remaining until allowance day, burn rate, and projected end-of-month balance, providing an actionable daily cap.

3. **How does the system prevent floating-point calculation discrepancies?**
   - Amounts are rounded to 2 decimal places using numeric formatting. In the PostgreSQL schema, columns are defined as `NUMERIC(12, 2)` instead of floating-point types (`REAL`/`DOUBLE PRECISION`).
