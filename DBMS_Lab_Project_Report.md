# DBMS Lab Project Report

---

## Project Title
**FraudGuard - Online Fraud Management System**

---

## Team Information

| Name | ID Number |
|------|-----------|
| [Team Member 1 Name] | [ID Number] |
| [Team Member 2 Name] | [ID Number] |
| [Team Member 3 Name] | [ID Number] |

*(Please fill in your team member details)*

---

## Video Demonstration Link
**YouTube:** [Insert YouTube Link Here] *(Optional)*

---

## Project Code Link
**GitHub Repository:** [Insert GitHub Link Here] *(Recommended)*

---

# Main Body

---

## 1. Introduction / Overview

FraudGuard is a comprehensive **Online Fraud Management System** designed to detect, investigate, and resolve fraud cases in financial institutions and organizations. The system provides a centralized platform for managing fraud cases from detection to resolution with complete audit trails.

### Key Capabilities:
- **Real-time fraud detection** with automated risk scoring
- **Multi-role access control** (Admin, Investigator, Auditor, Customer)
- **Case management workflow** with status tracking
- **Evidence file management** with secure storage
- **Transaction monitoring** across multiple payment channels
- **Analytics dashboard** with KPIs and fraud hotspot analysis
- **Real-time notifications** for new cases and assignments

The system is built using modern web technologies with a React frontend and a PostgreSQL database backend (Supabase), implementing enterprise-grade security with Row-Level Security (RLS) policies.

---

## 2. Motivation

### Problem Statement
Financial fraud is a growing concern in the digital economy. Organizations face challenges in:
- Detecting fraudulent transactions quickly
- Managing and tracking fraud cases efficiently
- Coordinating between investigators and administrators
- Maintaining comprehensive audit trails for compliance
- Providing customers visibility into their case status

### Why This Project?
1. **Real-world relevance**: Fraud management is critical for banks, e-commerce platforms, and financial institutions
2. **Complex database design**: Involves multiple entities, relationships, and security policies
3. **Role-based access control**: Demonstrates advanced RLS implementation
4. **Practical application**: Showcases CRUD operations, triggers, functions, and views
5. **Academic value**: Covers normalization, ER diagrams, SQL queries, and database optimization

---

## 3. Related or Similar Projects

| System | Description | Limitations Addressed by FraudGuard |
|--------|-------------|-------------------------------------|
| **FICO Falcon** | Commercial fraud detection platform | Complex, expensive, not customizable |
| **Feedzai** | AI-powered fraud prevention | Requires ML expertise, costly |
| **SAS Fraud Management** | Enterprise fraud solution | Heavy infrastructure needs |
| **Custom Excel/Sheets** | Manual tracking | No automation, no security, no audit trail |

### FraudGuard Advantages:
- Open-source friendly technology stack
- Role-based access built-in
- Customizable fraud rules
- Real-time notifications
- Evidence management
- Complete audit logging

---

## 4. Benchmark Analysis

| Feature | FraudGuard | Traditional Systems |
|---------|------------|---------------------|
| Real-time Detection | ✅ Yes | ⚠️ Limited |
| Role-based Access | ✅ 4 roles (Admin, Investigator, Auditor, Customer) | ⚠️ Basic |
| Evidence Upload | ✅ Supabase Storage | ❌ Often missing |
| Audit Logging | ✅ Automatic triggers | ⚠️ Manual |
| Customer Portal | ✅ Case status visibility | ❌ Rarely available |
| Real-time Notifications | ✅ WebSocket-based | ❌ Email only |
| Risk Scoring | ✅ Rule-based automatic | ⚠️ Manual review |
| Multi-channel Support | ✅ 6 channels (BKASH, NAGAD, CARD, BANK, CASH, OTHER) | ⚠️ Limited |

---

## 5. Complete Feature List

### 5.1 Authentication & Authorization
- ✅ User registration and login (email-based)
- ✅ Role-based access control (RBAC)
- ✅ Session management
- ✅ Password security
- ✅ Account lockout after failed attempts

### 5.2 Dashboard
- ✅ Role-specific dashboards (Admin, Investigator, Auditor, Customer)
- ✅ KPI metrics (Total Cases, Open Cases, Closure Rate, Avg Close Time)
- ✅ Recent cases overview
- ✅ Decision status overview (Draft, Final, Communicated)
- ✅ Quick navigation links

