# CourseMaster — Backend API Service

A scalable, secure, and production-grade RESTful API engine powering the CourseMaster Learning Management System (LMS). Built with Node.js, Express 5, MongoDB, and Mongoose, this service handles identity lifecycle, course curriculum authoring, student enrollments, assignment evaluation workflows, real-time quiz assessment, and comprehensive administrative analytics.

---

## Architecture & System Highlights

- **Authentication & RBAC:** Secure JSON Web Token (JWT) issuing with bcrypt password hashing, role-based authorization guards (`student` and `admin`), and active account suspension (`isBanned`) enforcement.
- **Data Integrity & Cascading Operations:** Atomic referential cleanup across MongoDB collections — deleting courses or user accounts cascades across enrollments, assignment submissions, and quiz attempts without leaving orphaned ghost records.
- **Curriculum & Lesson Tracking:** Robust syllabus verification ensuring students can only mark verified lessons complete, preventing foreign ID injection and strictly capping completion percentage at 100%.
- **Interactive Assessment Engine:** Server-side quiz evaluation calculating accurate percentage marks and returning standardized HTTP 201 Created responses.
- **Protected Database Queries:** Search queries with escaped regular expression inputs to eliminate ReDoS vulnerabilities and regex compilation crashes.
- **RESTful Cross-Origin Standard:** Complete CORS configuration supporting `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, and `OPTIONS` preflight negotiations.

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Runtime Environment** | Node.js (v18+ recommended) |
| **Framework** | Express.js 5 |
| **Database** | MongoDB (v6.0+) via Mongoose 9 ODM |
| **Authentication & Crypto** | JSON Web Tokens (`jsonwebtoken`), `bcrypt` (10 salt rounds) |
| **Validation** | Zod Schema Validation |
| **Email Service** | Nodemailer (Optional notification transport) |

---

## Directory Structure

```
backend/
├── src/
│   ├── config/             # Database connection and environment configurations
│   ├── controllers/        # Request controllers (auth, course, enrollment, admin, quiz, assignment)
│   ├── middlewares/        # JWT authMiddleware, role-based guards, and error handlers
│   ├── models/             # Mongoose schemas (User, Course, Enrollment, AssignmentSubmission, QuizSubmission)
│   ├── routes/             # Express API route declarations
│   ├── services/           # Business logic layer and database interactions
│   └── validators/         # Zod payload validation schemas
├── app.js                  # Express application setup, CORS, and middleware pipeline
├── seed.js                 # Database seeder script for demo courses and initial data
├── server.js               # Application HTTP server entrypoint
└── package.json            # Project manifest and dependency declarations
```

---

## Installation & Setup

### Prerequisites

Ensure you have the following installed locally:
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **MongoDB** running locally or a provisioned cloud database instance

### 1. Install Dependencies

Navigate to the `backend` directory and install the required npm packages:

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory based on `.env.example`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Connection
MONGODB_URI=mongodb://localhost:27017/coursemaster

# Authentication
JWT_SECRET=your_secure_jwt_secret_key_here

# Administrative Provisioning
ADMIN_REGISTRATION_KEY=your_secure_admin_registration_key_here

# Email Notification Transport (Optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email_address_here
EMAIL_PASSWORD=your_email_app_password_here
FRONTEND_URL=http://localhost:5173
```

### 3. Seed Database (Optional)

To populate the database with initial course catalog data, modules, lessons, and demo curriculums:

```bash
npm run seed
```

### 4. Run Development Server

Launch the development server with live reload enabled via Nodemon:

```bash
npm run dev
```

The API service will start on port `5000` (or the configured `PORT`).

### 5. Production Execution

```bash
npm start
```

---

## API Endpoints Reference

All API routes are served under the `/api` namespace prefix.

### 1. Authentication (`/api/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register a new user (`student` by default; pass `adminKey` for `admin` role) |
| `POST` | `/api/auth/login` | Public | Authenticate credentials and receive signed JWT token |
| `GET` | `/api/auth/me` | Bearer Token | Retrieve currently authenticated user profile |

#### Register Payload Example:
```json
{
  "name": "Alex Mercer",
  "email": "alex@example.com",
  "password": "SecurePassword123!",
  "adminKey": "optional-admin-key"
}
```

---

### 2. Public Courses (`/api/courses`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/courses` | Public | Paginated course list with search, sorting, category, and tag filters |
| `GET` | `/api/courses/:id` | Public | Retrieve full course details by ObjectId |

