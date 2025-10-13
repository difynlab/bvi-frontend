# 📊 Data Migration to Backend - Detailed List by File

## 🔐 **1. AUTHENTICATION AND USERS**

### `src/helpers/authStorage.js`
- **Registered users**: Array of objects with email, password, firstName, lastName, phoneNumber
- **Active sessions**: Session object with logged-in user data
- **Storage keys**: `bvi.auth.users`, `bvi.auth.session`

### `src/helpers/profileStorage.js`
- **User profiles**: User-specific configurations and preferences
- **Profile data**: avatar_url, preferences, settings, dateFormat, timeZone, country, language
- **Storage keys**: `bvi.profile.{user_id}` or `bvi.profile.{email}`

### `src/context/AuthContext.jsx`
- **Session data**: Authenticated user with permissions and roles
- **Authentication state**: isAuthenticated, user, loading, error

---

## 📅 **2. EVENTS**

### `src/helpers/eventsStorage.js`
- **Events**: Array of objects with title, date, startTime, endTime, timeZone, eventType
- **Recurrence**: repeat, interval, daysOfWeek, ends (mode, date, count)
- **Content**: description, editorHtml, location
- **Files**: file, imageFileName, imagePreviewUrl
- **Storage key**: `events.storage.v1`

### `src/hooks/useEventForm.js`
- **Event form**: Form state with validations
- **Options**: TIME_ZONES, EVENT_TYPES, REPEAT_OPTIONS
- **Custom recurrence**: Advanced repetition configuration

### `src/hooks/useEventsState.js`
- **Events state**: Event list with CRUD operations
- **Filters and search**: Filtering by date, type, etc.

---

## 📢 **3. NOTICES AND ANNOUNCEMENTS**

### `src/helpers/noticesStorage.js`
- **Notice categories**: Array with id, name, slug
- **Notices**: title, description, categoryId, publishDate, imageUrl, attachments
- **Metadata**: createdAtISO, createdAtMs, fileName, noticeType
- **Storage keys**: `bvi.notices.items`, `bvi.notices.categories`

### `src/hooks/useNoticesState.js`
- **Notices state**: Management of notices and categories
- **Operations**: CRUD for notices and categories
- **Filters**: By active category

---

## 📰 **4. NEWSLETTERS**

### `src/helpers/newslettersStorage.js`
- **Newsletters**: fileName, description, editorHtml, imageFileName, imageUrl, linkUrl
- **Metadata**: createdAt, updatedAt
- **Storage key**: `newsletters.storage.v1`

### `src/hooks/useNewslettersState.js`
- **Newsletters state**: Newsletter list with CRUD operations
- **Forms**: HTML content and metadata management

---

## 📋 **5. LEGISLATION**

### `src/helpers/legislationStorage.js`
- **Main legislation**: title, category, type, jurisdiction, status, dateEnacted, effectiveDate, lastAmended, referenceNumber
- **Content**: summary, keyProvisions (array), amendments (array), responsibleBody
- **Attachments**: Array with title, descriptionHTML, fileUrl, fileName, linkUrl, createdAt
- **Storage keys**: `bvi.legislation.details`, `bvi.legislation.attachments`

### `src/hooks/useLegislationState.js`
- **Legislation state**: Legal documents management
- **Operations**: CRUD for legislation and attachments

---

## 📊 **6. REPORTS**

### `src/helpers/reportsStorage.js`
- **Report categories**: Array with names like 'Annual Report', 'Other Reports'
- **Reports**: title, typeId, typeName, publishedAt, fileUrl
- **Metadata**: id, createdAt, updatedAt
- **Storage keys**: `bvi.reports.categories`, `bvi.reports.items`

### `src/hooks/useReportsState.js`
- **Reports state**: Reports and categories management
- **Operations**: CRUD for reports and categories
- **Filters**: By active category

---

## 🏢 **7. SUBSCRIPTIONS AND MEMBERSHIPS**

### `src/helpers/subscriptionStorage.js`
- **General details**: Basic subscription information
- **Membership details**: Membership type, benefits
- **Company details**: Corporate information
- **Membership officers**: Array with name, title, phone, email
- **Storage keys**: 
  - `bvi.subscription.generalDetails`
  - `bvi.subscription.membershipDetails`
  - `bvi.subscription.companyDetails`
  - `bvi.subscription.membershipLicenseOfficers`

### `src/hooks/useSubscriptionWizard.js`
- **Wizard state**: Values for each form step
- **Validations**: Errors by field and step
- **Navigation**: Tab control and progress

### `src/sections/subscription/`
- **Specific forms**: 
  - `GeneralDetailsForm.jsx`
  - `MembershipDetailsForm.jsx`
  - `CompanyDetailsForm.jsx`
  - `ContactPersonDetails.jsx`
  - `MembershipLicenseOfficerForm.jsx`
  - `MembershipPlans.jsx`

---

## 💳 **8. PAYMENTS AND MEMBERSHIPS**

### `src/helpers/membershipMocks.js`
- **Payment history**: Array with id, dateISO, amount, status, receiptUrl
- **Member details**: Array with id, name, membershipType, receiptUrl
- **Statuses**: Paid, Pending, Failed, etc.

### `src/sections/membership/Membership.jsx`
- **Membership state**: Current user information
- **History**: Payments and transactions
- **Documents**: Receipts and certificates

---

## ⚙️ **9. CONFIGURATION AND PREFERENCES**

### `src/helpers/profileStorage.js`
- **User preferences**: dateFormat, timeZone, country, language
- **Profile configuration**: profilePicture, profilePictureUrl, countryCode, phoneNumber
- **UI settings**: Theme, language, notifications

