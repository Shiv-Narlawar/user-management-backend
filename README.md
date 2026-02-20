# User Management Backend

A RESTful API backend for handling user authentication, management, and authorization. Built with Node.js, TypeScript, and Express to keep things type-safe and maintainable.

## What's Inside?

**Tech Stack:**
- Node.js with TypeScript for type safety
- Express for our API server
- Jest for comprehensive testing

### Prerequisites
- Node.js 
- npm 

### Installation

```bash
npm install
```

### Running the Server

```bash
npm start
```

Server will start and listen for requests (check your app.ts for the port).

## Testing

I've added pretty thorough test coverage. All 21 tests are passing!

### Run Tests

bash
npm test

**Authentication:**
- Local auth strategies
- JWT token handling

The tests use Jest mocks for the database, so you don't need your actual DB running to test.

## API Endpoints

### Base URL
```
http://localhost:PORT/api
```

### Health Check

**Check if the server is alive and kicking**

```
GET /health
```

**Response (200 OK):**
json
{
  "status": "OK",
  "message": "Backend is running successfully"
}
```

---

##  Authentication Endpoints

### User Login

**Authenticate a user with email and password. Returns a token for authenticated requests.**

```
POST /auth/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Success Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com",
  "name": "John Doe",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (400 Bad Request):**
```json
{
  "message": "Invalid email or password"
}
```

**Common Status Codes:**
- `200` - Login successful
- `400` - Invalid credentials or missing fields

---

## 👥 User Management Endpoints

### Get All Users

**Fetch a list of all users in the system.**

```
GET /users
```

**Success Response (200 OK):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com",
    "status": "active",
    "createdAt": "2026-02-19T10:30:00Z",
    "updatedAt": "2026-02-19T10:30:00Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "status": "active",
    "createdAt": "2026-02-18T14:20:00Z",
    "updatedAt": "2026-02-18T14:20:00Z"
  }
]
```

**Common Status Codes:**
- `200` - Users fetched successfully
- `500` - Server error

---

### Create a New User

**Add a new user to the system. Email must be unique!**

```
POST /users
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "password": "securePassword456",
  "status": "active"
}
```

**Success Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "status": "active",
  "createdAt": "2026-02-19T15:45:00Z",
  "updatedAt": "2026-02-19T15:45:00Z"
}
```

**Error Response - Email Already Exists (400 Bad Request):**
```json
{
  "message": "Email already exists"
}
```

**Error Response - Server Error (500 Internal Server Error):**
```json
{
  "message": "Internal Server Error"
}
```

**Common Status Codes:**
- `201` - User created successfully
- `400` - Email already exists or invalid input
- `500` - Server error

---

### Update User Information

**Modify an existing user's details (name, status, etc.).**

```
PUT /users/:id
Content-Type: application/json
```

**Replace `:id` with the actual user ID**

**Request Body (only include fields you want to update):**
```json
{
  "name": "Alice Johnson Updated",
  "status": "inactive"
}
```

**Success Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "name": "Alice Johnson Updated",
  "email": "alice@example.com",
  "status": "inactive",
  "createdAt": "2026-02-19T15:45:00Z",
  "updatedAt": "2026-02-19T16:15:30Z"
}
```

**Error Response - User Not Found (404 Not Found):**
```json
{
  "message": "User not found"
}
```

**Common Status Codes:**
- `200` - User updated successfully
- `404` - User with given ID doesn't exist
- `500` - Server error

---

### Delete a User

**Permanently remove a user from the system.**

```
DELETE /users/:id
```

**Replace `:id` with the actual user ID**

**Success Response (200 OK):**
```json
{
  "message": "User deleted successfully"
}
```

**Error Response - User Not Found (404 Not Found):**
```json
{
  "message": "User not found"
}
```

**Common Status Codes:**
- `200` - User deleted successfully
- `404` - User with given ID doesn't exist
- `500` - Server error

---

## API Response Format

All API responses follow this pattern:

**Success Response:**
```json
{
  "id": "...",
  "name": "...",
  "email": "...",
  // ... other fields
}
```

**Error Response:**
```json
{
  "message": "Error description here"
}
```

---

##  Authentication & Headers

When calling protected endpoints (if implemented), include your JWT token:

```
Authorization: Bearer <your-jwt-token>
```

---



## Before You Push Code

Make sure all tests pass:
```bash
npm test
```

---

##  Database Schema Design

The application uses **TypeORM** with **PostgreSQL** for database management. The schema includes the following core entities:

### Entity Relationships

```
User
├── id (UUID, primary key)
├── name (string)
├── email (string, unique)
├── password (string, encrypted)
├── status (enum: active, inactive)
├── roles (many-to-many relationship)
├── permissions (many-to-many relationship)
├── createdAt (timestamp)
└── updatedAt (timestamp)

Role
├── id (UUID, primary key)
├── name (string, unique)
├── description (string)
├── permissions (many-to-many relationship)
├── createdAt (timestamp)
└── updatedAt (timestamp)

Permission
├── id (UUID, primary key)
├── name (string, unique)
├── description (string)
├── createdAt (timestamp)
└── updatedAt (timestamp)

Application
├── id (UUID, primary key)
├── name (string)
├── description (string)
├── status (enum: active, inactive)
├── createdAt (timestamp)
└── updatedAt (timestamp)
```

### Key Features

- **Timestamps**: All entities include `createdAt` and `updatedAt` for audit trails
- **UUIDs**: Primary keys use UUID for distributed system compatibility
- **Enums**: Status fields use enums for type safety
- **Relationships**: Support for one-to-many and many-to-many relationships

---

## Generating Migrations

TypeORM migrations allow you to version control your database schema changes. Follow these steps to generate and run migrations:

### Generate a New Migration

After modifying entities, generate a migration file automatically:

```bash
npm run migration:generate
```

This command:
- Analyzes your entity definitions
- Detects schema changes
- Creates a new migration file in `src/migrations/`
- Names the file with a timestamp (e.g., `1771322673418-Init.ts`)

### Custom Migration Names

To generate a migration with a specific name:

```bash
npm run migration:generate -- NameOfMigration
```

Example:
```bash
npm run migration:generate -- AddUserStatusColumn
```

### Apply Pending Migrations

Run all pending migrations against your database:

```bash
npm run migration:run
```

**Before running migrations:**
- Ensure database connection is configured in `src/config/data-source.ts`
- Make sure your database is running and accessible
- Verify PostgreSQL connection details match your environment

### Revert the Last Migration

Undo the last applied migration:

```bash
npm run migration:revert
```

---

## Repository Pattern

Repositories provide a clean abstraction for database operations. They handle entity-specific queries and business logic.

### Using Repositories

#### Example: User Repository

```typescript
import { AppDataSource } from "./config/data-source";
import { User } from "./entities/user.entity";

const userRepository = AppDataSource.getRepository(User);

// Find all users
const allUsers = await userRepository.find();

// Find user by ID
const user = await userRepository.findOneBy({ id: userId });

// Find user by email
const userByEmail = await userRepository.findOneBy({ email: "user@example.com" });

// Create and save a user
const newUser = userRepository.create({
    name: "John Doe",
    email: "john@example.com",
    password: "hashedPassword"
});
await userRepository.save(newUser);

// Update a user
user.name = "Jane Doe";
await userRepository.save(user);

// Delete a user
await userRepository.remove(user);
```