### 5.3 Case Management
- ✅ Create new fraud case
- ✅ View case details
- ✅ Update case status (OPEN → UNDER_INVESTIGATION → CLOSED)
- ✅ Case categorization (Payment Fraud, Identity Theft, Account Takeover, Scam, Other)
- ✅ Severity levels (LOW, MEDIUM, HIGH)
- ✅ Case search and filtering
- ✅ Case history tracking

### 5.4 Transaction Monitoring
- ✅ Transaction as evidence (linked to cases)
- ✅ Multi-channel support (BKASH, NAGAD, CARD, BANK, CASH, OTHER)
- ✅ Risk score calculation
- ✅ Risk level classification (LOW, MEDIUM, HIGH)
- ✅ Suspicious transaction flagging

### 5.5 Investigation Workflow
- ✅ Case assignment to investigators
- ✅ Investigator availability tracking
- ✅ Assignment notes
- ✅ Status update with comments
- ✅ Investigation history logging

### 5.6 Evidence Management
- ✅ File upload (Screenshots, PDFs, Transaction Logs)
- ✅ Secure storage (Supabase Storage)
- ✅ Evidence notes
- ✅ File download capability

### 5.7 Feedback System
- ✅ Investigator feedback on cases
- ✅ Feedback categories (Confirmed Fraud, False Positive, Requires More Info, Escalate, Under Review)
- ✅ Approval status tracking (Pending, Approved, Rejected, Escalated)

### 5.8 Decision Management
- ✅ Admin case decisions
- ✅ Decision categories (Fraud Confirmed, Cleared, Partial Fraud, Investigation Ongoing, etc.)
- ✅ Decision status workflow (Draft → Final → Communicated)
- ✅ Customer message for communication
- ✅ Internal notes for admin

### 5.9 Analytics & Reporting
- ✅ Fraud Hotspots by Location
- ✅ Channel-wise Suspicious Ranking
- ✅ Users with Multiple Cases
- ✅ Channel Severity Analysis
- ✅ Date-based filtering

### 5.10 User Management (Admin Only)
- ✅ View all users
- ✅ User role management
- ✅ Account status (Active/Inactive)
- ✅ Account lock/unlock

### 5.11 Real-time Features
- ✅ Real-time notifications for Admins (new case created)
- ✅ Real-time notifications for Investigators (case assigned)
- ✅ WebSocket-based updates

### 5.12 Additional Features
- ✅ Query Debugger (SQL execution tool for admins)
- ✅ Database Schema Viewer
- ✅ Chat Assistance
- ✅ Comprehensive documentation pages

---

## 6. Database Design Approach

### Design Methodology
We followed a **top-down approach** combined with **normalization** principles:

1. **Requirements Analysis**: Identified entities from user stories
2. **Conceptual Design**: Created ER diagram
3. **Logical Design**: Normalized to 3NF/BCNF
4. **Physical Design**: Implemented in PostgreSQL with indexes and constraints

### Normalization
All tables are normalized to **Third Normal Form (3NF)**:
- **1NF**: All columns contain atomic values
- **2NF**: All non-key columns depend on the entire primary key
- **3NF**: No transitive dependencies

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Separate `users`, `customers`, `investigators` tables | Different roles have different attributes |
| `case_transactions` junction table | Many-to-many relationship between cases and transactions |
| `case_history` table | Audit trail for status changes |
| `audit_log` table | Generic audit logging for all tables |
| Views for sensitive data | `users_safe`, `customers_safe` hide password hash |
| SECURITY DEFINER functions | Bypass RLS for internal operations |

---

