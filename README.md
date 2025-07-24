# E-commerce Inventory Management Service

A production-grade Express.js + MongoDB REST API for managing products, categories, and SKUs for an e-commerce inventory system.

## Features
- CRUD for Categories, Products, SKUs
- Product search (case-insensitive), filter by category (case-insensitive), and pagination
- SKU variant management
- Swagger API documentation
- Complete unit test coverage (Jest + Supertest)
- Optimized for large datasets (thousands to millions of records)
- Uses MongoDB indexes and `.lean()` for high performance

## Project Structure
See [Project-structure.md](./Project-structure.md)

## Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your `.env` file with your MongoDB Atlas URI:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/prod_inventory_management?retryWrites=true&w=majority
   ```

## Seeding Large Datasets
- The project includes a powerful seeding script using [`@faker-js/faker`](https://www.npmjs.com/package/@faker-js/faker) to generate realistic data.
- By default, it will insert **50 categories**, **1,000 products**, and **10,000 SKUs** with valid relationships.
- You can adjust the amount of data by editing the constants at the top of `seed.js`:
  ```js
  const NUM_CATEGORIES = 50;
  const NUM_PRODUCTS = 1000;
  const NUM_SKUS = 10000;
  ```
- To run the seed script:
  ```bash
  npm install @faker-js/faker
  node seed.js
  ```

## Running the Server
```bash
npm start
```

## API Documentation
Visit [http://localhost:3000/api/docs](http://localhost:3000/api/docs) for Swagger UI.

## Running Tests
```bash
npm test
```

## Performance & Scalability
- The API uses MongoDB indexes for fast search and filtering.
- All major queries use `.lean()` for memory efficiency.
- Pagination is enforced for all endpoints returning large result sets.
- The codebase is structured for easy extension (services, utils, DI, TypeScript, etc.).

## Postman Collection
See `postman_collection.json` for ready-to-import API requests. 