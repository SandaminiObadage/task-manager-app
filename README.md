# Task Manager App (Angular + Spring Boot)

This project is a full-stack Task Manager built for your assignment requirements.

## Implemented Scope

### Backend (Spring Boot)
- REST API for tasks with full CRUD
- MySQL persistence with Spring Data JPA
- Layered architecture: controller, service, repository
- Validation with clear API errors
- Global exception handling
- JWT authentication (register/login + protected task endpoints)
- Spring Security with stateless bearer-token authorization
- CORS configured for Angular frontend via application properties
- Optional filter by status via query parameter

### Frontend (Angular)
- Routed pages:
  - Login page
  - Register page
  - Task list page
  - Add task page
  - Edit task page
- Reactive form for create/update
- Validation:
  - Required title
  - Max length checks
- Login/register validation and error handling
- API integration via HttpClient service
- Auth interceptor to attach JWT bearer token
- Route guard to protect task routes
- Error handling and user feedback states
- Status filter and text search
- Enhanced responsive UI design

### Bonus Included
- Docker setup for full stack using Docker Compose
  - MySQL
  - Spring Boot backend
  - Angular frontend (served by Nginx)

## Project Structure

- backend/taskmanager: Spring Boot backend
- frontend/task-manager-frontend: Angular frontend
- docker-compose.yml: Full stack containers

## Backend Setup (Local)

Prerequisites:
- Java 17+
- MySQL 8+
- Maven (or use Maven Wrapper)

1. Create database:

```sql
CREATE DATABASE taskdb;
```

2. Configure credentials in backend/taskmanager/src/main/resources/application.properties.

Defaults are:
- DB URL: jdbc:mysql://localhost:3306/taskdb
- Username: hashini
- Password: hashini123

You can also override using environment variables:
- SPRING_DATASOURCE_URL
- SPRING_DATASOURCE_USERNAME
- SPRING_DATASOURCE_PASSWORD
- APP_JWT_SECRET
- APP_JWT_EXPIRATION_MS
- APP_CORS_ALLOWED_ORIGINS

3. Run backend:

```bash
cd backend/taskmanager
./mvnw spring-boot:run
```

On Windows PowerShell:

```powershell
cd backend/taskmanager
.\mvnw.cmd spring-boot:run
```

Backend URL: http://localhost:8080

## Frontend Setup (Local)

Prerequisites:
- Node.js 20+ (or newer LTS)
- npm

1. Run frontend:

```bash
cd frontend/task-manager-frontend
npm install
npm start
```

Frontend URL: http://localhost:4200

## API Endpoints

### Authentication

Base path: /api/auth

- POST /api/auth/register
- POST /api/auth/login

Register/Login request payload:

```json
{
  "username": "student1",
  "password": "secret123"
}
```

Auth response payload:

```json
{
  "token": "<jwt-token>",
  "tokenType": "Bearer",
  "expiresIn": 86400,
  "username": "student1"
}
```

Use header for protected endpoints:

```http
Authorization: Bearer <jwt-token>
```

### Task Management (Protected)

Base path: /api/tasks

- GET /api/tasks
- GET /api/tasks?status=TO_DO|IN_PROGRESS|DONE
- GET /api/tasks/{id}
- POST /api/tasks
- PUT /api/tasks/{id}
- DELETE /api/tasks/{id}

### Task Payload (Create/Update)

```json
{
  "title": "Finish assignment",
  "description": "Implement full stack task manager",
  "status": "IN_PROGRESS"
}
```

## Docker Run

From project root:

```bash
docker compose up --build
```

Services:
- Frontend: http://localhost:4200
- Backend: http://localhost:8080
- MySQL: localhost:3308

Docker DB credentials:
- Database: taskdb
- Username: hashini
- Password: hashini123
- Root password: hashini123

Stop services:

```bash
docker compose down
```

To also remove DB volume:

```bash
docker compose down -v
```

## Notes

- Task APIs are secured and require a valid JWT token.
- Register/login can be done directly from the Angular UI.