#### Supported Query Parameters for `GET /api/courses`:
- `page`: Page index (default: `1`)
- `limit`: Number of results per page (default: `8`)
- `search`: Sanitized text filter searching title and instructor
- `sort`: Sorting order (`price_asc` or `price_desc`)
- `category`: Filter by course category
- `tags`: Comma-separated list of tags

---

### 3. Enrollments (`/api/enrollments`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/enrollments/:courseId` | Student / Authenticated | Enroll the authenticated user into a course batch |
| `GET` | `/api/enrollments/my` | Student / Authenticated | Retrieve all enrolled courses for the logged-in student |
| `PATCH` | `/api/enrollments/:enrollId/complete` | Student / Authenticated | Mark a lesson complete (validates syllabus membership and caps progress at 100%) |

---

### 4. Quizzes (`/api/quizzes`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/quizzes/submit` | Student / Authenticated | Submit quiz responses (returns HTTP 201 Created with percentage score) |
| `GET` | `/api/quizzes/my?courseId=:id` | Student / Authenticated | Retrieve user submission history for a specific course |
| `GET` | `/api/quizzes/stats?courseId=:id` | Student / Authenticated | Retrieve aggregate quiz metrics for the course |

---

### 5. Assignments (`/api/assignments`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/assignments/submit` | Student / Authenticated | Submit an assignment response (text body or external URL link) |
| `GET` | `/api/assignments/my?courseId=:id` | Student / Authenticated | Retrieve student's assignment submissions for a course |
| `GET` | `/api/assignments/stats?courseId=:id`| Student / Authenticated | Retrieve submission statistics and grades |

---

### 6. Administration (`/api/admin`)

*All administrative endpoints require an authenticated user with `role: "admin"`.*

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/admin/courses` | Admin | Create a new course with batches and syllabus modules |
| `PUT` | `/api/admin/courses/:id` | Admin | Update existing course attributes and syllabus |
| `DELETE` | `/api/admin/courses/:id` | Admin | Cascading deletion of course and all associated enrollments and submissions |
| `GET` | `/api/admin/enrollments` | Admin | List all student enrollments (with optional `courseId` or `batchId` filtering) |
| `GET` | `/api/admin/assignments` | Admin | List assignment submissions (with optional `courseId` and `status` filters) |
| `PATCH` | `/api/admin/assignments/:id` | Admin | Review, grade, and add feedback notes to an assignment submission |
| `GET` | `/api/admin/analytics` | Admin | Retrieve platform metrics, total revenue, and top-enrolled courses |
| `GET` | `/api/admin/users` | Admin | View user accounts and student list |
| `PATCH` | `/api/admin/users/:id/ban` | Admin | Toggle account suspension flag (`isBanned`) |
| `DELETE` | `/api/admin/users/:id` | Admin | Cascading deletion of user account and all child records |

---

## Database Schemas Overview

- **User:** Stores credentials, hashed passwords (`passwordHash`), assigned roles (`student` | `admin`), and suspension status (`isBanned`). Normalizes `id` and `_id` on query output.
- **Course:** Stores title, description, instructor, price, category, tags, batches array, and modular syllabus array (with lessons, video links, quizzes, and assignment prompts).
- **Enrollment:** Relational document connecting `student` (ObjectId) and `course` (ObjectId) with selected `batchId` and progress tracking object (`completedLessons`, `percent`).
- **AssignmentSubmission:** Tracks student submissions, answers, grading status (`pending`, `reviewed`), numerical score, and reviewer notes.
- **QuizSubmission:** Stores student answer choices, calculated score, total questions, and computed percentage.

---

## Security Best Practices Implemented

1. **Password Encryption:** Passwords are never stored in plaintext and are hashed using bcrypt with 10 salt rounds.
2. **Account Suspension Checks:** Suspended (`isBanned: true`) accounts are immediately denied login tokens and blocked from executing protected API routes.
3. **Regex Injection Sanitization:** Search inputs escape special characters (`[`, `]`, `*`, `+`, `?`, etc.) before passing to MongoDB regex operators.
4. **Referential Cleanup:** Cascading deletions prevent dangling ObjectId references when users or courses are removed.
5. **CORS Hardening:** Standard preflight headers grant only necessary RESTful methods to web clients.