## 7. Entity–Relationship Diagram (ERD)

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                  FraudGuard ERD                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘

                                    ┌─────────────┐
                                    │    roles    │
                                    ├─────────────┤
                                    │ role_id (PK)│
                                    │ role_name   │
                                    └──────┬──────┘
                                           │1
                                           │
                                           │M
                                    ┌──────┴──────┐
                                    │    users    │
                                    ├─────────────┤
                                    │ user_id (PK)│
                                    │ role_id (FK)│
                                    │ email       │
                                    │ full_name   │
                                    │ phone       │
                                    │ is_active   │
                                    │ is_locked   │
                                    └──────┬──────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │1                     │1                     │1
                    ▼                      ▼                      ▼
            ┌───────────────┐      ┌──────────────┐      ┌───────────────┐
            │   customers   │      │ investigators│      │ login_attempts│
            ├───────────────┤      ├──────────────┤      ├───────────────┤
            │customer_id(PK)│      │investigator_id│     │ attempt_id(PK)│
            │ user_id (FK)  │      │ user_id (FK) │      │ user_id (FK)  │
            │ nid_number    │      │ badge_no     │      │ success       │
            │ home_location │      │ department   │      │ ip_address    │
            └───────┬───────┘      │ is_available │      └───────────────┘
                    │M             └──────┬───────┘
                    │                     │M
                    │    ┌────────────────┴────────────────┐
                    │    │                                  │
                    ▼    │                                  ▼
           ┌─────────────┴──┐                    ┌───────────────────┐
           │  fraud_cases   │◄───────────────────│ case_assignments  │
           ├────────────────┤        M           ├───────────────────┤
           │ case_id (PK)   │                    │ assignment_id (PK)│
           │ customer_id(FK)│                    │ case_id (FK)      │
           │ title          │                    │ investigator_id   │
           │ description    │                    │ assigned_by_user  │
           │ category       │                    │ note              │
           │ severity       │                    └───────────────────┘
           │ status         │
           │ created_at     │
           │ closed_at      │
           └────────┬───────┘
                    │
    ┌───────────────┼───────────────┬───────────────────┬─────────────────┐
    │M              │M              │M                  │M                │M
    ▼               ▼               ▼                   ▼                 ▼
┌──────────────┐ ┌─────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────────────┐
│case_history  │ │evidence_files│ │case_feedback │ │case_decisions│ │case_transactions│
├──────────────┤ ├─────────────┤ ├──────────────┤ ├──────────────┤ ├─────────────────┤
│history_id(PK)│ │evidence_id  │ │feedback_id   │ │decision_id   │ │case_id (FK,PK)  │
│case_id (FK)  │ │case_id (FK) │ │case_id (FK)  │ │case_id (FK)  │ │txn_id (FK,PK)   │
│old_status    │ │file_type    │ │investigator_id│ │admin_user_id│ └────────┬────────┘
│new_status    │ │file_path    │ │category      │ │category      │          │1
│comment       │ │note         │ │comment       │ │status        │          │
└──────────────┘ │uploaded_by  │ │approval_status│ │internal_notes│         │
                 └─────────────┘ └──────────────┘ │customer_msg  │          ▼
                                                  └──────────────┘   ┌─────────────┐
                                                                     │transactions │
                                                                     ├─────────────┤
                                                                     │txn_id (PK)  │
                                                                     │customer_id  │
                                                                     │txn_amount   │
                                                                     │txn_channel  │
                                                                     │txn_location │
                                                                     │occurred_at  │
                                                                     └──────┬──────┘
                                                                            │1
                                                                            │
                                                                            ▼
                                                              ┌─────────────────────────┐
                                                              │ suspicious_transactions │
                                                              ├─────────────────────────┤
                                                              │ suspicious_id (PK)      │
                                                              │ txn_id (FK)             │
                                                              │ risk_score              │
                                                              │ risk_level              │
                                                              │ reasons                 │
                                                              └─────────────────────────┘

Additional Tables:
┌────────────────┐    ┌─────────────────────┐    ┌──────────────────────┐
│  fraud_rules   │    │transaction_feedback │    │transaction_decisions │
├────────────────┤    ├─────────────────────┤    ├──────────────────────┤
│ rule_id (PK)   │    │ feedback_id (PK)    │    │ decision_id (PK)     │
│ rule_code      │    │ txn_id (FK)         │    │ txn_id (FK)          │
│ description    │    │ investigator_id     │    │ admin_user_id        │
│ risk_points    │    │ category            │    │ category             │
│ amount_threshold│   │ comment             │    │ status               │
│ is_active      │    │ approval_status     │    │ customer_message     │
└────────────────┘    └─────────────────────┘    └──────────────────────┘

