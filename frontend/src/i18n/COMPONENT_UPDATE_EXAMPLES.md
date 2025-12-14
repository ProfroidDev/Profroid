/**
 * EXAMPLE: How to update a page component to use i18n
 * 
 * This template shows how to convert a page component to support
 * English and French translations using react-i18next
 */

// BEFORE: Without i18n
// export default function PartsPage() {
//   return (
//     <div>
//       <h1>Parts</h1>
//       <button>Add Part</button>
//       <button>Delete Part</button>
//       {error && <p>An error occurred</p>}
//     </div>
//   );
// }

// AFTER: With i18n - Follow this pattern:

import { useTranslation } from 'react-i18next';

export default function PartsPage() {
  const { t } = useTranslation();  // ← ADD THIS LINE
  
  return (
    <div>
      <h1>{t('pages.parts.title')}</h1>                    {/* ← Use t() function */}
      <button>{t('pages.parts.addPart')}</button>
      <button>{t('common.delete')}</button>
      {error && <p>{t('messages.error')}</p>}             {/* ← All text uses t() */}
    </div>
  );
}

/**
 * COMMON TRANSLATION PATTERNS
 */

// 1. Simple text
<h1>{t('pages.customers.title')}</h1>

// 2. Button labels
<button>{t('common.save')}</button>
<button>{t('pages.employees.deleteEmployee')}</button>

// 3. Error messages
{error && <div>{t('messages.error')}</div>}
{formError && <div>{t('auth.invalidCredentials')}</div>}

// 4. Success messages
<div>{t('messages.success')}</div>
<div>{t('messages.deleted')}</div>

// 5. Form labels
<label>{t('common.email')}</label>
<label>{t('pages.customers.phone')}</label>
<label>{t('pages.customers.address')}</label>

// 6. No results message
{items.length === 0 && <p>{t('pages.customers.noCustomers')}</p>}

// 7. Modal titles & buttons
<h2>{t('pages.customers.editCustomer')}</h2>
<button>{t('common.cancel')}</button>

/**
 * TRANSLATION KEY NAMING CONVENTION
 */

// Structure: namespace.section.key
// Examples:
// pages.customers.title          ← Page titles
// pages.employees.addEmployee    ← Page-specific actions
// common.save                    ← Reusable common text
// navigation.customers           ← Navigation items
// messages.success               ← Status messages
// validation.emailInvalid        ← Validation errors
// auth.invalidCredentials        ← Auth-specific

/**
 * PAGES TO UPDATE (in this order)
 */

// Priority 1 - List/CRUD Pages:
// - CustomerListPage
// - EmployeeListPage
// - PartsPage
// - ServicesPage

// Priority 2 - Appointment Pages:
// - MyAppointmentsPage
// - MyJobsPage

// Priority 3 - Other Pages:
// - ProfilePage
// - ConfirmationModal
// - EmployeeAddModal
// - EmployeeAssignModal
// - All other modals

/**
 * QUICK CHECKLIST FOR EACH PAGE
 */

// ✓ Add: import { useTranslation } from 'react-i18next';
// ✓ Add: const { t } = useTranslation(); inside component
// ✓ Replace all hardcoded strings with t('key.path')
// ✓ Update heading/title
// ✓ Update button labels
// ✓ Update form labels
// ✓ Update success/error messages
// ✓ Update placeholder text
// ✓ Update table headers
// ✓ Update "no results" messages
// ✓ Test both English and French versions

/**
 * HOW TO FIND ALL HARDCODED STRINGS IN A PAGE
 */

// In VS Code:
// 1. Open the page file
// 2. Look for:
//    - <h1>, <h2>, <h3> etc. without t()
//    - <button> without t()
//    - <label> without t()
//    - "string" or 'string' literals outside of t()
// 3. Replace each with appropriate t() call

/**
 * ADDING NEW TRANSLATION KEYS
 */

// 1. Open: frontend/src/locales/en/translations.json
// 2. Add to appropriate section:
//    "pages": {
//      "parts": {
//        "title": "Parts",
//        "addPart": "Add Part"
//      }
//    }

// 3. Open: frontend/src/locales/fr/translations.json
// 4. Add French translation:
//    "pages": {
//      "parts": {
//        "title": "Pièces",
//        "addPart": "Ajouter une pièce"
//      }
//    }

// 5. Use in component: {t('pages.parts.title')}

/**
 * EXAMPLE: Full Page Update
 */

// BEFORE:
// export default function CustomersPage() {
//   return (
//     <div>
//       <h1>Customers</h1>
//       <button onClick={openAddModal}>Add Customer</button>
//       {customers.length === 0 ? (
//         <p>No customers found</p>
//       ) : (
//         <table>
//           <thead>
//             <tr>
//               <th>Name</th>
//               <th>Email</th>
//               <th>Phone</th>
//               <th>Actions</th>
//             </tr>
//           </thead>
//           {customers.map(c => (
//             <tr key={c.id}>
//               <td>{c.name}</td>
//               <td>
//                 <button>Edit</button>
//                 <button onClick={() => deleteCustomer(c.id)}>Delete</button>
//               </td>
//             </tr>
//           ))}
//         </table>
//       )}
//       {error && <p>Error loading customers</p>}
//     </div>
//   );
// }

// AFTER:
// import { useTranslation } from 'react-i18next';
//
// export default function CustomersPage() {
//   const { t } = useTranslation();
//
//   return (
//     <div>
//       <h1>{t('pages.customers.title')}</h1>
//       <button onClick={openAddModal}>{t('pages.customers.addCustomer')}</button>
//       {customers.length === 0 ? (
//         <p>{t('pages.customers.noCustomers')}</p>
//       ) : (
//         <table>
//           <thead>
//             <tr>
//               <th>{t('pages.customers.name')}</th>
//               <th>{t('pages.customers.email')}</th>
//               <th>{t('pages.customers.phone')}</th>
//               <th>{t('common.edit')}</th>
//             </tr>
//           </thead>
//           {customers.map(c => (
//             <tr key={c.id}>
//               <td>{c.name}</td>
//               <td>
//                 <button>{t('common.edit')}</button>
//                 <button onClick={() => deleteCustomer(c.id)}>{t('common.delete')}</button>
//               </td>
//             </tr>
//           ))}
//         </table>
//       )}
//       {error && <p>{t('messages.error')}</p>}
//     </div>
//   );
// }
