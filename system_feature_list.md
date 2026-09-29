# Comprehensive System Feature List

##  Module
### /
**Page Title/Component:** Home

## Academics Module
### /(app)/academics
**Page Title/Component:** Overview Metrics

### /(app)/academics/academic-years
**Page Title/Component:** AcademicYearsPage

### /(app)/academics/classes
**Page Title/Component:** Classes
**Key Actions/Features:** { setEditId(null); setForm({ name: "", numeric_level: 0 }); }}
                    >
                      Cancel, {editId ? "Update" : "Add"}

### /(app)/academics/sections
**Page Title/Component:** SectionsPage

### /(app)/academics/subjects
**Page Title/Component:** SubjectsPage

## Admissions Module
### /admissions
**Page Title/Component:** AdmissionsDirectory

### /admissions/[slug]/apply
**Page Title/Component:** ApplyPage

## Admissions Review Module
### /(app)/admissions-review
**Page Title/Component:** AdmissionsReviewPage

## Attendance Module
### /(app)/attendance
**Page Title/Component:** Roster
**Key Actions/Features:** }
            onClick={loadRoster}
            disabled={!sectionId}
          >
            Load Roster, markAll('present')}>Present, }
                    onClick={save}
                    size="large"
                  >
                    Save Attendance, markAll('absent')}>Absent, setStatus(s.id, st)}
                                  sx={{ textTransform: 'capitalize', width: 80 }}
                                >
                                  {st}

### /(app)/attendance/reports
**Page Title/Component:** Monthly Attendance: {new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
**Key Actions/Features:** }
              onClick={() => window.print()}
            >
              Print, }
            onClick={generateReport}
            disabled={!sectionId || !month}
          >
            Generate Report

## Biometric Module
### /(app)/biometric
**Page Title/Component:** BiometricPage

## Certificates Module
### /(app)/certificates
**Page Title/Component:** CertificatesPage

### /(app)/certificates/generate
**Page Title/Component:** Issue New Certificate
**Key Actions/Features:** {loading ? "Generating..." : "Generate & Issue"}

### /(app)/certificates/types
**Page Title/Component:** Supported Certificate Types

## Communication Module
### /(app)/communication
**Page Title/Component:** School Announcements

### /(app)/communication/messages
**Page Title/Component:** Direct Messages

## Dashboard Module
### /(app)/dashboard
**Page Title/Component:** Dashboard

## Designations Module
### /(app)/designations
**Page Title/Component:** DesignationsPage

## Events Module
### /(app)/events
**Page Title/Component:** Upcoming Schedule

### /(app)/events/list
**Page Title/Component:** Events List

## Exams Module
### /(app)/exams
**Page Title/Component:** ExamsPage

### /(app)/exams/[id]
**Page Title/Component:** ExamDetailPage

### /(app)/exams/marks
**Page Title/Component:** MarksEntryPage
**Key Actions/Features:** }
                onClick={saveMarks}
                disabled={saving}
                size="large"
              >
                {saving ? "Saving..." : "Save Marks"}, }
                onClick={loadRoster}
                disabled={!selectedSection || !selectedExamSubject}
              >
                Load Roster

### /(app)/exams/results
**Page Title/Component:** Tabulation Sheet
**Key Actions/Features:** }
                onClick={generateResults}
                disabled={!selectedSection || !selectedSession}
              >
                Generate Sheet, }
                    onClick={() => window.print()}
                  >
                    Print Sheet

### /(app)/exams/schedule
**Page Title/Component:** ExamSchedulePage
**Key Actions/Features:** } 
            onClick={openAdd}
            disabled={!hasLoaded || !selectedSession || !selectedClass}
            color="success"
          >
            Add Subject to Schedule, {saving ? "Saving..." : "Save Schedule"}, setDialogOpen(false)}>Cancel, }
            onClick={loadSchedule}
            disabled={!selectedSession || !selectedClass}
          >
            Load Schedule

## Fees Module
### /(app)/fees
**Page Title/Component:** FeesPage

## Finance Module
### /(app)/finance
**Page Title/Component:** {kpi.value}
**Key Actions/Features:** View All Collections

### /(app)/finance/collection
**Page Title/Component:** Process Payment
**Key Actions/Features:** Search Invoices, setPaymentDialogOpen(false)} disabled={saving}>Cancel

### /(app)/finance/discounts
**Page Title/Component:** Discounts & Scholarships
**Key Actions/Features:** setOpen(false)} disabled={saving}>Cancel, {saving ? "Saving..." : "Assign Discount"}, } onClick={handleOpen}>
          Assign New Discount

