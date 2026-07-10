# EN2H Booking Platform REST API

Welcome to the backend REST API for the EN2H Booking Platform. This project is built using **NestJS**, **TypeScript**, and **TypeORM** connected to a **PostgreSQL** database. 

It provides robust features for service management (for authenticated managers), user authentication with JWT access/refresh token rotation, and a public booking flow for customers.

---

## 1. Project Overview

This API is designed to manage services and bookings. It implements several custom business rules, validations, and security policies to maintain scheduling consistency:

### Key Highlights
*   **Modular Architecture**: Built following NestJS modular design guidelines.
*   **JWT Authentication & Refresh Tokens**: Secured endpoint access for managers, incorporating JWT tokens with refresh token rotation and revocation (logout).
*   **Prevent Duplicate Bookings (Slot Uniqueness)**: Combines a database-level partial unique index and application validation to block double-booking active slots of a service while allowing slots to be reused if a previous booking was cancelled.
*   **Optional Authentication**: Service lookup endpoints (`GET /services`) adapt their response based on who is asking. Public users see only active services, while authenticated managers see all of them.
*   **Pagination, Search, & Filtering**: Paginated API list responses with query filters for searching customer details/service titles and status filtering.
*   **Global Exception Handling**: All validation and business logic exceptions are translated into a standardized JSON response structure.
*   **Docker Support**: Includes a multi-stage `Dockerfile` and a `docker-compose.yml` configuration.
*   **Swagger Documentation**: Open API specification configured and exposed directly.

---

## 2. Environment Variables

Create a `.env` file in the root directory (based on `.env.example`). The application is pre-configured to connect to the Neon database provided in the instructions:

```env
PORT=3000
NODE_ENV=development

# Database Connection
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# JWT Secrets
JWT_ACCESS_SECRET=super_secret_access_key_en2h_booking_system_2026
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_SECRET=super_secret_refresh_key_en2h_booking_system_2026
JWT_REFRESH_EXPIRATION=7d
```

---

## 3. Installation Steps

Clone the repository and install the dependencies:

```bash
# Install NPM packages
npm install
```

---

## 4. Running the Application

### Running Locally
```bash
# Development mode with hot-reloading
npm run start:dev

# Production mode
npm run start:prod
```

### Running with Docker
You can spin up the application along with a local PostgreSQL container using Docker Compose:

```bash
# Build and run using docker-compose
docker-compose up --build
```
*Note: The default environment in docker-compose.yml connects directly to the Neon PostgreSQL instance, but a local PG service is defined for offline development.*

### Deploying to Render
We have provided a `render.yaml` Blueprint configuration for quick deployment.

To deploy this project:
1. Push the code to your GitHub repository (public or private).
2. Go to the **Render Dashboard**, click **New +** at the top right, and select **Blueprint**.
3. Link your GitHub repository.
4. Render will automatically parse the `render.yaml` file, build the Docker container, run migrations on start, and host the web service. It will automatically generate secure, random secrets for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.

---

## 5. Database Setup & Migrations

Database synchronization (`synchronize: false`) is disabled for stability. The app uses TypeORM migrations. 
Migrations are **executed automatically on application startup** (using `migrationsRun: true` in configuration), but you can also manage migrations manually using the CLI scripts:

```bash
# Build code and run pending migrations
npm run migration:run

# Revert the last applied migration
npm run migration:revert

# (Optional) Generate a new migration based on schema changes
npm run migration:generate
```

---

## 6. API Documentation

Swagger UI is integrated. When the server is running, visit:
👉 **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

### Summary of Endpoint Contracts

| Method | Endpoint | Authentication | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Public | Register a new manager user |
| **POST** | `/api/auth/login` | Public | Login and receive access/refresh tokens |
| **POST** | `/api/auth/refresh` | Public (Requires Refresh Token) | Request a new access token |
| **POST** | `/api/auth/logout` | Auth Required | Log out and revoke refresh token |
| **POST** | `/api/services` | Auth Required | Create a new service |
| **GET** | `/api/services` | Public (Optional Auth) | Get all services (paginated). Anonymous: active only; Manager: all. |
| **GET** | `/api/services/:id` | Public (Optional Auth) | Get service by ID. Anonymous: active only; Manager: all. |
| **PUT** | `/api/services/:id` | Auth Required | Update service details |
| **DELETE** | `/api/services/:id` | Auth Required | Delete service (fails if active bookings exist) |
| **POST** | `/api/bookings` | Public | Create a new booking |
| **GET** | `/api/bookings` | Auth Required | Get all bookings (paginated, searchable, filterable) |
| **GET** | `/api/bookings/:id` | Auth Required | Get booking by ID |
| **PATCH** | `/api/bookings/:id/status` | Auth Required | Update booking status (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`) |
| **PATCH** | `/api/bookings/:id/cancel` | Auth Required | Cancel booking |

---

## 7. Running Unit Tests

We have written comprehensive unit tests for business validation rules and API logics:

```bash
# Run unit tests
npm run test
```

---

## 8. Assumptions Made

1.  **Service Visibility**: In public browsing, inactive services (`isActive: false`) are hidden from customers. Registered managers are allowed to view inactive services for editing and administration.
2.  **Booking Cancellation Permissions**: While the instructions specify "customers can create bookings without authentication," we assumed booking status changes, cancellations, and list view queries are operations reserved for authenticated store managers.
3.  **Active Slot Definition**: Booking slot conflict prevention only checks against active bookings. If a slot contains a `CANCELLED` booking, it is considered open, allowing customers to book that slot.
4.  **Booking Date and Time**: To prevent timezones from corrupting date inputs, `bookingDate` is represented as a string `YYYY-MM-DD` and `bookingTime` as a string `HH:MM` at the validation layer, and converted strictly to PostgreSQL `date` and `time` columns. Date-time validity is checked by assembling the components and evaluating against the server's current timestamp.

---

## 9. Future Improvements

1.  **Email Notifications**: Send automated confirmation emails to customers on booking creation and cancellation.
2.  **Auth Roles (RBAC)**: Support multiple staff roles (e.g., Staff vs. Admin) to restrict service edits to admins while allowing staff to manage booking states.
3.  **Soft Deletion for Services**: Implement TypeORM `@DeleteDateColumn` (soft delete) for services, maintaining relational integrity with historical bookings while removing the service from active service catalogs.
4.  **Google Calendar Integration**: Add calendar hooks to automatically push confirmed bookings into a manager's Google Calendar.