┌──────────────┐
│  audit_log   │
├──────────────┤
│ audit_id (PK)│
│ table_name   │
│ record_pk    │
│ action_type  │
│ old_values   │
│ new_values   │
│ acted_by_user│
│ acted_ip     │
└──────────────┘
```

---

## 8. Schema Diagram

### Tables Summary (18 Tables)

| # | Table Name | Primary Key | Description |
|---|------------|-------------|-------------|
| 1 | `roles` | role_id | System roles (Admin, Investigator, Auditor, Customer) |
| 2 | `users` | user_id (UUID) | All system users |
| 3 | `customers` | customer_id | Customer-specific profile data |
| 4 | `investigators` | investigator_id | Investigator-specific profile data |
| 5 | `fraud_cases` | case_id | Main fraud cases table |
| 6 | `case_assignments` | assignment_id | Case-to-investigator assignments |
| 7 | `case_history` | history_id | Case status change audit log |
| 8 | `case_feedback` | feedback_id | Investigator feedback on cases |
| 9 | `case_decisions` | decision_id | Admin final decisions on cases |
| 10 | `transactions` | txn_id | Financial transactions |
| 11 | `case_transactions` | (case_id, txn_id) | Junction table linking cases to transactions |
| 12 | `suspicious_transactions` | suspicious_id | Flagged suspicious transactions |
| 13 | `transaction_feedback` | feedback_id | Investigator feedback on transactions |
| 14 | `transaction_decisions` | decision_id | Admin decisions on transactions |
| 15 | `evidence_files` | evidence_id | Uploaded evidence files |
| 16 | `fraud_rules` | rule_id | Configurable fraud detection rules |
| 17 | `login_attempts` | attempt_id | Login attempt audit log |
| 18 | `audit_log` | audit_id | Generic audit log for all tables |

### Views (4 Views)

| View Name | Purpose |
|-----------|---------|
| `users_safe` | Users table without password_hash |
| `customers_safe` | Customers with masked NID |
| `kpi_case_success` | Pre-calculated KPI metrics |
| `v_case_assigned_investigator` | Case-investigator assignment view |
| `v_channel_suspicious_ranking` | Channel-wise fraud analytics |

### Database Functions (12 Functions)

| Function | Purpose |
|----------|---------|
| `current_role_id()` | Returns current user's role_id |
| `is_admin()` | Checks if current user is admin |
| `is_investigator()` | Checks if current user is investigator |
| `is_auditor()` | Checks if current user is auditor |
| `is_customer()` | Checks if current user is customer |
| `user_owns_customer(p_customer_id)` | Checks customer ownership |
| `user_is_assigned_investigator(p_case_id)` | Checks case assignment |
| `update_case_status(p_case_id, p_new_status, p_comment)` | Updates case status with history |
| `get_case_reporter(p_case_id)` | Gets case reporter info |
| `evaluate_transaction(p_txn_id)` | Evaluates transaction risk |
| `set_app_context(p_ip, p_user_id)` | Sets app context variables |
| `case_id_from_path(p_path)` | Extracts case_id from storage path |

### Enums (12 ENUMs)

| Enum Name | Values |
|-----------|--------|
| `case_status` | OPEN, UNDER_INVESTIGATION, CLOSED |
| `case_category` | PAYMENT_FRAUD, IDENTITY_THEFT, ACCOUNT_TAKEOVER, SCAM, OTHER |
| `severity_level` | LOW, MEDIUM, HIGH |
| `risk_level` | LOW, MEDIUM, HIGH |
| `txn_channel` | BKASH, NAGAD, CARD, BANK, CASH, OTHER |
| `evidence_type` | SCREENSHOT, PDF, TRANSACTION_LOG, OTHER |
| `feedback_category` | CONFIRMED_FRAUD, FALSE_POSITIVE, REQUIRES_MORE_INFO, ESCALATE_TO_ADMIN, UNDER_REVIEW |
| `approval_status` | PENDING, APPROVED, REJECTED, ESCALATED |
| `decision_category` | FRAUD_CONFIRMED, CLEARED, PARTIAL_FRAUD, INVESTIGATION_ONGOING, INSUFFICIENT_EVIDENCE, REFERRED_TO_AUTHORITIES |
| `decision_status` | DRAFT, FINAL, COMMUNICATED |
| `audit_action` | INSERT, UPDATE, DELETE |

---

## 9. Queries for Feature Implementation

### 9.1 User Authentication & Role Check

```sql
-- Get user with role information
SELECT u.user_id, u.email, u.full_name, u.role_id, r.role_name
FROM users u
JOIN roles r ON r.role_id = u.role_id
WHERE u.email = 'user@example.com' AND u.is_active = true;

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role_id = 1 FROM users WHERE user_id = auth.uid()),
    false
  );
