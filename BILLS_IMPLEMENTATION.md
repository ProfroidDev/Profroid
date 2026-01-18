# Bills Feature Implementation Summary

## Overview
This document outlines the complete implementation of the Bills feature for the Profroid application. The system automatically creates bills from service reports and allows customers to view their bills while admins can manage and track payment status.

## Architecture

### Key Features
- **Automatic Bill Generation**: Bills are automatically created when a report is generated using the existing BillIdGenerator
- **Payment Status Tracking**: Bills display PAID/UNPAID status with automatic timestamp tracking
- **Customer Portal**: Customers can view all their bills with filtering and search capabilities
- **Admin Dashboard**: Admins see bill payment status in the Service Reports page
- **Permission-Based Access**: Customers only see their own bills; admins see all bills

---

## Backend Implementation

### 1. Database Entity - Bill.java
**Location**: `backend/src/main/java/com/profroid/profroidapp/reportsubdomain/dataAccessLayer/Bill.java`

**Fields**:
- `billId`: Unique identifier (generated format: BILL-2026-000001)
- `report`: One-to-One relationship with Report
- `customer`: Many-to-One relationship with Customer
- `appointment`: One-to-One relationship with Appointment
- `amount`: Total amount from report
- `status`: BillStatus enum (UNPAID/PAID)
- `createdAt`: Timestamp of bill creation
- `updatedAt`: Timestamp of last update
- `paidAt`: Timestamp when marked as paid

### 2. Repository - BillRepository.java
**Location**: `backend/src/main/java/com/profroid/profroidapp/reportsubdomain/dataAccessLayer/BillRepository.java`

**Key Methods**:
- `findByBillId(String billId)`: Retrieve by bill ID
- `findByReport_Id(Integer reportId)`: Retrieve by report ID
- `findByCustomer_Id(String customerId)`: Get all customer bills
- `findByCustomer_IdAndStatus()`: Filter customer bills by status
- `findByStatus()`: Get all bills by status
- `findByAppointment_AppointmentIdentifier_AppointmentId()`: Get bill by appointment

### 3. Service Layer
**Interface**: `backend/src/main/java/com/profroid/profroidapp/reportsubdomain/businessLayer/BillService.java`

**Implementation**: `BillServiceImpl.java`

**Key Methods**:
- `getBillById()`: Retrieve single bill with permission checks
- `getBillByReportId()`: Get bill for a specific report
- `getCustomerBills()`: Get all bills for a customer
- `getAllBills()`: Get all bills (admin only)
- `updateBillStatus()`: Update payment status (admin only)
- `getBillByAppointmentId()`: Get bill by appointment

**Permission Logic**:
- **CUSTOMER**: Can only view their own bills
- **ADMIN**: Can view all bills and update payment status
- **TECHNICIAN**: No access to bills

### 4. Mapper - BillResponseMapper.java
**Location**: `backend/src/main/java/com/profroid/profroidapp/reportsubdomain/mappingLayer/BillResponseMapper.java`

Converts Bill entity to BillResponseModel DTO for API responses.

### 5. Presentation Models
- **BillResponseModel**: DTO for API responses containing bill information

### 6. Controller - BillController.java
**Location**: `backend/src/main/java/com/profroid/profroidapp/reportsubdomain/presentationLayer/BillController.java`

**Endpoints**:
- `GET /api/v1/bills/{billId}` - Get bill by ID
- `GET /api/v1/bills/report/{reportId}` - Get bill by report ID
- `GET /api/v1/bills/appointment/{appointmentId}` - Get bill by appointment
- `GET /api/v1/bills/customer/{customerId}` - Get customer's bills
- `GET /api/v1/bills` - Get all bills (admin only)
- `PUT /api/v1/bills/{billId}/status?status=PAID|UNPAID` - Update bill status (admin only)

### 7. Automatic Bill Creation
**Modified**: `ReportServiceImpl.java`

When a report is created:
1. Report is saved to database
2. `createBillForReport()` method is automatically triggered
3. Bill is created with:
   - Generated BillIdGenerator ID
   - Reference to the created report
   - Customer from the appointment
   - Total amount from report
   - Status: UNPAID by default

```java
private void createBillForReport(Report report, Appointment appointment) {
    Bill bill = new Bill();
    bill.setBillId(BillIdGenerator.generateBillId());
    bill.setReport(report);
    bill.setCustomer(appointment.getCustomer());
    bill.setAppointment(appointment);
    bill.setAmount(report.getTotal());
    bill.setStatus(Bill.BillStatus.UNPAID);
    
    billRepository.save(bill);
}
```

---

## Frontend Implementation

### 1. Bill Model
**Location**: `frontend/src/features/report/models/BillResponseModel.ts`

TypeScript interface matching the backend DTO:
```typescript
export interface BillResponseModel {
  billId: string;
  reportId: string;
  reportInternalId: number;
  appointmentId: string;
  appointmentDate: string;
  customerId: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  jobName: string;
  amount: number;
  status: 'UNPAID' | 'PAID';
  createdAt: string;
  updatedAt?: string;
  paidAt?: string;
}
```

### 2. API Service
**Location**: `frontend/src/features/report/api/getBills.ts`

**Functions**:
- `getBillById(billId)` - Get single bill
- `getBillByReportId(reportId)` - Get bill by report
- `getBillByAppointmentId(appointmentId)` - Get bill by appointment
- `getCustomerBills(customerId)` - Get all customer bills
- `getAllBills()` - Get all bills (admin)
- `updateBillStatus(billId, status)` - Update payment status

### 3. Customer Bills Page
**Location**: `frontend/src/pages/Customer/CustomerBills.tsx`

