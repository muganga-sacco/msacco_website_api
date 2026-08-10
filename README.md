# Muganga SACCO REST API

A production-ready Express.js REST API with JWT authentication for the Muganga SACCO website.

---

## Tech Stack

| Layer        | Technology              |
|-------------|-------------------------|
| Runtime      | Node.js                 |
| Framework    | Express.js              |
| Database     | PostgreSQL               |
| Auth         | JWT (Access + Refresh)  |
| Validation   | express-validator       |
| Security     | Helmet, CORS, Rate-limit|

---

## Project Structure

```
muganga-sacco-api/
├── src/
│   ├── config/
│   │   ├── db.js           # PostgreSQL pool
│   │   ├── migrate.js      # Database migrations
│   │   └── seed.js         # Initial seed data
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── products.controller.js
│   │   ├── board.controller.js
│   │   ├── careers.controller.js
│   │   ├── news.controller.js
│   │   ├── trends.controller.js
│   │   ├── guides.controller.js
│   │   └── settings.controller.js
│   ├── middleware/
│   │   ├── auth.js         # JWT protect + role guards
│   │   └── errorHandler.js # Global error handler
│   ├── routes/
│   │   ├── index.js
│   │   ├── auth.routes.js
│   │   ├── products.routes.js
│   │   ├── board.routes.js
│   │   ├── careers.routes.js
│   │   ├── news.routes.js
│   │   ├── trends.routes.js
│   │   ├── guides.routes.js
│   │   └── settings.routes.js
│   ├── utils/
│   │   ├── jwt.js
│   │   ├── response.js
│   │   └── pagination.js
│   └── server.js
├── .env.example
├── .gitignore
└── package.json
```

---

## Getting Started

### 1. Clone & Install

```bash
git clone <repo-url>
cd muganga-sacco-api
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials and secrets
```

### 3. Create Database

```sql
CREATE DATABASE muganga_sacco;
```

### 4. Run Migrations

```bash
npm run migrate
```

### 5. Seed Initial Data

```bash
npm run seed
```

Default credentials after seeding:
- **Admin**: `admin@mugangasacco.rw` / `Admin@1234`
- **Editor**: `editor@mugangasacco.rw` / `Editor@1234`

### 6. Start Server

```bash
npm run dev     # development (nodemon)
npm start       # production
```

---

## Authentication

All protected routes require a Bearer token in the Authorization header:

```
Authorization: Bearer <accessToken>
```

### Roles & Permissions

| Role    | Permissions                              |
|---------|------------------------------------------|
| admin   | Full access to all endpoints             |
| editor  | Read + Create + Update (no delete)       |
| member  | Read public endpoints only               |

---

## API Reference

Base URL: `http://localhost:5000/api`

---

### Auth — `/api/auth`

| Method | Endpoint               | Auth     | Description              |
|--------|------------------------|----------|--------------------------|
| POST   | `/register`            | Public   | Register a new user      |
| POST   | `/login`               | Public   | Login and get tokens     |
| POST   | `/refresh`             | Public   | Refresh access token     |
| POST   | `/logout`              | Public   | Invalidate refresh token |
| GET    | `/me`                  | Required | Get current user profile |
| PUT    | `/me`                  | Required | Update profile           |
| PUT    | `/change-password`     | Required | Change password          |

**Register / Login body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Secret@123",
  "role": "member"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": "uuid", "name": "...", "email": "...", "role": "member" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

### 📦 Products — `/api/products`

| Method | Endpoint    | Auth          | Description            |
|--------|-------------|---------------|------------------------|
| GET    | `/`         | Public        | List all products      |
| GET    | `/:id`      | Public        | Get single product     |
| POST   | `/`         | Editor+Admin  | Create product         |
| PUT    | `/:id`      | Editor+Admin  | Update product         |
| DELETE | `/:id`      | Editor+Admin  | Delete product         |

**Query params (GET /):** `type=loan|savings`, `is_featured=true`, `is_active=true`, `page`, `limit`

