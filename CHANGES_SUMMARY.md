# Service Page Permission Changes - Summary

## Overview

Implemented role-based access control for the Services page. Only admins can now perform CRUD operations (Create, Update, Delete/Deactivate). Customers and Employees can only view service names, prices, and descriptions.

## Frontend Changes

### 1. **ServicesPage.tsx** (/frontend/src/pages/jobs/ServicesPage.tsx)

- ✅ Added `useAuthStore` to get user role
- ✅ Only show "+ Add Service" button for admin users
- ✅ Hide "Modify", "Deactivate", and "Reactivate" buttons for non-admin users
- ✅ Implement description truncation for customers/employees
- ✅ Show expand/collapse arrow for long descriptions (>150 characters)
- ✅ Added error logging to help debug API issues

### 2. **ServicesPage.css** (/frontend/src/pages/jobs/ServicesPage.css)

- ✅ Added `.service-description-wrapper` for description container
- ✅ Added `.service-desc.collapsed` class to truncate to 2 lines
- ✅ Added `.service-desc.expanded` class for full text
- ✅ Added `.description-expand-btn` for the expand/collapse button

### 3. **Navigation.tsx** (/frontend/src/shared/components/Navigation.tsx)

- ✅ Added "/services" link to Admin menu
- ✅ Added "/services" link to Technician (Employee) menu
- ✅ Services link already existed for Customers
- ✅ Updated both desktop and mobile navigation menus

## Backend Changes

### 1. **JobController.java** (/backend/src/main/java/com/profroid/profroidapp/jobssubdomain/presentationLayer/JobController.java)

- ✅ Added `@PreAuthorize("hasRole('ADMIN')")` annotation to:

  - `createJob()` - POST /api/v1/jobs
  - `updateJob()` - PUT /api/v1/jobs/{jobId}
  - `deactivateJob()` - DELETE /api/v1/jobs/{jobId}/deactivate
  - `reactivateJob()` - PATCH /api/v1/jobs/{jobId}/reactivate

- ✅ Left public (no authorization required):
  - `getAllJobs()` - GET /api/v1/jobs
  - `getJobById()` - GET /api/v1/jobs/{jobId}

## API Endpoints Protected

| Endpoint                          | Method | Authorization | Visibility |
| --------------------------------- | ------ | ------------- | ---------- |
| `/api/v1/jobs`                    | GET    | Public        | All users  |
| `/api/v1/jobs/{jobId}`            | GET    | Public        | All users  |
| `/api/v1/jobs`                    | POST   | ADMIN ONLY    | Admin only |
| `/api/v1/jobs/{jobId}`            | PUT    | ADMIN ONLY    | Admin only |
| `/api/v1/jobs/{jobId}/deactivate` | DELETE | ADMIN ONLY    | Admin only |
| `/api/v1/jobs/{jobId}/reactivate` | PATCH  | ADMIN ONLY    | Admin only |

## Security Layers

1. **Frontend (UI Level)**: Buttons are hidden for non-admin users
2. **Backend (API Level)**: Spring Security `@PreAuthorize` blocks unauthorized requests with 403 Forbidden

## User Permissions

### Admin

- ✅ View all services (name, price, description, details)
- ✅ Add new service
- ✅ Modify/Update service
- ✅ Deactivate/Reactivate service
- ✅ See "Services" in navbar

### Customer

- ✅ View all services (name, price, description - with expand/collapse for long descriptions)
- ❌ Cannot add, modify, or delete services
- ✅ See "Services" in navbar

### Employee (Technician)

- ✅ View all services (name, price, description - with expand/collapse for long descriptions)
- ❌ Cannot add, modify, or delete services
- ✅ See "Services" in navbar

## Testing Checklist

1. **Admin User**:

   - [ ] Login as admin
   - [ ] Navigate to Services from navbar
   - [ ] Verify "+ Add Service" button appears
   - [ ] Verify "Modify", "Deactivate"/"Reactivate" buttons appear
   - [ ] Test creating a new service
   - [ ] Test modifying a service
   - [ ] Test deactivating/reactivating a service

2. **Customer User**:

   - [ ] Login as customer
   - [ ] Navigate to Services from navbar
   - [ ] Verify "+ Add Service" button does NOT appear
   - [ ] Verify "Modify", "Deactivate"/"Reactivate" buttons do NOT appear
   - [ ] Verify you can see service names, prices, and descriptions
   - [ ] Test expand/collapse on long descriptions (>150 chars)
   - [ ] Verify "View Details" button does NOT appear for admins only

3. **Employee (Technician) User**:

   - [ ] Login as employee (technician)
   - [ ] Navigate to Services from navbar
   - [ ] Verify "+ Add Service" button does NOT appear
   - [ ] Verify "Modify", "Deactivate"/"Reactivate" buttons do NOT appear
   - [ ] Verify you can see service names, prices, and descriptions
   - [ ] Test expand/collapse on long descriptions (>150 chars)

4. **Security Tests**:
   - [ ] Try to call POST /api/v1/jobs as customer (should get 403)
   - [ ] Try to call PUT /api/v1/jobs/{id} as customer (should get 403)
   - [ ] Try to call DELETE /api/v1/jobs/{id}/deactivate as customer (should get 403)
   - [ ] Verify GET /api/v1/jobs works for all roles

## Troubleshooting

### Services Not Loading

If you see "Loading services..." but nothing appears:

1. Check browser console (F12) for API errors
2. Verify `VITE_BACKEND_URL` is set correctly in `frontend/.env`
3. Check that backend is running on port 8080
4. Verify network tab shows requests to `/api/v1/jobs`

The frontend now logs errors, so check the console for helpful messages.

## Files Modified

### Frontend

- `frontend/src/pages/jobs/ServicesPage.tsx`
- `frontend/src/pages/jobs/ServicesPage.css`
- `frontend/src/shared/components/Navigation.tsx`

### Backend

- `backend/src/main/java/com/profroid/profroidapp/jobssubdomain/presentationLayer/JobController.java`

## Environment Variables (Already Configured)

- `VITE_BACKEND_URL=http://localhost:8080/api/v1` (frontend/.env)