### `src/hooks/useSettingsForm.js`
- **Settings form**: User preferences management
- **Validations**: Required fields and formats

### `src/sections/settings/Settings.jsx`
- **Settings interface**: Forms to modify preferences
- **Sections**: Profile, notifications, privacy, etc.

---

## 🔧 **10. AUXILIARY DATA AND UTILITIES**

### `src/helpers/seedUtils.js`
- **Test data**: Functions to generate mock data
- **Utilities**: Date formatting, ID generation

### `src/helpers/mockUserSeeder.js`
- **Test users**: Mock data for development and testing
- **Roles**: Admin, user, etc.

### `src/helpers/passwordPolicy.js`
- **Password policies**: Validation rules
- **Configuration**: Minimum length, special characters, etc.

### `src/helpers/urlValidation.js`
- **URL validation**: Functions to validate links
- **Utilities**: URL format verification

---

## 📁 **MAIN STORAGE FILES**

| File | Main Data | localStorage Keys |
|------|-----------|------------------|
| `authStorage.js` | Users, sessions | `bvi.auth.users`, `bvi.auth.session` |
| `profileStorage.js` | Profiles, preferences | `bvi.profile.{user_id}` |
| `eventsStorage.js` | Events, recurrence | `events.storage.v1` |
| `noticesStorage.js` | Notices, categories | `bvi.notices.items`, `bvi.notices.categories` |
| `newslettersStorage.js` | Newsletters | `newsletters.storage.v1` |
| `legislationStorage.js` | Legislation, files | `bvi.legislation.details`, `bvi.legislation.attachments` |
| `reportsStorage.js` | Reports, categories | `bvi.reports.categories`, `bvi.reports.items` |
| `subscriptionStorage.js` | Subscriptions | `bvi.subscription.*` |
| `membershipMocks.js` | Payments, memberships | Temporary mock data |

---

## 🎯 **MIGRATION PRIORITIES**

### **🔴 CRITICAL (Migrate first)**
1. `authStorage.js` - Authentication and users
2. `eventsStorage.js` - Events (core functionality)
3. `noticesStorage.js` - Notices (dynamic content)
4. `subscriptionStorage.js` - Subscriptions (business process)

### **🟡 IMPORTANT (Second phase)**
5. `newslettersStorage.js` - Newsletters
6. `legislationStorage.js` - Legislation
7. `reportsStorage.js` - Reports
8. `membershipMocks.js` - Payments and memberships

### **🟢 IMPROVEMENTS (Third phase)**
9. `profileStorage.js` - Configuration and preferences
10. Auxiliary files and utilities

---

## 🗄️ **RECOMMENDED DATABASE SCHEMA**

```sql
-- Main tables
users (id, email, password_hash, first_name, last_name, phone_number, role, created_at, updated_at)
user_profiles (user_id, avatar_url, preferences, settings)
sessions (id, user_id, token, expires_at, created_at)

events (id, title, date, start_time, end_time, timezone, event_type, description, location, created_by, created_at, updated_at)
event_recurrences (id, event_id, repeat_type, interval, days_of_week, ends_mode, ends_date, ends_count)

notice_categories (id, name, slug, created_at)
notices (id, title, description, category_id, publish_date, image_url, created_by, created_at, updated_at)
notice_attachments (id, notice_id, file_url, file_name, created_at)

newsletters (id, file_name, description, editor_html, image_url, link_url, created_by, created_at, updated_at)

legislation (id, title, category, type, jurisdiction, status, date_enacted, effective_date, reference_number, summary, created_at, updated_at)
legislation_attachments (id, legislation_id, file_url, file_name, created_at)

report_categories (id, name, created_at)
reports (id, title, category_id, published_at, file_url, created_by, created_at, updated_at)

subscriptions (id, user_id, general_details, membership_details, company_details, status, created_at, updated_at)
membership_officers (id, subscription_id, name, title, phone, email)

payments (id, user_id, amount, status, payment_date, receipt_url, created_at)
memberships (id, user_id, membership_type, status, start_date, end_date, created_at)
```

---

## 🔌 **REQUIRED API ENDPOINTS**

### **Authentication**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/auth/profile`
- `PUT /api/auth/profile`

### **Events**
- `GET /api/events`
- `POST /api/events`
- `PUT /api/events/:id`
- `DELETE /api/events/:id`

### **Notices**
- `GET /api/notices`
- `GET /api/notices/categories`
- `POST /api/notices`
- `PUT /api/notices/:id`
- `DELETE /api/notices/:id`

### **Newsletters**
- `GET /api/newsletters`
- `POST /api/newsletters`
- `PUT /api/newsletters/:id`
- `DELETE /api/newsletters/:id`

### **Legislation**
- `GET /api/legislation`
- `POST /api/legislation`
- `PUT /api/legislation/:id`
- `DELETE /api/legislation/:id`

### **Reports**
- `GET /api/reports`
- `GET /api/reports/categories`
- `POST /api/reports`
- `PUT /api/reports/:id`
- `DELETE /api/reports/:id`

### **Subscriptions**
- `GET /api/subscriptions`
- `POST /api/subscriptions`
- `PUT /api/subscriptions/:id`

### **Payments**
- `GET /api/payments`
- `POST /api/payments`
- `GET /api/memberships`

---

## 📝 **EXECUTIVE SUMMARY**

The BVI Frontend project currently uses **localStorage** to store all data, which is **inadequate for production**. The identified data includes:

- **9 main modules** of data requiring persistence
- **~15 database tables** needed
- **~30 API endpoints** for CRUD operations
- **Critical migration** from localStorage to real backend

**Recommendation**: Implement the backend with **high priority** on authentication, events, and notices, as they are the most critical modules for the application's functionality.