**Create body:**
```json
{
  "type": "loan",
  "title": "Emergency Loans",
  "description": "Quick access to funds",
  "interest_rate": 15,
  "max_amount": 10000000,
  "features": ["24hr approval", "Minimal docs"],
  "is_featured": false,
  "cta_label": "Apply Now"
}
```

---

### 👥 Board — `/api/board`

#### Board Members

| Method | Endpoint          | Auth         | Description                  |
|--------|-------------------|--------------|------------------------------|
| GET    | `/members`        | Public       | List board members           |
| GET    | `/members/:id`    | Public       | Get single board member      |
| POST   | `/members`        | Editor+Admin | Create board member          |
| PUT    | `/members/:id`    | Editor+Admin | Update board member          |
| DELETE | `/members/:id`    | Admin only   | Delete board member          |

#### Management Team

| Method | Endpoint             | Auth         | Description              |
|--------|----------------------|--------------|--------------------------|
| GET    | `/management`        | Public       | List management team     |
| GET    | `/management/:id`    | Public       | Get single manager       |
| POST   | `/management`        | Editor+Admin | Create management member |
| PUT    | `/management/:id`    | Editor+Admin | Update                   |
| DELETE | `/management/:id`    | Admin only   | Delete                   |

#### Governance Principles

| Method | Endpoint            | Auth         | Description          |
|--------|---------------------|--------------|----------------------|
| GET    | `/principles`       | Public       | List principles      |
| POST   | `/principles`       | Editor+Admin | Create principle     |
| PUT    | `/principles/:id`   | Editor+Admin | Update principle     |
| DELETE | `/principles/:id`   | Admin only   | Delete principle     |

---

### 💼 Careers — `/api/careers`

| Method | Endpoint    | Auth         | Description        |
|--------|-------------|--------------|--------------------|
| GET    | `/`         | Public       | List job openings  |
| GET    | `/:id`      | Public       | Get single job     |
| POST   | `/`         | Editor+Admin | Create job posting |
| PUT    | `/:id`      | Editor+Admin | Update job         |
| DELETE | `/:id`      | Admin only   | Delete job         |

**Query params:** `is_active`, `employment_type`, `department`, `page`, `limit`

**Create body:**
```json
{
  "title": "Loan Officer",
  "department": "Credit Department",
  "location": "Kigali",
  "employment_type": "full-time",
  "description": "We are seeking...",
  "requirements": ["Bachelor's degree", "3 years experience"],
  "benefits": ["Health insurance", "Annual bonus"],
  "salary_range": "RWF 400,000 - 600,000",
  "deadline": "2024-03-31"
}
```

---

### 📰 News — `/api/news`

| Method | Endpoint    | Auth         | Description             |
|--------|-------------|--------------|-------------------------|
| GET    | `/`         | Public       | List articles           |
| GET    | `/:id`      | Public       | Get by ID or slug       |
| POST   | `/`         | Editor+Admin | Create article          |
| PUT    | `/:id`      | Editor+Admin | Update article          |
| DELETE | `/:id`      | Admin only   | Delete article          |

**Query params:** `status=draft|published|archived`, `tag`, `is_featured`, `search`, `page`, `limit`

**Create body:**
```json
{
  "title": "Muganga SACCO Reaches 50,000 Members",
  "excerpt": "Short summary...",
  "content": "Full article content...",
  "tag": "Milestone",
  "image_url": "https://...",
  "is_featured": true,
  "status": "published"
}
```

---

### 📊 Trends — `/api/trends`

#### KPI Stats

| Method | Endpoint      | Auth         | Description  |
|--------|---------------|--------------|--------------|
| GET    | `/kpis`       | Public       | List KPIs    |
| POST   | `/kpis`       | Editor+Admin | Create KPI   |
| PUT    | `/kpis/:id`   | Editor+Admin | Update KPI   |
| DELETE | `/kpis/:id`   | Admin only   | Delete KPI   |

#### Savings Trends

