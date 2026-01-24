# Review System - Testing Guide

## ✅ Quick Test Checklist

### Step 1: Verify Navigation Shows "Reviews" Link
1. **Login as Admin**
   - Go to: `http://localhost:5173/auth/login`
   - Login with admin credentials
   - Check the navigation bar at the top

2. **Expected Result**:
   - You should see a "Reviews" link in the navigation menu
   - Desktop: Between "Reports" and "Customers"
   - Mobile: In the hamburger menu

### Step 2: Submit a Test Review
1. **Go to Home Page**: `http://localhost:5173/`
2. **Scroll down** to "We Value Your Feedback" section
3. **Fill the form**:
   - Name: "Test Customer"
   - Rating: 5 stars (click on the 5th star)
   - Comment: "This is a test review from the feedback form"
4. **Click "Submit Feedback"**
5. **Expected**: Success message appears

### Step 3: Access Review Management Page
1. **Click "Reviews"** in the navigation (must be logged in as admin)
2. **URL**: Should navigate to `http://localhost:5173/reviews`
3. **Expected**: 
   - You see "Review Management" page title
   - Filter tabs: All | Pending | Approved | Rejected
   - Your test review appears in a card
   - Status badge shows "Pending" (yellow)
   - Action buttons: Approve, Reject, Delete

### Step 4: Approve the Review
1. **Find your test review** in the list
2. **Click "Approve"** button (green button with checkmark)
3. **Expected**:
   - Toast notification: "Review approved successfully"
   - Status badge changes to "Approved" (green)
   - Page refreshes automatically

### Step 5: Verify Review Appears on Home Page
1. **Go back to Home Page**: `http://localhost:5173/`
2. **Scroll down** to "Customer Testimonials" section
3. **Expected**:
   - Your approved review is now visible
   - Shows 5 stars
   - Shows "Test Customer" name
   - Shows your comment
   - **IMPORTANT**: Hardcoded testimonials should be REPLACED by your review (not added to them)

### Step 6: Test Review Rejection
1. **Go back to Reviews page**: `http://localhost:5173/reviews`
2. **Click "Revoke Approval"** or find another pending review
3. **Click "Reject"** button (red button with X)
4. **Expected**:
   - Status changes to "Rejected"
   - Toast notification appears

5. **Go to Home Page** and check testimonials
6. **Expected**: Rejected review does NOT appear

### Step 7: Test Review Deletion
1. **Go to Reviews page**
2. **Click "Delete"** button (gray button with trash icon)
3. **Confirm deletion** in the modal
4. **Expected**:
   - Review is removed from the list
   - Toast notification: "Review deleted successfully"

## 🔧 Troubleshooting

### Problem: "Reviews" link doesn't appear in navigation

**Solution**:
1. Make sure you're logged in as admin
2. Check user role in browser console:
   ```javascript
   // Open browser console (F12)
   console.log(localStorage.getItem('auth-storage'))
   ```
3. Look for `"role":"admin"` in the output
4. If role is not admin, update in database or login with admin account

### Problem: Cannot access /reviews page (403 Forbidden)

**Reason**: User doesn't have admin role

**Solution**:
- Login with admin credentials
- Or update user role in database:
  ```sql
  UPDATE user_profiles SET role = 'admin' WHERE user_id = 'your-user-id';
  ```

### Problem: Reviews don't appear on home page after approval

**Check**:
1. Review status is "APPROVED" (not "PENDING" or "REJECTED")
2. Browser console for errors (F12 → Console tab)
3. Network tab shows successful API call to `/reviews/approved`
4. Backend is running on port 8080

**Solution**:
- Refresh home page
- Clear browser cache
- Check backend logs for errors

### Problem: Hardcoded testimonials still showing with approved reviews

**Expected Behavior**:
- If you have approved reviews → ONLY approved reviews show
- If you have NO approved reviews → Hardcoded testimonials show as fallback
- They should NOT mix together

**To Test**:
1. Delete all approved reviews
2. Refresh home page → Should see hardcoded testimonials
3. Approve one review
4. Refresh home page → Should see ONLY your approved review(s)

### Problem: Review submission returns error

**Check**:
1. Backend is running
2. Database table `reviews` exists
3. Browser console for error details
4. Backend logs for stack trace

**Common Issues**:
- Missing name field → Error: "Customer name is required"
- Rating not selected → Submit button should be disabled
- Backend not running → Network error

## 🎯 Expected Behavior Summary

### Before Any Reviews Are Approved
- Home page shows **hardcoded testimonials** (3 default ones)
- Admin can see all submitted reviews in `/reviews` page
- All new reviews start with "PENDING" status

### After First Review Is Approved
- Home page **replaces** hardcoded testimonials with **ONLY approved reviews**
- Multiple approved reviews can exist
- They appear in the scrolling carousel

### Review Lifecycle
```
Customer submits → PENDING → Admin approves → APPROVED → Shows on home page
                           ↓ Admin rejects
                         REJECTED → Hidden from home page
                           ↓ Admin deletes
                         DELETED → Permanently removed
```

## 📊 Quick Database Check

```sql
-- Check all reviews
SELECT review_id, customer_name, rating, status, created_at 
FROM reviews 
ORDER BY created_at DESC;

-- Check approved reviews only
SELECT review_id, customer_name, rating, comment 
FROM reviews 
WHERE status = 'APPROVED';

-- Count reviews by status
SELECT status, COUNT(*) 
FROM reviews 
GROUP BY status;
```

## ✨ Success Criteria

- [x] Reviews link appears in admin navigation
- [x] Can access `/reviews` page as admin
- [x] Can submit review from home page
- [x] Submitted review appears in admin panel as PENDING
- [x] Can approve review
- [x] Approved review appears on home page
- [x] Approved review REPLACES hardcoded testimonials
- [x] Can reject review
- [x] Rejected review doesn't appear on home page
- [x] Can delete review
- [x] Filter tabs work (All, Pending, Approved, Rejected)

## 🚀 You're All Set!

Once you've completed these tests, your review system is fully operational!