$$;
```

### 9.2 Dashboard KPIs

```sql
-- KPI View: Case Success Metrics
CREATE OR REPLACE VIEW kpi_case_success AS
SELECT
  COUNT(*) AS total_cases,
  COUNT(*) FILTER (WHERE status = 'CLOSED') AS closed_cases,
  COUNT(*) FILTER (WHERE status = 'OPEN') AS open_cases,
  COUNT(*) FILTER (WHERE status = 'UNDER_INVESTIGATION') AS under_investigation_cases,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'CLOSED')::numeric / NULLIF(COUNT(*), 0),
    4
  ) AS closure_rate,
  ROUND(
    AVG(
      EXTRACT(EPOCH FROM (closed_at - created_at)) / 3600
    ) FILTER (WHERE status = 'CLOSED'),
    2
  ) AS avg_close_hours
FROM fraud_cases;
```

### 9.3 Case Management

```sql
-- Create new fraud case
INSERT INTO fraud_cases (customer_id, title, description, category, severity)
VALUES ($1, $2, $3, $4::case_category, $5::severity_level)
RETURNING case_id;

-- Get cases with filters
SELECT case_id, title, category, severity, status, created_at
FROM fraud_cases
WHERE ($1 IS NULL OR status = $1)
  AND ($2 IS NULL OR severity = $2)
ORDER BY created_at DESC;