| Method | Endpoint          | Auth         | Description          |
|--------|-------------------|--------------|----------------------|
| GET    | `/savings`        | Public       | List savings trends  |
| POST   | `/savings`        | Editor+Admin | Create entry         |
| PUT    | `/savings/:id`    | Editor+Admin | Update entry         |
| DELETE | `/savings/:id`    | Admin only   | Delete entry         |

#### Loan Distribution

| Method | Endpoint       | Auth         | Description          |
|--------|----------------|--------------|----------------------|
| GET    | `/loans`       | Public       | List loan dist       |
| POST   | `/loans`       | Editor+Admin | Create entry         |
| PUT    | `/loans/:id`   | Editor+Admin | Update entry         |
| DELETE | `/loans/:id`   | Admin only   | Delete entry         |

#### Economic Insights

| Method | Endpoint           | Auth         | Description          |
|--------|--------------------|--------------|----------------------|
| GET    | `/insights`        | Public       | List insights        |
| POST   | `/insights`        | Editor+Admin | Create insight       |
| PUT    | `/insights/:id`    | Editor+Admin | Update insight       |
| DELETE | `/insights/:id`    | Admin only   | Delete insight       |

---

### 🎬 Video Guides — `/api/guides`

| Method | Endpoint    | Auth         | Description          |
|--------|-------------|--------------|----------------------|
| GET    | `/`         | Public       | List guides          |
| GET    | `/:id`      | Public       | Get guide (+ views)  |
| POST   | `/`         | Editor+Admin | Create guide         |
| PUT    | `/:id`      | Editor+Admin | Update guide         |
| DELETE | `/:id`      | Admin only   | Delete guide         |

**Query params:** `category=getting_started|loans|digital_services|education|savings`, `is_featured`, `search`, `page`, `limit`

---

### ⚙️ Settings — `/api/settings`

#### Site Info

| Method | Endpoint | Auth       | Description          |
|--------|----------|------------|----------------------|
| GET    | `/site`  | Public     | Get site settings    |
| PUT    | `/site`  | Admin only | Update site settings |

#### Social Links

| Method | Endpoint         | Auth       | Description       |
|--------|------------------|------------|-------------------|
| GET    | `/socials`       | Public     | List social links |
| POST   | `/socials`       | Admin only | Create link       |
| PUT    | `/socials/:id`   | Admin only | Update link       |
| DELETE | `/socials/:id`   | Admin only | Delete link       |

#### Hero Banners

| Method | Endpoint         | Auth         | Description      |
|--------|------------------|--------------|------------------|
| GET    | `/banners`       | Public       | List banners     |
| POST   | `/banners`       | Editor+Admin | Create banner    |
| PUT    | `/banners/:id`   | Editor+Admin | Update banner    |
| DELETE | `/banners/:id`   | Admin only   | Delete banner    |

**Query param:** `page=home|products|careers|...`

#### Feature Toggles

| Method | Endpoint           | Auth       | Description       |
|--------|--------------------|------------|-------------------|
| GET    | `/toggles`         | Public     | List all toggles  |
| GET    | `/toggles/:key`    | Public     | Get single toggle |
| POST   | `/toggles`         | Admin only | Create toggle     |
| PUT    | `/toggles/:key`    | Admin only | Update toggle     |
| DELETE | `/toggles/:key`    | Admin only | Delete toggle     |

#### User Management

| Method | Endpoint       | Auth       | Description      |
|--------|----------------|------------|------------------|
| GET    | `/users`       | Admin only | List all users   |
| PUT    | `/users/:id`   | Admin only | Update user role |
| DELETE | `/users/:id`   | Admin only | Delete user      |

---

## Standard Response Format

**Success:**
```json
{
  "success": true,
  "message": "Success",
  "data": { }
}
```

**Paginated:**
```json
{
  "success": true,
  "message": "Success",
  "data": [ ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [ ]
}
```

---

## Health Check

```
GET /health
```
```json
{
  "success": true,
  "message": "Muganga SACCO API is running",
  "environment": "development",
  "timestamp": "2024-01-20T10:00:00.000Z"
}
```