### /(app)/finance/expenses
**Page Title/Component:** ExpensesPage

### /(app)/finance/fee-structure
**Page Title/Component:** FeeStructurePage

### /(app)/finance/invoices
**Page Title/Component:** Invoices Ledger
**Key Actions/Features:** } onClick={addLineItem}>Add Another Item, setOpen(false)} disabled={saving}>Cancel, } onClick={handleOpen}>
          Create Custom Invoice, {saving ? "Generating..." : "Generate Invoice"}

### /(app)/finance/reports
**Page Title/Component:** {formatMoney(metrics.totalDue)}
**Key Actions/Features:** }
                onClick={generateReport} disabled={loading}
              >
                Generate Report

### /(app)/finance/student-fees
**Page Title/Component:** Student Ledger
**Key Actions/Features:** }
                onClick={loadStudentFees}
                disabled={!selectedSection || !selectedClass}
              >
                Load Students, }
                            onClick={() => openLedger(s)}
                          >
                            Ledger, setLedgerOpen(false)}>Close

## Homework Module
### /(app)/homework
**Page Title/Component:** HomeworkPage
**Key Actions/Features:** View Submissions

### /(app)/homework/assignments
**Page Title/Component:** SubmissionsPage
**Key Actions/Features:** setDialogOpen(false)}>Cancel, {saving ? "Saving..." : "Save Grade"}, openGradeDialog(sub)}
                        >
                          {sub.graded_at ? "Update Grade" : "Grade"}

## Hostel Module
### /(app)/hostel
**Page Title/Component:** Hostel Occupancy & Status

### /(app)/hostel/allocation
**Page Title/Component:** HostelAllocationPage

### /(app)/hostel/hostels
**Page Title/Component:** HostelsPage

### /(app)/hostel/rooms
**Page Title/Component:** HostelRoomsPage

## Hr Module
### /(app)/hr
**Page Title/Component:** Staff Distribution by Designation

### /(app)/hr/attendance
**Page Title/Component:** Daily Staff Attendance
**Key Actions/Features:** } 
            onClick={save} 
            disabled={loading || saving}
          >
            {saving ? "Saving..." : "Save Records"}

### /(app)/hr/designations
**Page Title/Component:** Staff Designations

### /(app)/hr/leaves
**Page Title/Component:** Staff Leave Applications

### /(app)/hr/staff
**Page Title/Component:** Staff Records

## Inventory Module
### /(app)/inventory
**Page Title/Component:** Inventory & Assets Dashboard

### /(app)/inventory/categories
**Page Title/Component:** InventoryCategoriesPage

### /(app)/inventory/issues
**Page Title/Component:** Inventory Issues & Returns
**Key Actions/Features:** handleReturn(iss.id)}>
                    Return, Issue

### /(app)/inventory/items
**Page Title/Component:** InventoryItemsPage

### /(app)/inventory/suppliers
**Page Title/Component:** InventorySuppliersPage

## Leaves Module
### /(app)/leaves
**Page Title/Component:** LeavesPage

## Library Module
### /(app)/library
**Page Title/Component:** Recent Issues & Overdue Log

### /(app)/library/books
**Page Title/Component:** LibraryBooksPage

### /(app)/library/issues
**Page Title/Component:** Library Borrowing & Returns
**Key Actions/Features:** Issue Book

## Login Module
### /login
**Page Title/Component:** School Management
**Key Actions/Features:** {busy ? "Signing in..." : "Sign in"}

## Platform Module
### /(super-admin)/platform
**Page Title/Component:** Dashboard Overview
**Key Actions/Features:** Resolve, View

### /(super-admin)/platform/cms/faqs
**Page Title/Component:** Frequently Asked Questions (FAQs)
**Key Actions/Features:** }
          sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
        >
          Add FAQ

### /(super-admin)/platform/cms/testimonials
**Page Title/Component:** Testimonials
**Key Actions/Features:** }
          sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
        >
          Add Testimonial

### /(super-admin)/platform/communication/announcements
**Page Title/Component:** Platform Announcements
**Key Actions/Features:** }
          sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
        >
          New Announcement

### /(super-admin)/platform/communication/logs
**Page Title/Component:** Communication Logs

### /(super-admin)/platform/communication/templates
**Page Title/Component:** Message Templates
**Key Actions/Features:** }
          sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
        >
          Add Template

### /(super-admin)/platform/invoices
**Page Title/Component:** Invoices
**Key Actions/Features:** }
          onClick={() => router.push('/platform/invoices/new')}
        >
          Generate Invoice

