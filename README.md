# Global Compliance Passport

Global Compliance Passport (GCP) is a digital identity platform built for startups and businesses. The platform allows businesses to upload compliance certificates (like GST, PAN, Certificate of Incorporation) once, extract structured fields using AI OCR, verify them through a Trusted Authority queue (mock admin dashboard), generate a reusable Compliance Passport, and share verification consent credentials securely with institutions (such as partner banks, VC funds, and gateways) on access timers.

---

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router, dynamic API routes)
- **Language:** TypeScript & ES modules
- **Database ORM:** Prisma Client
- **Local Database:** SQLite (self-contained, config-free fallback)
- **Production Database:** PostgreSQL (supported via standard toggling)
- **Styling:** Tailwind CSS v4, Lucide Icons, glassmorphic filters, and linear animations
- **Notification alerts:** Sonner Toasts
- **Session Auth:** JWT Sessions inside HTTP-only cookies

---

## 🚀 Getting Started

### 1. Installation

Install all required NPM packages:
```bash
npm install
```

### 2. Database Synchronization & Generate Client

Map the Prisma schema to create the local SQLite database file `dev.db` and generate the matching type-safe client models:
```bash
npx prisma generate
npx prisma db push
```

### 3. Seed Mock Rules & Default Admin User

Pre-populate the database with the default country compliance rules (India, USA, Germany, Singapore, UAE) and set up the default Administrator account:
```bash
node prisma/seed.js
```

### 4. Boot Local Development Server

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚡ Toggle Database: SQLite to PostgreSQL

By default, GCP is configured to use **SQLite** to allow immediate execution without local database server settings. To toggle back to **PostgreSQL** (production standard):

1. Open [prisma/schema.prisma](file:///c:/Projects/globalcompilancepassport/prisma/schema.prisma).
2. Change the `datasource db` block:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Add your database connection string in a `.env` file in the root folder:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/compliance_passport?schema=public"
   ```
4. Re-run migrations and seeding:
   ```bash
   npx prisma generate
   npx prisma db push
   node prisma/seed.js
   ```

---

## 🔐 Credentials for Testing Workflows

Use these default credentials to test the platform roles:

### 1. Admin Role
- **Login Email:** `admin@123`
- **Login Password:** `admin123`
- **Actions:** Inspect document details, view parsed AI findings, approve or reject credentials, and check logs.

### 2. Startup Role (Register a new account)
- **Signup Page:** Select **Startup**, enter your company name, and registration number (CIN).
- **Actions:** Securely upload files (GST, PAN, incorporation filings), watch AI OCR parse details, inspect your Compliance Passport score, request RAG compliance advisor guidelines (e.g., Germany expansion), and approve/reject consent shares.

### 3. Institution Role (Register or share with email)
- **Signup Page:** Select **Institution**, and specify your banking or VC details.
- **Actions:** Search registered startups, request access to specific documents, and view decrypted credentials once consent is granted by the startup.
