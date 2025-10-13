# 📊 Datos que deben migrar al Backend - Lista Detallada por Archivo

## 🔐 **1. AUTENTICACIÓN Y USUARIOS**

### `src/helpers/authStorage.js`
- **Usuarios registrados**: Array de objetos con email, password, firstName, lastName, phoneNumber
- **Sesiones activas**: Objeto de sesión con datos del usuario logueado
- **Claves de almacenamiento**: `bvi.auth.users`, `bvi.auth.session`

### `src/helpers/profileStorage.js`
- **Perfiles de usuario**: Configuraciones y preferencias por usuario
- **Datos de perfil**: avatar_url, preferences, settings, dateFormat, timeZone, country, language
- **Claves de almacenamiento**: `bvi.profile.{user_id}` o `bvi.profile.{email}`

### `src/context/AuthContext.jsx`
- **Datos de sesión**: Usuario autenticado con permisos y roles
- **Estado de autenticación**: isAuthenticated, user, loading, error

---

## 📅 **2. EVENTOS**

### `src/helpers/eventsStorage.js`
- **Eventos**: Array de objetos con title, date, startTime, endTime, timeZone, eventType
- **Recurrencia**: repeat, interval, daysOfWeek, ends (mode, date, count)
- **Contenido**: description, editorHtml, location
- **Archivos**: file, imageFileName, imagePreviewUrl
- **Clave de almacenamiento**: `events.storage.v1`

### `src/hooks/useEventForm.js`
- **Formulario de eventos**: Estado del formulario con validaciones
- **Opciones**: TIME_ZONES, EVENT_TYPES, REPEAT_OPTIONS
- **Recurrencia personalizada**: Configuración avanzada de repetición

### `src/hooks/useEventsState.js`
- **Estado de eventos**: Lista de eventos con operaciones CRUD
- **Filtros y búsqueda**: Funcionalidades de filtrado por fecha, tipo, etc.

---

## 📢 **3. NOTICIAS Y AVISOS**

### `src/helpers/noticesStorage.js`
- **Categorías de noticias**: Array con id, name, slug
- **Noticias**: title, description, categoryId, publishDate, imageUrl, attachments
- **Metadatos**: createdAtISO, createdAtMs, fileName, noticeType
- **Claves de almacenamiento**: `bvi.notices.items`, `bvi.notices.categories`

### `src/hooks/useNoticesState.js`
- **Estado de noticias**: Gestión de noticias y categorías
- **Operaciones**: CRUD para noticias y categorías
- **Filtros**: Por categoría activa

---

## 📰 **4. NEWSLETTERS**

### `src/helpers/newslettersStorage.js`
- **Newsletters**: fileName, description, editorHtml, imageFileName, imageUrl, linkUrl
- **Metadatos**: createdAt, updatedAt
- **Clave de almacenamiento**: `newsletters.storage.v1`

### `src/hooks/useNewslettersState.js`
- **Estado de newsletters**: Lista de newsletters con operaciones CRUD
- **Formularios**: Gestión de contenido HTML y metadatos

---

## 📋 **5. LEGISLACIÓN**

### `src/helpers/legislationStorage.js`
- **Legislación principal**: title, category, type, jurisdiction, status, dateEnacted, effectiveDate, lastAmended, referenceNumber
- **Contenido**: summary, keyProvisions (array), amendments (array), responsibleBody
- **Archivos adjuntos**: Array con title, descriptionHTML, fileUrl, fileName, linkUrl, createdAt
- **Claves de almacenamiento**: `bvi.legislation.details`, `bvi.legislation.attachments`

### `src/hooks/useLegislationState.js`
- **Estado de legislación**: Gestión de documentos legales
- **Operaciones**: CRUD para legislación y archivos adjuntos

---

## 📊 **6. REPORTES**

### `src/helpers/reportsStorage.js`
- **Categorías de reportes**: Array con nombres como 'Annual Report', 'Other Reports'
- **Reportes**: title, typeId, typeName, publishedAt, fileUrl
- **Metadatos**: id, createdAt, updatedAt
- **Claves de almacenamiento**: `bvi.reports.categories`, `bvi.reports.items`

### `src/hooks/useReportsState.js`
- **Estado de reportes**: Gestión de reportes y categorías
- **Operaciones**: CRUD para reportes y categorías
- **Filtros**: Por categoría activa

---

## 🏢 **7. SUSCRIPCIONES Y MEMBRESÍAS**

### `src/helpers/subscriptionStorage.js`
- **Detalles generales**: Información básica de suscripción
- **Detalles de membresía**: Tipo de membresía, beneficios
- **Detalles de empresa**: Información corporativa
- **Oficiales de membresía**: Array con name, title, phone, email
- **Claves de almacenamiento**: 
  - `bvi.subscription.generalDetails`
  - `bvi.subscription.membershipDetails`
  - `bvi.subscription.companyDetails`
  - `bvi.subscription.membershipLicenseOfficers`

### `src/hooks/useSubscriptionWizard.js`
- **Estado del wizard**: Valores de cada paso del formulario
- **Validaciones**: Errores por campo y paso
- **Navegación**: Control de tabs y progreso

### `src/sections/subscription/`
- **Formularios específicos**: 
  - `GeneralDetailsForm.jsx`
  - `MembershipDetailsForm.jsx`
  - `CompanyDetailsForm.jsx`
  - `ContactPersonDetails.jsx`
  - `MembershipLicenseOfficerForm.jsx`
  - `MembershipPlans.jsx`