### /(super-admin)/platform/invoices/[id]
**Page Title/Component:** Edit Invoice
**Key Actions/Features:** router.push('/platform/invoices')}>Cancel, Update Invoice

### /(super-admin)/platform/invoices/new
**Page Title/Component:** Generate Invoice
**Key Actions/Features:** Save Invoice, router.push('/platform/invoices')}>Cancel

### /(super-admin)/platform/plans
**Page Title/Component:** Subscription Plans
**Key Actions/Features:** }
          onClick={() => router.push('/platform/plans/new')}
          sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
        >
          Add Plan

### /(super-admin)/platform/plans/[id]
**Page Title/Component:** Edit Subscription Plan
**Key Actions/Features:** router.push('/platform/plans')}>Cancel, Update Plan

### /(super-admin)/platform/plans/new
**Page Title/Component:** Add Subscription Plan
**Key Actions/Features:** Save Plan, router.push('/platform/plans')}>Cancel

### /(super-admin)/platform/school-admins
**Page Title/Component:** School Admins

### /(super-admin)/platform/security
**Page Title/Component:** Security Logs

### /(super-admin)/platform/subscriptions
**Page Title/Component:** Subscriptions
**Key Actions/Features:** }
          onClick={() => router.push('/platform/subscriptions/new')}
        >
          Add Subscription

### /(super-admin)/platform/subscriptions/[id]
**Page Title/Component:** Edit Subscription
**Key Actions/Features:** router.push('/platform/subscriptions')}>Cancel, Update

### /(super-admin)/platform/subscriptions/new
**Page Title/Component:** Add Subscription
**Key Actions/Features:** router.push('/platform/subscriptions')}>Cancel, Save

### /(super-admin)/platform/support/kb
**Page Title/Component:** Knowledge Base
**Key Actions/Features:** }
          sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
        >
          Add Article

### /(super-admin)/platform/support/tickets
**Page Title/Component:** Support Tickets

### /(super-admin)/platform/support/tickets/[id]
**Page Title/Component:** Ticket #{ticket.id}: {ticket.subject}
**Key Actions/Features:** router.push('/platform/support/tickets')}>
          Back to Tickets, Save Status

### /(super-admin)/platform/system/email
**Page Title/Component:** Email SMTP Settings
**Key Actions/Features:** Save Settings

### /(super-admin)/platform/system/general
**Page Title/Component:** General Settings
**Key Actions/Features:** Save Settings

### /(super-admin)/platform/system/sms
**Page Title/Component:** SMS Gateway Settings
**Key Actions/Features:** Save Settings

### /(super-admin)/platform/tenants
**Page Title/Component:** Tenants (Schools)
**Key Actions/Features:** }
          onClick={() => router.push('/platform/tenants/new')}
          sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
        >
          Add School

### /(super-admin)/platform/tenants/[id]
**Page Title/Component:** {school.name}
**Key Actions/Features:** } onClick={() => { activeSchool.set(id); router.push(`/dashboard`); }}>Login as Admin, router.push(`/platform/tenants/${id}/edit`)}>Edit, } 
          onClick={() => router.push('/platform/tenants')}
          sx={{ mr: 2, color: 'text.secondary' }}
        >
          Back

### /(super-admin)/platform/tenants/[id]/edit
**Page Title/Component:** Edit School / Tenant
**Key Actions/Features:** Save Changes, router.push(`/platform/tenants/${id}`)}>Cancel

### /(super-admin)/platform/tenants/new
**Page Title/Component:** Add New School
**Key Actions/Features:** Back, Create School, Next

### /(super-admin)/platform/transactions
**Page Title/Component:** Transactions
**Key Actions/Features:** }
          onClick={() => router.push('/platform/transactions/new')}
        >
          Add Transaction

### /(super-admin)/platform/transactions/[id]
**Page Title/Component:** Edit Transaction
**Key Actions/Features:** router.push('/platform/transactions')}>Cancel, Update

### /(super-admin)/platform/transactions/new
**Page Title/Component:** Record Transaction
**Key Actions/Features:** Save, router.push('/platform/transactions')}>Cancel

### /(super-admin)/platform/users
**Page Title/Component:** Platform Users
**Key Actions/Features:** }
          sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
          onClick={() => router.push('/platform/users/new')}
        >
          Add User

### /(super-admin)/platform/users/[id]
**Page Title/Component:** Edit Platform User
**Key Actions/Features:** router.push('/platform/users')}>Cancel, Update User

### /(super-admin)/platform/users/new
**Page Title/Component:** Add Platform User
**Key Actions/Features:** Save User, router.push('/platform/users')}>Cancel

