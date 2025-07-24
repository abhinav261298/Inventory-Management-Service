# Project Structure

```
.
├── README.md                # Project overview and setup instructions
├── Project-structure.md     # This file
├── package.json             # NPM dependencies and scripts
├── seed.js                  # Database seeding script (scalable, uses faker, batching)
├── src/
│   ├── index.js             # Main Express app entry point
│   ├── models/              # Mongoose models (Category, Product, SKU) with indexes for performance
│   ├── routes/              # Express route handlers for API endpoints (optimized with .lean(), pagination)
│   ├── tests/               # Unit and integration tests (Jest + Supertest)
│   └── utils/               # (For future) Helpers, services, and utilities (e.g., seeding, business logic)
```

## Folders
- **models/**: Mongoose schemas for MongoDB collections, with indexes for fast search/filtering
- **routes/**: Express routers for each resource (category, product, sku, healthcheck), using `.lean()` and pagination for performance
- **tests/**: All Jest/Supertest test files for API endpoints
- **utils/**: (For future) Place for helpers, services, business logic, and utilities (e.g., seeding helpers, DI, etc.)

## Key Files
- **index.js**: Sets up Express app, connects to MongoDB, registers routes
- **seed.js**: Populates the database with large, realistic sample data using faker and batching (scalable for millions of records)
- **README.md**: How to set up, run, and use the project
- **Project-structure.md**: This file

## Scalability & Future-Readiness
- The codebase is structured for easy extension: you can add services, DI, TypeScript, and more as the project grows.
- Models use MongoDB indexes for fast queries.
- All major queries use `.lean()` for memory efficiency.
- Pagination is enforced for endpoints returning large result sets.
- The seeding logic is efficient and can be scaled up by changing constants in `seed.js`. 