-- Update case status with history logging
CREATE OR REPLACE FUNCTION update_case_status(
  p_case_id bigint,
  p_new_status case_status,
  p_comment varchar DEFAULT NULL
)
RETURNS TABLE(success boolean, message text, old_status text, new_status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_status case_status;
BEGIN
  -- Get current status
  SELECT status INTO v_old_status FROM fraud_cases WHERE case_id = p_case_id;
  
  -- Update the case
  UPDATE fraud_cases
  SET status = p_new_status,
      closed_at = CASE WHEN p_new_status = 'CLOSED' THEN now() ELSE NULL END
  WHERE case_id = p_case_id;
  
  -- Log to history
  INSERT INTO case_history (case_id, old_status, new_status, comment, changed_by_user)
  VALUES (p_case_id, v_old_status, p_new_status, p_comment, auth.uid());
  
  RETURN QUERY SELECT 
    true, 
    'Status updated successfully',
    v_old_status::text,
    p_new_status::text;
END;
$$;
```

### 9.4 Case Assignment

```sql
-- Assign investigator to case
INSERT INTO case_assignments (case_id, investigator_id, assigned_by_user, note)
VALUES ($1, $2, auth.uid(), $3);

-- Get assigned investigator for a case
SELECT 
  ca.case_id,
  i.investigator_id,
  u.full_name AS investigator_name,
  u.email AS investigator_email,
  i.badge_no,
  i.department,
  ca.assigned_at
FROM case_assignments ca
JOIN investigators i ON i.investigator_id = ca.investigator_id
JOIN users u ON u.user_id = i.user_id
WHERE ca.case_id = $1
ORDER BY ca.assigned_at DESC
LIMIT 1;
```

### 9.5 Transaction Risk Evaluation

```sql
-- Evaluate transaction and create suspicious record
CREATE OR REPLACE FUNCTION evaluate_transaction(p_txn_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_risk_score integer := 0;
  v_risk_level risk_level;
  v_reasons text := '';
  v_txn RECORD;
  v_rule RECORD;
BEGIN
  -- Get transaction details
  SELECT * INTO v_txn FROM transactions WHERE txn_id = p_txn_id;
  
  -- Apply active fraud rules
  FOR v_rule IN SELECT * FROM fraud_rules WHERE is_active = true LOOP
    IF v_rule.amount_threshold IS NOT NULL 
       AND v_txn.txn_amount >= v_rule.amount_threshold THEN
      v_risk_score := v_risk_score + v_rule.risk_points;
      v_reasons := v_reasons || v_rule.rule_code || '; ';
    END IF;
  END LOOP;
  
  -- Determine risk level
  v_risk_level := CASE
    WHEN v_risk_score >= 70 THEN 'HIGH'
    WHEN v_risk_score >= 40 THEN 'MEDIUM'
    ELSE 'LOW'
  END;
  
  -- Insert or update suspicious transaction
  INSERT INTO suspicious_transactions (txn_id, risk_score, risk_level, reasons)
  VALUES (p_txn_id, v_risk_score, v_risk_level, v_reasons)
  ON CONFLICT (txn_id) DO UPDATE
  SET risk_score = EXCLUDED.risk_score,
      risk_level = EXCLUDED.risk_level,
      reasons = EXCLUDED.reasons;
END;
$$;
```

### 9.6 Channel Suspicious Ranking Analytics

```sql
-- Channel-wise suspicious transaction ranking
CREATE OR REPLACE VIEW v_channel_suspicious_ranking AS
SELECT
  t.txn_channel AS channel,
  COUNT(*)::integer AS total_txn,
  COUNT(st.suspicious_id) FILTER (WHERE st.risk_level IN ('MEDIUM', 'HIGH'))::integer AS suspicious_txn,
  ROUND(AVG(COALESCE(st.risk_score, 0)), 2) AS avg_risk_score,
  ROUND(
    (COUNT(st.suspicious_id) FILTER (WHERE st.risk_level IN ('MEDIUM', 'HIGH'))::numeric / 
     NULLIF(COUNT(*), 0)) * 100,
    2
  ) AS suspicious_rate_pct
FROM transactions t
LEFT JOIN suspicious_transactions st ON st.txn_id = t.txn_id
GROUP BY t.txn_channel
ORDER BY suspicious_rate_pct DESC;
```

### 9.7 Evidence File Management

```sql
-- Insert evidence record
INSERT INTO evidence_files (case_id, file_type, file_path, note, uploaded_by)
VALUES ($1, $2::evidence_type, $3, $4, auth.uid())
RETURNING evidence_id;

-- Get evidence for a case
SELECT evidence_id, file_type, file_path, note, uploaded_at
FROM evidence_files
WHERE case_id = $1
ORDER BY uploaded_at DESC;
```

### 9.8 Row-Level Security Policies

```sql
-- Cases: Customers can only see their own cases
CREATE POLICY cases_customer_own_read ON fraud_cases
FOR SELECT
USING (is_customer() AND user_owns_customer(customer_id));

-- Cases: Admin can do everything
CREATE POLICY cases_admin_all ON fraud_cases
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Investigators can see assigned cases
CREATE POLICY cases_investigator_assigned_read ON fraud_cases
FOR SELECT
USING (is_investigator() AND user_is_assigned_investigator(case_id));
```

### 9.9 Audit Logging Trigger

```sql
-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (table_name, record_pk, action_type, new_values, acted_by_user)
    VALUES (TG_TABLE_NAME, NEW.id::text, 'INSERT', row_to_json(NEW)::text, auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (table_name, record_pk, action_type, old_values, new_values, acted_by_user)
    VALUES (TG_TABLE_NAME, OLD.id::text, 'UPDATE', row_to_json(OLD)::text, row_to_json(NEW)::text, auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (table_name, record_pk, action_type, old_values, acted_by_user)
    VALUES (TG_TABLE_NAME, OLD.id::text, 'DELETE', row_to_json(OLD)::text, auth.uid());
    RETURN OLD;
  END IF;
END;
$$;
```

### 9.10 Real-time Subscriptions

```sql
-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.fraud_cases;
ALTER PUBLICATION supabase_realtime ADD TABLE public.case_assignments;
```

---

## 10. Application Screenshots

### 10.1 Home Page
![Home Page](screenshots/home.png)
*Landing page with feature highlights and navigation*

### 10.2 Authentication
![Login Page](screenshots/login.png)
*Login and registration interface*

### 10.3 Admin Dashboard
![Admin Dashboard](screenshots/dashboard-admin.png)
*Admin dashboard with KPIs, recent cases, and analytics*

### 10.4 Case List
![Cases List](screenshots/cases-list.png)
*Case management with filters and search*

### 10.5 Case Detail
![Case Detail](screenshots/case-detail.png)
*Detailed case view with evidence, history, and decisions*

### 10.6 Create Case
![Create Case](screenshots/create-case.png)
*Case creation form with transaction details*

### 10.7 Investigation Workflow
![Investigations](screenshots/investigations.png)
*Case assignment and status management*

### 10.8 Analytics
![Analytics](screenshots/analytics.png)
*Fraud hotspots and channel analysis*

### 10.9 User Management
![Users](screenshots/users.png)
*Admin user management interface*

*(Note: Replace placeholder paths with actual screenshots)*

---

## 11. Limitations

### Current Limitations

1. **No Machine Learning Integration**: Risk scoring uses rule-based approach, not ML
2. **No Mobile App**: Web-only application (responsive but no native app)
3. **Limited Payment Gateway Integration**: No direct integration with payment processors
4. **No Email Notifications**: Real-time notifications are in-app only
5. **Single Language**: English only, no internationalization
6. **No Bulk Operations**: Single case/transaction processing only
7. **Limited Reporting**: No PDF export or scheduled reports
8. **No Two-Factor Authentication**: Password-only authentication

### Technical Constraints

1. **Supabase Free Tier Limits**: Storage and database size limits
2. **Real-time Connection Limits**: WebSocket connection limits
3. **No Offline Support**: Requires internet connection

---

## 12. Future Work

### Short-term Improvements

1. **Email Notifications**: Send email alerts for case updates
2. **PDF Report Generation**: Export case reports as PDF
3. **Bulk Import/Export**: CSV upload for transactions
4. **Two-Factor Authentication**: Enhanced security

### Medium-term Enhancements

1. **Machine Learning Risk Scoring**: Integrate ML models for fraud detection
2. **Mobile Application**: React Native mobile app
3. **Multi-language Support**: Internationalization (i18n)
4. **Advanced Analytics**: Predictive analytics and trend analysis

### Long-term Vision

1. **AI Chatbot**: Intelligent case assistance
2. **Blockchain Integration**: Immutable audit trails
3. **Payment Gateway Integration**: Direct fraud prevention at transaction level
4. **Third-party API Integration**: Credit bureau, identity verification services

---

## 13. Conclusion

FraudGuard is a comprehensive **Online Fraud Management System** that successfully demonstrates the application of DBMS concepts in a real-world scenario.

### Key Achievements

1. ✅ **Normalized Database Design**: 18 tables following 3NF principles
2. ✅ **Complex Relationships**: Proper FK constraints and junction tables
3. ✅ **Security Implementation**: Row-Level Security with 4 distinct roles
4. ✅ **Advanced SQL Features**: Functions, triggers, views, and CTEs
5. ✅ **Real-time Capabilities**: WebSocket-based notifications
6. ✅ **Full CRUD Operations**: Complete data management
7. ✅ **Audit Logging**: Comprehensive activity tracking

### Technical Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Supabase (PostgreSQL), Edge Functions |
| Database | PostgreSQL 14+ with RLS |
| Real-time | Supabase Realtime (WebSocket) |
| Storage | Supabase Storage |
| Authentication | Supabase Auth |

### Learning Outcomes

This project provided hands-on experience with:
- Database design and normalization
- SQL query optimization
- Security policy implementation
- Real-time database subscriptions
- Full-stack application development

---

## Appendix

### A. Technology Stack Details

- **React 18.3.1**: UI framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **shadcn/ui**: Component library
- **Supabase**: Backend-as-a-Service
- **PostgreSQL**: Database
- **React Query**: Data fetching
- **React Router**: Navigation

### B. File Structure

```
src/
├── components/
│   ├── analytics/
│   ├── decisions/
│   ├── feedback/
│   ├── layout/
│   ├── notifications/
│   └── ui/
├── hooks/
├── integrations/
├── lib/
├── pages/
└── test/
supabase/
├── functions/
└── migrations/
```

### C. References

1. Supabase Documentation: https://supabase.com/docs
2. PostgreSQL Documentation: https://www.postgresql.org/docs/
3. React Documentation: https://react.dev/
4. Tailwind CSS: https://tailwindcss.com/docs

---

*Report Generated: January 2026*
*FraudGuard - Online Fraud Management System*