## Print Module
### /print/certificate/[id]
**Page Title/Component:** CertificatePrintPage

### /print/exam/[id]/admit-card/[studentId]
**Page Title/Component:** AdmitCardPage

### /print/exam/[id]/routine
**Page Title/Component:** ExamRoutinePage

### /print/exam/[id]/transcript/[studentId]
**Page Title/Component:** TranscriptPage

### /print/invoice/[id]/receipt
**Page Title/Component:** ReceiptPage

### /print/student/[id]/admission-slip
**Page Title/Component:** {school?.name || "School"}

### /print/student/[id]/id-card
**Page Title/Component:** {school?.name || "School Name"}

## Ratings Module
### /(app)/ratings
**Page Title/Component:** RatingsPage

## Reports Module
### /(app)/reports
**Page Title/Component:** Student Demographics & Analytics

### /(app)/reports/academic
**Page Title/Component:** Academic Overview

### /(app)/reports/finance
**Page Title/Component:** Financial Overview

### /(app)/reports/hr
**Page Title/Component:** Human Resources Overview

## Rooms Module
### /(app)/rooms
**Page Title/Component:** RoomsPage

### /(app)/rooms/[id]
**Page Title/Component:** RoomDetailPage

## School Accounts Module
### /(app)/school-accounts
**Page Title/Component:** School User Accounts

## School Settings Module
### /(app)/school-settings
**Page Title/Component:** School Profile
**Key Actions/Features:** }
                >
                  Save Profile

### /(app)/school-settings/branches
**Page Title/Component:** Manage Branches
**Key Actions/Features:** router.push('/platform/tenants')}
          >
            Go to Platform Console

## Settings Module
### /(app)/settings
**Page Title/Component:** General Operations
**Key Actions/Features:** }
                >
                  Save Operations

### /(app)/settings/notifications
**Page Title/Component:** Notification Preferences
**Key Actions/Features:** }>
              Save Preferences

### /(app)/settings/roles
**Page Title/Component:** System Roles & Permissions

## Staff Attendance Module
### /(app)/staff-attendance
**Page Title/Component:** StaffAttendancePage

## Students Module
### /(app)/students
**Page Title/Component:** Students
**Key Actions/Features:** }
        >
          Add Student

### /(app)/students/[id]
**Page Title/Component:** Personal Profile
**Key Actions/Features:** }
          >
            Edit, Save, } 
                onClick={() => setShowG((s) => !s)}
              >
                Add Guardian, }
          >
            Admission slip, }
          >
            ID card

### /(app)/students/[id]/edit
**Page Title/Component:** EditStudentPage

### /(app)/students/new
**Page Title/Component:** NewStudentPage

## Teachers Module
### /(app)/teachers
**Page Title/Component:** TeachersPage
**Key Actions/Features:** }
        >
          Add Teacher

### /(app)/teachers/[id]
**Page Title/Component:** {t.display_name || t.first_name || "Teacher"}
**Key Actions/Features:** } 
            sx={{ mb: 1, color: 'text.secondary', textTransform: 'none' }}
          >
            Teachers

### /(app)/teachers/[id]/edit
**Page Title/Component:** Edit Teacher
**Key Actions/Features:** router.push("/teachers")}
                >
                  Cancel, {busy ? "Saving…" : "Save Changes"}

### /(app)/teachers/assign-subjects
**Page Title/Component:** AssignSubjectsPage

### /(app)/teachers/designations
**Page Title/Component:** DesignationsPage

### /(app)/teachers/new
**Page Title/Component:** Add Teacher
**Key Actions/Features:** router.push("/teachers")}
                >
                  Cancel, {busy ? "Saving…" : "Save"}

## Timetable Module
### /(app)/timetable
**Page Title/Component:** ClassTimetablePage

### /(app)/timetable/conflicts
**Page Title/Component:** ConflictsPage

### /(app)/timetable/manage
**Page Title/Component:** ManageTimetablePage
**Key Actions/Features:** } 
            onClick={openAdd}
            disabled={!selectedSection}
          >
            Add Routine Slot, setDialogOpen(false)}>Cancel, {saving ? "Saving..." : "Save Slot"}

### /(app)/timetable/teachers
**Page Title/Component:** TeacherTimetablePage

## Transport Module
### /(app)/transport
**Page Title/Component:** Transport Fleet Status

### /(app)/transport/allocation
**Page Title/Component:** TransportAllocationPage

### /(app)/transport/routes
**Page Title/Component:** TransportRoutesPage

### /(app)/transport/vehicles
**Page Title/Component:** TransportVehiclesPage