**Features**:
- Display all customer bills in a table
- Search functionality (bill ID, job name, appointment date)
- Filter by status (All, Unpaid, Paid)
- Pagination (10 items per page)
- Summary cards showing:
  - Total amount of bills
  - Outstanding balance (unpaid amount)
- Responsive design
- Toast notifications for errors/success

**UI Components**:
- Header with page title and summary cards
- Search bar and filter buttons
- Bills table with:
  - Bill ID
  - Job Name
  - Appointment Date
  - Amount
  - Payment Status badge
  - Created Date
- Empty state message
- Pagination controls

### 4. Customer Bills Styling
**Location**: `frontend/src/pages/Customer/CustomerBills.css`

Comprehensive styling including:
- Summary cards with hover effects
- Responsive table layout
- Status badges (PAID: green, UNPAID: amber)
- Search and filter controls
- Toast notifications
- Mobile responsiveness

### 5. Admin Service Reports - Enhanced
**Modified**: `frontend/src/pages/Reports/ServiceReports.tsx`

**Changes**:
- Import bill-related APIs and models
- Load all bills on page mount
- Create Map of bills indexed by reportId for quick lookup
- Add `getBillStatusBadge()` helper function
- Display bill status in reports table

**New Column**: Bill Status
- Shows PAID (green), UNPAID (amber), or Pending (gray)
- Automatically updated when bills are created

**New CSS Classes**:
```css
.bill-status-badge.paid      /* Green background */
.bill-status-badge.unpaid    /* Amber background */
.bill-status-badge.pending   /* Gray background */
```

### 6. Routing
**Modified**: `frontend/src/App.tsx`

**New Route**:
```typescript
<Route
  path="/my-bills"
  element={
    <ProtectedRoute>
      <CustomerBills />
    </ProtectedRoute>
  }
/>
```

### 7. Navigation Updates
**Modified**: `frontend/src/shared/components/Navigation.tsx`

Added "My Bills" link in both desktop and mobile navigation:
```typescript
{user?.role === "customer" && (
  <>
    <a href="/services">{t("navigation.services")}</a>
    <a href="/my-appointments">{t("navigation.myAppointments")}</a>
    <a href="/my-bills">{t("navigation.myBills")}</a>
  </>
)}
```

**I18n Key Required**: `navigation.myBills`

---

## User Workflows

### Customer Workflow
1. Customer completes a service appointment
2. Technician creates a report for the completed appointment
3. **Automatic**: Bill is created with UNPAID status
4. Customer navigates to "My Bills" page
5. Customer can:
   - View all their bills
   - Search by bill ID, job name, or date
   - Filter by payment status
   - See outstanding balance

### Admin Workflow
1. Admin views "Service Reports" page
2. Admin can see new "Bill Status" column for each report
3. Admin can identify which reports have paid/unpaid bills
4. To mark bill as paid, admin calls update endpoint (future Stripe integration)
5. Bill status updates to PAID with timestamp

---

## Database Considerations

### Migration
A new table needs to be created:

```sql
CREATE TABLE bills (
  id INT PRIMARY KEY AUTO_INCREMENT,
  bill_id VARCHAR(20) UNIQUE NOT NULL,
  report_id INT NOT NULL UNIQUE,
  customer_id VARCHAR(255) NOT NULL,
  appointment_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  paid_at TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id),
  FOREIGN KEY (customer_id) REFERENCES user_profiles(id),
  FOREIGN KEY (appointment_id) REFERENCES appointments(id),
  INDEX (customer_id),
  INDEX (status),
  INDEX (created_at)
);
```

---

## Future Enhancements

### Stripe Payment Integration
1. Add payment processing endpoint
2. Update bill status when payment succeeds
3. Store payment method information
4. Add retry logic for failed payments

### Invoice Generation
1. Generate PDF invoices for bills
2. Email invoices to customers
3. Store invoice PDFs in file system

### Payment Reminders
1. Send reminders for unpaid bills
2. Configurable reminder frequency
3. Dunning management

### Reports & Analytics
1. Revenue reports
2. Payment status analytics
3. Customer payment history

### Recurring Bills
1. Support for ongoing services
2. Auto-bill feature
3. Subscription management

---

## Testing Considerations

### Backend Tests
- [ ] Test automatic bill creation on report creation
- [ ] Test bill retrieval with permission checks
- [ ] Test bill status updates
- [ ] Test bill queries by various filters
- [ ] Test concurrent bill creation

### Frontend Tests
- [ ] Test customer bills page loads correctly
- [ ] Test search functionality
- [ ] Test filter functionality
- [ ] Test pagination
- [ ] Test bill status badge displays correctly in reports
- [ ] Test navigation link accessibility

### Integration Tests
- [ ] End-to-end report to bill creation
- [ ] Permission-based access control
- [ ] Data consistency between backend and frontend

---

## Notes for Developers

1. **BillIdGenerator**: Already exists in the codebase and is thread-safe
2. **Tax Calculation**: Bills inherit amounts from reports (which include taxes)
3. **Payment Processing**: Currently manual status updates; future Stripe integration needed
4. **Customer Communication**: No email notifications implemented yet
5. **Audit Trail**: Created timestamps are tracked; consider adding who changed status

---

## Deployment Checklist

- [ ] Run database migrations to create bills table
- [ ] Deploy backend changes
- [ ] Deploy frontend changes
- [ ] Verify BillIdGenerator initializes correctly
- [ ] Test bill creation with new reports
- [ ] Verify customer bills page loads
- [ ] Verify admin reports show bill status
- [ ] Monitor logs for any errors
- [ ] Test with sample data
