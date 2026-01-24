# Review System - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Backend service running on `http://localhost:8080`
- Frontend service running on `http://localhost:5173`
- Database (MySQL/PostgreSQL) with reviews table created

## 📦 Setup

### 1. Database Setup

Run the migration script to create the reviews table:

```bash
# If using Flyway (recommended)
# Migration will run automatically on backend startup

# Or manually execute:
# MySQL:
mysql -u your_user -p your_database < backend/src/main/resources/db/migration/V1__create_reviews_table.sql

# PostgreSQL:
psql -U your_user -d your_database -f backend/src/main/resources/db/migration/V1__create_reviews_table.sql
```

### 2. Backend Startup

```bash
cd backend
./gradlew bootRun
```

Backend will start on `http://localhost:8080`

### 3. Frontend Startup

```bash
cd frontend
npm install  # If not already installed
npm run dev
```

Frontend will start on `http://localhost:5173`

## 🎯 Testing the Review System

### As a Customer (Submit Review)

1. **Open home page**: Navigate to `http://localhost:5173/`
2. **Scroll to feedback section**: Find "We Value Your Feedback"
3. **Fill the form**:
   - Enter your name (required)
   - Select a star rating (1-5, required)
   - Add optional comment
4. **Submit**: Click "Submit Feedback"
5. **See confirmation**: Success message appears
6. **Note**: Your review is now PENDING and won't appear publicly until approved

### As an Admin (Manage Reviews)

1. **Login as admin**:
   ```
   Go to: http://localhost:5173/auth/login
   Use admin credentials
   ```

2. **Navigate to Reviews**: Click "Reviews" in the navigation menu

3. **View reviews**:
   - See all submitted reviews
   - Use filter tabs: All | Pending | Approved | Rejected

4. **Approve a review**:
   - Click "Approve" button on a pending review
   - Review will now appear on home page

5. **Reject a review**:
   - Click "Reject" button to hide it from public

6. **Delete a review**:
   - Click "Delete" button
   - Confirm deletion in modal
   - Review is permanently removed

### Verify Public Display

1. **Go to home page**: `http://localhost:5173/`
2. **Scroll to testimonials**: Find "Customer Testimonials" section
3. **See approved reviews**: Only APPROVED reviews appear here
4. **Note**: Pending and rejected reviews are NOT shown

## 🔒 Admin Access

### Default Admin User

If you don't have an admin account, create one through your auth service:

```bash
# Using your existing auth service registration
# Make sure to set role = "admin" in the database

# Or use the auth service API to create admin user
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "admin@profroid.com",
  "password": "Admin123!@#",
  "firstName": "Admin",
  "lastName": "User"
}

# Then update the role in database:
UPDATE user_profiles SET role = 'admin' WHERE user_id = 'your-user-id';
```

## 📝 API Testing (Using curl or Postman)

### 1. Submit a Review (Public)

```bash
curl -X POST http://localhost:8080/api/v1/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "comment": "Excellent service! Very professional and quick.",
    "customerName": "John Doe"
  }'
```

### 2. Get All Reviews (Admin Only)

```bash
curl -X GET http://localhost:8080/api/v1/reviews \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### 3. Get Approved Reviews (Public)

```bash
curl -X GET http://localhost:8080/api/v1/reviews/approved
```

### 4. Approve a Review (Admin Only)

```bash
curl -X PATCH http://localhost:8080/api/v1/reviews/REV-12345678/status \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "APPROVED"
  }'
```

### 5. Delete a Review (Admin Only)

```bash
curl -X DELETE http://localhost:8080/api/v1/reviews/REV-12345678 \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

## 🔍 Troubleshooting

### Review Not Appearing on Home Page

**Problem**: Submitted review doesn't show in testimonials section

**Solution**: 
- Check review status - it must be APPROVED
- Admin must approve it from `/reviews` page
- Pending and rejected reviews don't appear publicly

### Cannot Access /reviews Page

**Problem**: 403 Forbidden error when accessing review management page

**Solution**:
- Ensure you're logged in as admin
- Check user role in database: `SELECT role FROM user_profiles WHERE user_id = 'your-id'`
- Role must be exactly "admin" (case-insensitive in backend)

### API Returns 401 Unauthorized

**Problem**: Cannot access admin endpoints

**Solution**:
- Ensure you're including JWT token in Authorization header
- Token format: `Bearer YOUR_JWT_TOKEN`
- Login again if token expired

### Database Table Not Found

**Problem**: Error: `Table 'reviews' doesn't exist`

**Solution**:
```sql
-- Manually create table
CREATE TABLE reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    review_id VARCHAR(255) NOT NULL UNIQUE,
    rating INTEGER NOT NULL,
    comment TEXT,
    customer_name VARCHAR(255) NOT NULL,
    customer_id VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    reviewed_by VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL
);
```

### CORS Errors

**Problem**: Frontend cannot connect to backend API

**Solution**:
- Check backend CORS configuration
- Verify `VITE_BACKEND_URL` in `frontend/.env`
- Should be: `VITE_BACKEND_URL=http://localhost:8080/api/v1`

## 📊 Sample Data

### Insert Test Reviews (Directly in Database)

```sql
-- Approved review
INSERT INTO reviews (review_id, rating, comment, customer_name, status, created_at, updated_at)
VALUES ('REV-TEST001', 5, 'Amazing service! Highly recommend.', 'Jane Smith', 'APPROVED', NOW(), NOW());

-- Pending review
INSERT INTO reviews (review_id, rating, comment, customer_name, status, created_at, updated_at)
VALUES ('REV-TEST002', 4, 'Good experience overall.', 'Bob Johnson', 'PENDING', NOW(), NOW());

-- Rejected review
INSERT INTO reviews (review_id, rating, comment, customer_name, status, created_at, updated_at)
VALUES ('REV-TEST003', 2, 'Not great.', 'Anonymous', 'REJECTED', NOW(), NOW());
```

## 🎨 Customization

### Change Review Card Style

Edit: `frontend/src/pages/Review/ReviewManagement.css`

### Modify Testimonials Display

Edit: `frontend/src/pages/Home/components/TestimonialsSection.tsx`

### Adjust Feedback Form

Edit: `frontend/src/pages/Home/components/FeedbackSection.tsx`

## 📈 Monitoring

### Check Review Statistics

```sql
-- Count by status
SELECT status, COUNT(*) as count 
FROM reviews 
GROUP BY status;

-- Average rating
SELECT AVG(rating) as avg_rating 
FROM reviews 
WHERE status = 'APPROVED';

-- Recent submissions
SELECT review_id, customer_name, rating, status, created_at 
FROM reviews 
ORDER BY created_at DESC 
LIMIT 10;
```

## 🆘 Support

For issues or questions:
1. Check the main documentation: `REVIEW_SYSTEM_IMPLEMENTATION.md`
2. Review API endpoints in backend controller
3. Check browser console for frontend errors
4. Review backend logs for API errors

## ✅ Success Checklist

- [ ] Database table created
- [ ] Backend service running
- [ ] Frontend service running
- [ ] Can submit review as customer
- [ ] Review appears in admin panel
- [ ] Can approve/reject reviews as admin
- [ ] Approved reviews appear on home page
- [ ] Pending/rejected reviews don't appear publicly
- [ ] Can delete reviews as admin
- [ ] Navigation link works
- [ ] Both languages (EN/FR) work

## 🎉 You're Ready!

Your review system is now fully operational. Users can submit reviews, admins can moderate them, and approved reviews will be displayed on your home page!
