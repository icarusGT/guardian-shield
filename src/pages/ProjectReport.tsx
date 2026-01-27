import { useEffect } from "react";

const ProjectReport = () => {
  useEffect(() => {
    document.title = "DBMS Lab Project Report - Guardian Shield";
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Print Button - Hidden when printing */}
      <div className="print:hidden fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={handlePrint}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect width="12" height="8" x="6" y="14" />
          </svg>
          Print / Save as PDF
        </button>
        <a
          href="/"
          className="bg-muted text-muted-foreground px-4 py-3 rounded-lg font-semibold shadow-lg hover:bg-muted/80 transition-colors"
        >
          ← Back to App
        </a>
      </div>

      {/* Report Content */}
      <div className="report-container bg-white text-gray-900 min-h-screen">
        {/* Cover Page */}
        <div className="page cover-page flex flex-col items-center justify-center text-center p-12">
          <div className="mb-8">
            <img src="/UniversityLogo.png" alt="University Logo" className="h-24 mx-auto mb-4" />
          </div>
          <h1 className="text-4xl font-bold text-blue-900 mb-4">DBMS Lab Project Report</h1>
          <div className="w-24 h-1 bg-blue-600 mx-auto mb-8"></div>
          <h2 className="text-3xl font-semibold text-gray-800 mb-2">Guardian Shield</h2>
          <p className="text-xl text-gray-600 mb-12">Online Fraud Management System</p>
          
          <div className="mt-8 text-left bg-gray-50 p-8 rounded-lg border w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">Team Information</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-gray-600">Name</th>
                  <th className="text-left py-2 text-gray-600">ID Number</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">[Team Member 1]</td>
                  <td className="py-2">[ID]</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">[Team Member 2]</td>
                  <td className="py-2">[ID]</td>
                </tr>
                <tr>
                  <td className="py-2">[Team Member 3]</td>
                  <td className="py-2">[ID]</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-auto pt-12 text-gray-500">
            <p>January 2026</p>
          </div>
        </div>

        {/* Links Page */}
        <div className="page p-12 page-break">
          <h2 className="section-title">Project Links</h2>
          
          <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Video Demonstration</h3>
            <p className="text-gray-600">YouTube: <span className="text-blue-600">[Insert YouTube Link]</span></p>
          </div>

          <div className="p-6 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-900 mb-2">Project Repository</h3>
            <p className="text-gray-600">GitHub: <span className="text-green-600">[Insert GitHub Link]</span></p>
          </div>
        </div>

        {/* Table of Contents */}
        <div className="page p-12 page-break">
          <h2 className="text-2xl font-bold text-blue-900 mb-8">Table of Contents</h2>
          <div className="space-y-3">
            {[
              { num: "1", title: "Introduction / Overview", page: "3" },
              { num: "2", title: "Motivation", page: "4" },
              { num: "3", title: "Related or Similar Projects", page: "5" },
              { num: "4", title: "Benchmark Analysis", page: "5" },
              { num: "5", title: "Complete Feature List", page: "6" },
              { num: "6", title: "Database Design Approach", page: "8" },
              { num: "7", title: "Entity–Relationship Diagram (ERD)", page: "9" },
              { num: "8", title: "Schema Diagram", page: "11" },
              { num: "9", title: "Queries for Feature Implementation", page: "13" },
              { num: "10", title: "Application Screenshots", page: "18" },
              { num: "11", title: "Limitations", page: "20" },
              { num: "12", title: "Future Work", page: "21" },
              { num: "13", title: "Conclusion", page: "22" },
            ].map((item) => (
              <div key={item.num} className="flex items-baseline">
                <span className="font-semibold text-blue-800 w-8">{item.num}.</span>
                <span className="flex-1 border-b border-dotted border-gray-300 mx-2">{item.title}</span>
                <span className="text-gray-500">{item.page}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 1: Introduction */}
        <div className="page p-12 page-break">
          <h2 className="section-title">1. Introduction / Overview</h2>
          
          <p className="text-justify mb-6 leading-relaxed">
            Guardian Shield is a comprehensive <strong>Online Fraud Management System</strong> designed to detect, 
            investigate, and resolve fraud cases in financial institutions and organizations. The system 
            provides a centralized platform for managing fraud cases from detection to resolution with 
            complete audit trails.
          </p>

          <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-600 mb-6">
            <h3 className="font-semibold text-blue-900 mb-4">Key Capabilities</h3>
            <ul className="grid grid-cols-2 gap-3">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <span>Real-time fraud detection with automated risk scoring</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <span>Multi-role access control (Admin, Investigator, Auditor, Customer)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <span>Case management workflow with status tracking</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <span>Evidence file management with secure storage</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <span>Transaction monitoring across multiple payment channels</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <span>Analytics dashboard with KPIs and fraud hotspot analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <span>Real-time notifications for new cases and assignments</span>
              </li>
            </ul>
          </div>

          <p className="text-justify leading-relaxed">
            The system is built using modern web technologies with a React frontend and a PostgreSQL 
            database backend (Supabase), implementing enterprise-grade security with Row-Level Security (RLS) policies.
          </p>
        </div>

        {/* Section 2: Motivation */}
        <div className="page p-12 page-break">
          <h2 className="section-title">2. Motivation</h2>

          <div className="mb-8">
            <h3 className="subsection-title">Problem Statement</h3>
            <p className="text-justify mb-4 leading-relaxed">
              Financial fraud is a growing concern in the digital economy. Organizations face challenges in:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Detecting fraudulent transactions quickly</li>
              <li>Managing and tracking fraud cases efficiently</li>
              <li>Coordinating between investigators and administrators</li>
              <li>Maintaining comprehensive audit trails for compliance</li>
              <li>Providing customers visibility into their case status</li>
            </ul>
          </div>

          <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
            <h3 className="font-semibold text-amber-900 mb-4">Why This Project?</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex gap-3">
                <span className="bg-amber-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shrink-0">1</span>
                <div>
                  <strong>Real-world relevance:</strong> Fraud management is critical for banks, e-commerce platforms, and financial institutions
                </div>
              </div>
              <div className="flex gap-3">
                <span className="bg-amber-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shrink-0">2</span>
                <div>
                  <strong>Complex database design:</strong> Involves multiple entities, relationships, and security policies
                </div>
              </div>
              <div className="flex gap-3">
                <span className="bg-amber-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shrink-0">3</span>
                <div>
                  <strong>Role-based access control:</strong> Demonstrates advanced RLS implementation
                </div>
              </div>
              <div className="flex gap-3">
                <span className="bg-amber-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shrink-0">4</span>
                <div>
                  <strong>Practical application:</strong> Showcases CRUD operations, triggers, functions, and views
                </div>
              </div>
              <div className="flex gap-3">
                <span className="bg-amber-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shrink-0">5</span>
                <div>
                  <strong>Academic value:</strong> Covers normalization, ER diagrams, SQL queries, and database optimization
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3 & 4: Related Projects & Benchmark */}
        <div className="page p-12 page-break">
          <h2 className="section-title">3. Related or Similar Projects</h2>
          
          <table className="data-table mb-8">
            <thead>
              <tr>
                <th>System</th>
                <th>Description</th>
                <th>Limitations Addressed by FraudGuard</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-semibold">FICO Falcon</td>
                <td>Commercial fraud detection platform</td>
                <td>Complex, expensive, not customizable</td>
              </tr>
              <tr>
                <td className="font-semibold">Feedzai</td>
                <td>AI-powered fraud prevention</td>
                <td>Requires ML expertise, costly</td>
              </tr>
              <tr>
                <td className="font-semibold">SAS Fraud Management</td>
                <td>Enterprise fraud solution</td>
                <td>Heavy infrastructure needs</td>
              </tr>
              <tr>
                <td className="font-semibold">Custom Excel/Sheets</td>
                <td>Manual tracking</td>
                <td>No automation, no security, no audit trail</td>
              </tr>
            </tbody>
          </table>

          <h2 className="section-title mt-12">4. Benchmark Analysis</h2>
          
          <table className="data-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th className="text-center">FraudGuard</th>
                <th className="text-center">Traditional Systems</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Real-time Detection</td>
                <td className="text-center text-green-600 font-bold">✓ Yes</td>
                <td className="text-center text-amber-600">⚠ Limited</td>
              </tr>
              <tr>
                <td>Role-based Access</td>
                <td className="text-center text-green-600 font-bold">✓ 4 roles</td>
                <td className="text-center text-amber-600">⚠ Basic</td>
              </tr>
              <tr>
                <td>Evidence Upload</td>
                <td className="text-center text-green-600 font-bold">✓ Secure Storage</td>
                <td className="text-center text-red-600">✗ Often missing</td>
              </tr>
              <tr>
                <td>Audit Logging</td>
                <td className="text-center text-green-600 font-bold">✓ Automatic triggers</td>
                <td className="text-center text-amber-600">⚠ Manual</td>
              </tr>
              <tr>
                <td>Customer Portal</td>
                <td className="text-center text-green-600 font-bold">✓ Case visibility</td>
                <td className="text-center text-red-600">✗ Rarely available</td>
              </tr>
              <tr>
                <td>Real-time Notifications</td>
                <td className="text-center text-green-600 font-bold">✓ WebSocket</td>
                <td className="text-center text-red-600">✗ Email only</td>
              </tr>
              <tr>
                <td>Multi-channel Support</td>
                <td className="text-center text-green-600 font-bold">✓ 6 channels</td>
                <td className="text-center text-amber-600">⚠ Limited</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 5: Feature List */}
        <div className="page p-12 page-break">
          <h2 className="section-title">5. Complete Feature List</h2>
          
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div className="feature-box">
              <h3 className="feature-title">5.1 Authentication & Authorization</h3>
              <ul className="feature-list">
                <li>User registration and login (email-based)</li>
                <li>Role-based access control (RBAC)</li>
                <li>Session management</li>
                <li>Password security</li>
                <li>Account lockout after failed attempts</li>
              </ul>
            </div>

            <div className="feature-box">
              <h3 className="feature-title">5.2 Dashboard</h3>
              <ul className="feature-list">
                <li>Role-specific dashboards</li>
                <li>KPI metrics (Cases, Closure Rate, etc.)</li>
                <li>Recent cases overview</li>
                <li>Decision status overview</li>
                <li>Quick navigation links</li>
              </ul>
            </div>

            <div className="feature-box">
              <h3 className="feature-title">5.3 Case Management</h3>
              <ul className="feature-list">
                <li>Create, view, update fraud cases</li>
                <li>Status workflow (OPEN → UNDER_INVESTIGATION → CLOSED)</li>
                <li>Case categorization & severity levels</li>
                <li>Case search and filtering</li>
                <li>Case history tracking</li>
              </ul>
            </div>

            <div className="feature-box">
              <h3 className="feature-title">5.4 Transaction Monitoring</h3>
              <ul className="feature-list">
                <li>Multi-channel support (BKASH, NAGAD, CARD, BANK, CASH)</li>
                <li>Risk score calculation</li>
                <li>Risk level classification</li>
                <li>Suspicious transaction flagging</li>
              </ul>
            </div>

            <div className="feature-box">
              <h3 className="feature-title">5.5 Investigation Workflow</h3>
              <ul className="feature-list">
                <li>Case assignment to investigators</li>
                <li>Investigator availability tracking</li>
                <li>Assignment notes</li>
                <li>Status update with comments</li>
              </ul>
            </div>

            <div className="feature-box">
              <h3 className="feature-title">5.6 Evidence Management</h3>
              <ul className="feature-list">
                <li>File upload (Screenshots, PDFs, Logs)</li>
                <li>Secure storage</li>
                <li>Evidence notes</li>
                <li>File download capability</li>
              </ul>
            </div>

            <div className="feature-box">
              <h3 className="feature-title">5.7 Feedback System</h3>
              <ul className="feature-list">
                <li>Investigator feedback on cases</li>
                <li>Multiple feedback categories</li>
                <li>Approval status tracking</li>
              </ul>
            </div>

            <div className="feature-box">
              <h3 className="feature-title">5.8 Decision Management</h3>
              <ul className="feature-list">
                <li>Admin case decisions</li>
                <li>Decision workflow (Draft → Final → Communicated)</li>
                <li>Customer messaging</li>
                <li>Internal notes</li>
              </ul>
            </div>

            <div className="feature-box">
              <h3 className="feature-title">5.9 Analytics & Reporting</h3>
              <ul className="feature-list">
                <li>Fraud Hotspots by Location</li>
                <li>Channel-wise Suspicious Ranking</li>
                <li>Users with Multiple Cases</li>
                <li>Date-based filtering</li>
              </ul>
            </div>

            <div className="feature-box">
              <h3 className="feature-title">5.10 Real-time Features</h3>
              <ul className="feature-list">
                <li>Real-time notifications for Admins</li>
                <li>Real-time notifications for Investigators</li>
                <li>WebSocket-based updates</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section 6: Database Design */}
        <div className="page p-12 page-break">
          <h2 className="section-title">6. Database Design Approach</h2>

          <div className="mb-8">
            <h3 className="subsection-title">Design Methodology</h3>
            <p className="text-justify mb-4 leading-relaxed">
              We followed a <strong>top-down approach</strong> combined with <strong>normalization</strong> principles:
            </p>
            <ol className="list-decimal pl-6 space-y-2 mb-6">
              <li><strong>Requirements Analysis:</strong> Identified entities from user stories</li>
              <li><strong>Conceptual Design:</strong> Created ER diagram</li>
              <li><strong>Logical Design:</strong> Normalized to 3NF/BCNF</li>
              <li><strong>Physical Design:</strong> Implemented in PostgreSQL with indexes and constraints</li>
            </ol>
          </div>

          <div className="bg-green-50 p-6 rounded-lg border border-green-200 mb-8">
            <h3 className="font-semibold text-green-900 mb-4">Normalization (Third Normal Form - 3NF)</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded border">
                <strong className="text-green-800">1NF</strong>
                <p className="text-sm mt-1">All columns contain atomic values</p>
              </div>
              <div className="bg-white p-4 rounded border">
                <strong className="text-green-800">2NF</strong>
                <p className="text-sm mt-1">All non-key columns depend on entire primary key</p>
              </div>
              <div className="bg-white p-4 rounded border">
                <strong className="text-green-800">3NF</strong>
                <p className="text-sm mt-1">No transitive dependencies</p>
              </div>
            </div>
          </div>

          <h3 className="subsection-title">Key Design Decisions</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Decision</th>
                <th>Rationale</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Separate users, customers, investigators tables</td>
                <td>Different roles have different attributes</td>
              </tr>
              <tr>
                <td>case_transactions junction table</td>
                <td>Many-to-many relationship between cases and transactions</td>
              </tr>
              <tr>
                <td>case_history table</td>
                <td>Audit trail for status changes</td>
              </tr>
              <tr>
                <td>Views for sensitive data</td>
                <td>users_safe, customers_safe hide password hash</td>
              </tr>
              <tr>
                <td>SECURITY DEFINER functions</td>
                <td>Bypass RLS for internal operations</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 7: ERD */}
        <div className="page p-12 page-break">
          <h2 className="section-title">7. Entity–Relationship Diagram (ERD)</h2>
          
          <div className="bg-gray-100 p-6 rounded-lg border overflow-x-auto">
            <pre className="text-xs font-mono whitespace-pre leading-tight">{`
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                  Guardian Shield ERD                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘

                                    ┌─────────────┐
                                    │    roles    │
                                    ├─────────────┤
                                    │ role_id (PK)│
                                    │ role_name   │
                                    └──────┬──────┘
                                           │1
                                           │M
                                    ┌──────┴──────┐
                                    │    users    │
                                    ├─────────────┤
                                    │ user_id (PK)│
                                    │ role_id (FK)│
                                    │ email       │
                                    │ full_name   │
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
                    ▼                     ▼
           ┌────────────────┐  ◄──────────────────┐
           │  fraud_cases   │     case_assignments│
           ├────────────────┤  ├──────────────────┤
           │ case_id (PK)   │  │ assignment_id(PK)│
           │ customer_id(FK)│  │ case_id (FK)     │
           │ title, status  │  │ investigator_id  │
           └────────┬───────┘  └──────────────────┘
                    │
    ┌───────────────┼───────────────┬─────────────────┐
    │M              │M              │M                │M
    ▼               ▼               ▼                 ▼
┌──────────────┐ ┌─────────────┐ ┌──────────────┐ ┌─────────────────┐
│case_history  │ │evidence_files│ │case_feedback │ │case_transactions│
├──────────────┤ ├─────────────┤ ├──────────────┤ ├─────────────────┤
│history_id(PK)│ │evidence_id  │ │feedback_id   │ │case_id (FK,PK)  │
│case_id (FK)  │ │case_id (FK) │ │case_id (FK)  │ │txn_id (FK,PK)   │
│old_status    │ │file_type    │ │investigator  │ └────────┬────────┘
│new_status    │ │file_path    │ │category      │          │
└──────────────┘ └─────────────┘ └──────────────┘          ▼
                                                   ┌─────────────┐
                                                   │transactions │
                                                   ├─────────────┤
                                                   │txn_id (PK)  │
                                                   │txn_amount   │
                                                   │txn_channel  │
                                                   └──────┬──────┘
                                                          │
                                                          ▼
                                          ┌─────────────────────────┐
                                          │ suspicious_transactions │
                                          ├─────────────────────────┤
                                          │ suspicious_id (PK)      │
                                          │ txn_id (FK)             │
                                          │ risk_score, risk_level  │
                                          └─────────────────────────┘
`}</pre>
          </div>
        </div>

        {/* Section 8: Schema */}
        <div className="page p-12 page-break">
          <h2 className="section-title">8. Schema Diagram</h2>
          
          <h3 className="subsection-title">Tables Summary (18 Tables)</h3>
          <table className="data-table text-sm mb-8">
            <thead>
              <tr>
                <th>#</th>
                <th>Table Name</th>
                <th>Primary Key</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["1", "roles", "role_id", "System roles (Admin, Investigator, Auditor, Customer)"],
                ["2", "users", "user_id (UUID)", "All system users"],
                ["3", "customers", "customer_id", "Customer-specific profile data"],
                ["4", "investigators", "investigator_id", "Investigator-specific profile data"],
                ["5", "fraud_cases", "case_id", "Main fraud cases table"],
                ["6", "case_assignments", "assignment_id", "Case-to-investigator assignments"],
                ["7", "case_history", "history_id", "Case status change audit log"],
                ["8", "case_feedback", "feedback_id", "Investigator feedback on cases"],
                ["9", "case_decisions", "decision_id", "Admin final decisions on cases"],
                ["10", "transactions", "txn_id", "Financial transactions"],
                ["11", "case_transactions", "(case_id, txn_id)", "Junction table linking cases to transactions"],
                ["12", "suspicious_transactions", "suspicious_id", "Flagged suspicious transactions"],
                ["13", "transaction_feedback", "feedback_id", "Investigator feedback on transactions"],
                ["14", "transaction_decisions", "decision_id", "Admin decisions on transactions"],
                ["15", "evidence_files", "evidence_id", "Uploaded evidence files"],
                ["16", "fraud_rules", "rule_id", "Configurable fraud detection rules"],
                ["17", "login_attempts", "attempt_id", "Login attempt audit log"],
                ["18", "audit_log", "audit_id", "Generic audit log for all tables"],
              ].map(([num, name, pk, desc]) => (
                <tr key={num}>
                  <td className="text-center">{num}</td>
                  <td className="font-mono text-blue-800">{name}</td>
                  <td className="font-mono text-xs">{pk}</td>
                  <td>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="subsection-title">Views (5 Views)</h3>
              <table className="data-table text-sm">
                <thead>
                  <tr><th>View Name</th><th>Purpose</th></tr>
                </thead>
                <tbody>
                  <tr><td className="font-mono">users_safe</td><td>Users without password_hash</td></tr>
                  <tr><td className="font-mono">customers_safe</td><td>Customers with masked NID</td></tr>
                  <tr><td className="font-mono">kpi_case_success</td><td>Pre-calculated KPI metrics</td></tr>
                  <tr><td className="font-mono">v_case_assigned_investigator</td><td>Case-investigator view</td></tr>
                  <tr><td className="font-mono">v_channel_suspicious_ranking</td><td>Channel fraud analytics</td></tr>
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="subsection-title">Enums (11 ENUMs)</h3>
              <table className="data-table text-sm">
                <thead>
                  <tr><th>Enum Name</th><th>Values</th></tr>
                </thead>
                <tbody>
                  <tr><td className="font-mono">case_status</td><td>OPEN, UNDER_INVESTIGATION, CLOSED</td></tr>
                  <tr><td className="font-mono">case_category</td><td>PAYMENT_FRAUD, IDENTITY_THEFT, ...</td></tr>
                  <tr><td className="font-mono">severity_level</td><td>LOW, MEDIUM, HIGH</td></tr>
                  <tr><td className="font-mono">risk_level</td><td>LOW, MEDIUM, HIGH</td></tr>
                  <tr><td className="font-mono">txn_channel</td><td>BKASH, NAGAD, CARD, ...</td></tr>
                  <tr><td className="font-mono">evidence_type</td><td>SCREENSHOT, PDF, ...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section 9: SQL Queries */}
        <div className="page p-12 page-break">
          <h2 className="section-title">9. Queries for Feature Implementation</h2>
          
          <h3 className="subsection-title">9.1 User Authentication & Role Check</h3>
          <pre className="code-block">{`-- Get user with role information
SELECT u.user_id, u.email, u.full_name, u.role_id, r.role_name
FROM users u
JOIN roles r ON r.role_id = u.role_id
WHERE u.email = 'user@example.com' AND u.is_active = true;

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    (SELECT role_id = 1 FROM users WHERE user_id = auth.uid()),
    false
  );
$$;`}</pre>

          <h3 className="subsection-title">9.2 Dashboard KPIs</h3>
          <pre className="code-block">{`-- KPI View: Case Success Metrics
CREATE OR REPLACE VIEW kpi_case_success AS
SELECT
  COUNT(*) AS total_cases,
  COUNT(*) FILTER (WHERE status = 'CLOSED') AS closed_cases,
  COUNT(*) FILTER (WHERE status = 'OPEN') AS open_cases,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'CLOSED')::numeric / NULLIF(COUNT(*), 0),
    4
  ) AS closure_rate,
  ROUND(
    AVG(EXTRACT(EPOCH FROM (closed_at - created_at)) / 3600) 
    FILTER (WHERE status = 'CLOSED'), 2
  ) AS avg_close_hours
FROM fraud_cases;`}</pre>

          <h3 className="subsection-title">9.3 Case Status Update with History</h3>
          <pre className="code-block">{`CREATE OR REPLACE FUNCTION update_case_status(
  p_case_id bigint, p_new_status case_status, p_comment varchar DEFAULT NULL
) RETURNS TABLE(success boolean, message text, old_status text, new_status text)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_old_status case_status;
BEGIN
  SELECT status INTO v_old_status FROM fraud_cases WHERE case_id = p_case_id;
  
  UPDATE fraud_cases SET status = p_new_status,
    closed_at = CASE WHEN p_new_status = 'CLOSED' THEN now() ELSE NULL END
  WHERE case_id = p_case_id;
  
  INSERT INTO case_history (case_id, old_status, new_status, comment, changed_by_user)
  VALUES (p_case_id, v_old_status, p_new_status, p_comment, auth.uid());
  
  RETURN QUERY SELECT true, 'Status updated', v_old_status::text, p_new_status::text;
END; $$;`}</pre>
        </div>

        {/* Section 9 continued: More SQL */}
        <div className="page p-12 page-break">
          <h3 className="subsection-title">9.4 Transaction Risk Evaluation</h3>
          <pre className="code-block">{`CREATE OR REPLACE FUNCTION evaluate_transaction(p_txn_id bigint)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_risk_score integer := 0; v_risk_level risk_level;
  v_reasons text := ''; v_txn RECORD; v_rule RECORD;
BEGIN
  SELECT * INTO v_txn FROM transactions WHERE txn_id = p_txn_id;
  
  FOR v_rule IN SELECT * FROM fraud_rules WHERE is_active = true LOOP
    IF v_rule.amount_threshold IS NOT NULL 
       AND v_txn.txn_amount >= v_rule.amount_threshold THEN
      v_risk_score := v_risk_score + v_rule.risk_points;
      v_reasons := v_reasons || v_rule.rule_code || '; ';
    END IF;
  END LOOP;
  
  v_risk_level := CASE
    WHEN v_risk_score >= 70 THEN 'HIGH'
    WHEN v_risk_score >= 40 THEN 'MEDIUM' ELSE 'LOW'
  END;
  
  INSERT INTO suspicious_transactions (txn_id, risk_score, risk_level, reasons)
  VALUES (p_txn_id, v_risk_score, v_risk_level, v_reasons)
  ON CONFLICT (txn_id) DO UPDATE SET risk_score = EXCLUDED.risk_score,
    risk_level = EXCLUDED.risk_level, reasons = EXCLUDED.reasons;
END; $$;`}</pre>

          <h3 className="subsection-title">9.5 Row-Level Security Policies</h3>
          <pre className="code-block">{`-- Customers can only see their own cases
CREATE POLICY cases_customer_own_read ON fraud_cases
FOR SELECT USING (is_customer() AND user_owns_customer(customer_id));

-- Admin can do everything
CREATE POLICY cases_admin_all ON fraud_cases
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Investigators can see assigned cases
CREATE POLICY cases_investigator_assigned_read ON fraud_cases
FOR SELECT USING (is_investigator() AND user_is_assigned_investigator(case_id));`}</pre>

          <h3 className="subsection-title">9.6 Audit Logging Trigger</h3>
          <pre className="code-block">{`CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (table_name, record_pk, action_type, new_values, acted_by_user)
    VALUES (TG_TABLE_NAME, NEW.id::text, 'INSERT', row_to_json(NEW)::text, auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (table_name, record_pk, action_type, old_values, new_values)
    VALUES (TG_TABLE_NAME, OLD.id::text, 'UPDATE', row_to_json(OLD)::text, row_to_json(NEW)::text);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (table_name, record_pk, action_type, old_values)
    VALUES (TG_TABLE_NAME, OLD.id::text, 'DELETE', row_to_json(OLD)::text);
    RETURN OLD;
  END IF;
END; $$;`}</pre>
        </div>

        {/* Section 10: Screenshots */}
        <div className="page p-12 page-break">
          <h2 className="section-title">10. Application Screenshots</h2>
          
          <p className="text-gray-600 mb-6 italic">
            Note: Replace the placeholder boxes below with actual screenshots from the application.
          </p>

          <div className="grid grid-cols-2 gap-6">
            {[
              { title: "10.1 Home Page", desc: "Landing page with feature highlights" },
              { title: "10.2 Authentication", desc: "Login and registration interface" },
              { title: "10.3 Admin Dashboard", desc: "Dashboard with KPIs and analytics" },
              { title: "10.4 Case List", desc: "Case management with filters" },
              { title: "10.5 Case Detail", desc: "Detailed case view with evidence" },
              { title: "10.6 Create Case", desc: "Case creation form" },
              { title: "10.7 Investigations", desc: "Case assignment and management" },
              { title: "10.8 Analytics", desc: "Fraud hotspots and analysis" },
            ].map((item) => (
              <div key={item.title} className="border rounded-lg overflow-hidden">
                <div className="bg-gray-200 h-40 flex items-center justify-center">
                  <span className="text-gray-500">[Screenshot: {item.title}]</span>
                </div>
                <div className="p-3 bg-gray-50">
                  <h4 className="font-semibold text-sm">{item.title}</h4>
                  <p className="text-xs text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 11: Limitations */}
        <div className="page p-12 page-break">
          <h2 className="section-title">11. Limitations</h2>
          
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="subsection-title">Current Limitations</h3>
              <ul className="space-y-3">
                <li className="flex gap-2">
                  <span className="text-red-500">✗</span>
                  <span><strong>No Machine Learning:</strong> Risk scoring uses rule-based approach</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500">✗</span>
                  <span><strong>No Mobile App:</strong> Web-only (responsive but no native)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500">✗</span>
                  <span><strong>No Payment Gateway:</strong> No direct processor integration</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500">✗</span>
                  <span><strong>No Email Notifications:</strong> In-app only</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500">✗</span>
                  <span><strong>Single Language:</strong> English only</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500">✗</span>
                  <span><strong>No Bulk Operations:</strong> Single processing only</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500">✗</span>
                  <span><strong>No Two-Factor Auth:</strong> Password-only</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="subsection-title">Technical Constraints</h3>
              <ul className="space-y-3">
                <li className="flex gap-2">
                  <span className="text-amber-500">⚠</span>
                  <span><strong>Cloud Limits:</strong> Storage and database size limits</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-500">⚠</span>
                  <span><strong>Real-time Limits:</strong> WebSocket connection limits</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-500">⚠</span>
                  <span><strong>No Offline Support:</strong> Requires internet connection</span>
                </li>
              </ul>
            </div>
          </div>

          <h2 className="section-title mt-12">12. Future Work</h2>
          
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-3">Short-term</h4>
              <ul className="text-sm space-y-2">
                <li>• Email Notifications</li>
                <li>• PDF Report Generation</li>
                <li>• Bulk Import/Export</li>
                <li>• Two-Factor Authentication</li>
              </ul>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-3">Medium-term</h4>
              <ul className="text-sm space-y-2">
                <li>• ML Risk Scoring</li>
                <li>• Mobile Application</li>
                <li>• Multi-language Support</li>
                <li>• Advanced Analytics</li>
              </ul>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-3">Long-term</h4>
              <ul className="text-sm space-y-2">
                <li>• AI Chatbot</li>
                <li>• Blockchain Integration</li>
                <li>• Payment Gateway API</li>
                <li>• Identity Verification</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section 13: Conclusion */}
        <div className="page p-12 page-break">
          <h2 className="section-title">13. Conclusion</h2>
          
          <p className="text-justify mb-6 leading-relaxed">
            Guardian Shield is a comprehensive <strong>Online Fraud Management System</strong> that successfully 
            demonstrates the application of DBMS concepts in a real-world scenario.
          </p>

          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-8">
            <h3 className="font-semibold text-blue-900 mb-4">Key Achievements</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex gap-2"><span className="text-green-600">✓</span> Normalized Database Design: 18 tables following 3NF</div>
              <div className="flex gap-2"><span className="text-green-600">✓</span> Complex Relationships: Proper FK constraints</div>
              <div className="flex gap-2"><span className="text-green-600">✓</span> Security Implementation: RLS with 4 distinct roles</div>
              <div className="flex gap-2"><span className="text-green-600">✓</span> Advanced SQL: Functions, triggers, views, CTEs</div>
              <div className="flex gap-2"><span className="text-green-600">✓</span> Real-time Capabilities: WebSocket notifications</div>
              <div className="flex gap-2"><span className="text-green-600">✓</span> Full CRUD Operations: Complete data management</div>
              <div className="flex gap-2"><span className="text-green-600">✓</span> Audit Logging: Comprehensive activity tracking</div>
            </div>
          </div>

          <h3 className="subsection-title">Technical Stack</h3>
          <table className="data-table mb-8">
            <thead>
              <tr><th>Layer</th><th>Technology</th></tr>
            </thead>
            <tbody>
              <tr><td>Frontend</td><td>React 18, TypeScript, Tailwind CSS, shadcn/ui</td></tr>
              <tr><td>Backend</td><td>Supabase (PostgreSQL), Edge Functions</td></tr>
              <tr><td>Database</td><td>PostgreSQL 14+ with Row-Level Security</td></tr>
              <tr><td>Real-time</td><td>Supabase Realtime (WebSocket)</td></tr>
              <tr><td>Storage</td><td>Supabase Storage</td></tr>
              <tr><td>Authentication</td><td>Supabase Auth</td></tr>
            </tbody>
          </table>

          <div className="bg-gray-100 p-6 rounded-lg text-center">
            <h3 className="font-semibold mb-2">Learning Outcomes</h3>
            <p className="text-sm text-gray-600">
              Database design and normalization • SQL query optimization • Security policy implementation • 
              Real-time database subscriptions • Full-stack application development
            </p>
          </div>

          <div className="mt-12 text-center text-gray-500 border-t pt-8">
            <p className="font-semibold">Guardian Shield - Online Fraud Management System</p>
            <p>Report Generated: January 2026</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page-break { page-break-before: always; }
          .report-container { padding: 0; }
          .page { padding: 40px !important; }
          .cover-page { height: 100vh; page-break-after: always; }
        }
        
        @media screen {
          .report-container { max-width: 900px; margin: 0 auto; padding: 20px; }
          .page { margin-bottom: 40px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-radius: 8px; }
          .cover-page { min-height: 90vh; }
        }
        
        .section-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e3a8a;
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 0.5rem;
          margin-bottom: 1.5rem;
        }
        
        .subsection-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.75rem;
          margin-top: 1.5rem;
        }
        
        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }
        
        .data-table th {
          background: #1e3a8a;
          color: white;
          padding: 10px 12px;
          text-align: left;
          font-weight: 600;
        }
        
        .data-table td {
          padding: 8px 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .data-table tr:nth-child(even) { background: #f9fafb; }
        .data-table tr:hover { background: #f3f4f6; }
        
        .code-block {
          background: #1e293b;
          color: #e2e8f0;
          padding: 16px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-family: 'Fira Code', 'Monaco', monospace;
          overflow-x: auto;
          margin-bottom: 1rem;
          line-height: 1.5;
          white-space: pre-wrap;
        }
        
        .feature-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
        }
        
        .feature-title {
          font-weight: 600;
          color: #1e3a8a;
          margin-bottom: 8px;
          font-size: 0.9rem;
        }
        
        .feature-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .feature-list li {
          padding: 4px 0;
          padding-left: 20px;
          position: relative;
        }
        
        .feature-list li::before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #22c55e;
        }
      `}</style>
    </>
  );
};

export default ProjectReport;