---

## 💳 **8. PAGOS Y MEMBRESÍAS**

### `src/helpers/membershipMocks.js`
- **Historial de pagos**: Array con id, dateISO, amount, status, receiptUrl
- **Detalles de miembros**: Array con id, name, membershipType, receiptUrl
- **Estados**: Paid, Pending, Failed, etc.

### `src/sections/membership/Membership.jsx`
- **Estado de membresía**: Información del usuario actual
- **Historial**: Pagos y transacciones
- **Documentos**: Recibos y certificados

---

## ⚙️ **9. CONFIGURACIÓN Y PREFERENCIAS**

### `src/helpers/profileStorage.js`
- **Preferencias de usuario**: dateFormat, timeZone, country, language
- **Configuración de perfil**: profilePicture, profilePictureUrl, countryCode, phoneNumber
- **Configuraciones de UI**: Tema, idioma, notificaciones

### `src/hooks/useSettingsForm.js`
- **Formulario de configuración**: Gestión de preferencias del usuario
- **Validaciones**: Campos requeridos y formatos

### `src/sections/settings/Settings.jsx`
- **Interfaz de configuración**: Formularios para modificar preferencias
- **Secciones**: Perfil, notificaciones, privacidad, etc.

---

## 🔧 **10. DATOS AUXILIARES Y UTILIDADES**

### `src/helpers/seedUtils.js`
- **Datos de prueba**: Funciones para generar datos mock
- **Utilidades**: Formateo de fechas, generación de IDs

### `src/helpers/mockUserSeeder.js`
- **Usuarios de prueba**: Datos mock para desarrollo y testing
- **Roles**: Admin, user, etc.

### `src/helpers/passwordPolicy.js`
- **Políticas de contraseña**: Reglas de validación
- **Configuración**: Longitud mínima, caracteres especiales, etc.

### `src/helpers/urlValidation.js`
- **Validación de URLs**: Funciones para validar enlaces
- **Utilidades**: Verificación de formato de URL

---

## 📁 **ARCHIVOS DE ALMACENAMIENTO PRINCIPALES**

| Archivo | Datos Principales | Claves localStorage |
|---------|------------------|-------------------|
| `authStorage.js` | Usuarios, sesiones | `bvi.auth.users`, `bvi.auth.session` |
| `profileStorage.js` | Perfiles, preferencias | `bvi.profile.{user_id}` |
| `eventsStorage.js` | Eventos, recurrencia | `events.storage.v1` |
| `noticesStorage.js` | Noticias, categorías | `bvi.notices.items`, `bvi.notices.categories` |
| `newslettersStorage.js` | Newsletters | `newsletters.storage.v1` |
| `legislationStorage.js` | Legislación, archivos | `bvi.legislation.details`, `bvi.legislation.attachments` |
| `reportsStorage.js` | Reportes, categorías | `bvi.reports.categories`, `bvi.reports.items` |
| `subscriptionStorage.js` | Suscripciones | `bvi.subscription.*` |
| `membershipMocks.js` | Pagos, membresías | Datos mock temporales |

---

## 🎯 **PRIORIDADES DE MIGRACIÓN**

### **🔴 CRÍTICO (Migrar primero)**
1. `authStorage.js` - Autenticación y usuarios
2. `eventsStorage.js` - Eventos (funcionalidad core)
3. `noticesStorage.js` - Noticias (contenido dinámico)
4. `subscriptionStorage.js` - Suscripciones (proceso de negocio)

### **🟡 IMPORTANTE (Segunda fase)**
5. `newslettersStorage.js` - Newsletters
6. `legislationStorage.js` - Legislación
7. `reportsStorage.js` - Reportes
8. `membershipMocks.js` - Pagos y membresías

### **🟢 MEJORAS (Tercera fase)**
9. `profileStorage.js` - Configuraciones y preferencias
10. Archivos auxiliares y utilidades

---

## 🗄️ **ESQUEMA DE BASE DE DATOS RECOMENDADO**

```sql
-- Tablas principales
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

## 🔌 **ENDPOINTS DE API NECESARIOS**

### **Autenticación**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/auth/profile`
- `PUT /api/auth/profile`

### **Eventos**
- `GET /api/events`
- `POST /api/events`
- `PUT /api/events/:id`
- `DELETE /api/events/:id`

### **Noticias**
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

### **Legislación**
- `GET /api/legislation`
- `POST /api/legislation`
- `PUT /api/legislation/:id`
- `DELETE /api/legislation/:id`

### **Reportes**
- `GET /api/reports`
- `GET /api/reports/categories`
- `POST /api/reports`
- `PUT /api/reports/:id`
- `DELETE /api/reports/:id`

### **Suscripciones**
- `GET /api/subscriptions`
- `POST /api/subscriptions`
- `PUT /api/subscriptions/:id`

### **Pagos**
- `GET /api/payments`
- `POST /api/payments`
- `GET /api/memberships`

---

## 📝 **RESUMEN EJECUTIVO**

El proyecto BVI Frontend actualmente utiliza **localStorage** para almacenar todos los datos, lo cual es **inadecuado para producción**. Los datos identificados incluyen:

- **9 módulos principales** de datos que requieren persistencia
- **~15 tablas de base de datos** necesarias
- **~30 endpoints de API** para operaciones CRUD
- **Migración crítica** de localStorage a backend real

**Recomendación**: Implementar el backend con **alta prioridad** en autenticación, eventos y noticias, ya que son los módulos más críticos para el funcionamiento de la aplicación.
