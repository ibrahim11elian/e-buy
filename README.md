# E-Buy API

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [File Structure](#file-structure)
- [API Documentation](#api-documentation)
- [Entity-Relationship Diagram (ERD)](#entity-relationship-diagram-erd)
- [Deployment](#deployment)
- [Built With](#built-with)
- [Author](#author)

## Introduction

E-Buy is a comprehensive e-commerce platform. This application allows users to browse products, add them to their cart, place orders, manage their profiles, and more.

## Features

- **User Authentication and Authorization:** Secure user registration, login, and role-based access control.
- **Product Management:** CRUD operations for products with categories and reviews.
- **Shopping Cart:** Add, update, and remove items in the shopping cart.
- **Order Management:** Place orders, track order status, and view order history.
- **User Profile and Address Management:** Update profile information and manage shipping addresses.
- **Favorites Management:** Add products to favorites and view favorite products.
- **Search and Filtering:** Search products by name, description, and categories, with filtering by price
- **Product Reviews and Ratings:** Users can leave reviews and ratings for products.
- **Admin Dashboard:** Sales overview, product performance analysis, and user engagement tracking.
- **Email Notifications:** Automated email notifications for order updates and user verifications, password resetting(⚠️ **Email links wants to be updated with the front-end links**).
- **Secure Payment Processing:** Integration with payment gateways for secure transactions.
- **Admin Roles and Permissions:** Multi-level admin roles with customizable permissions.
- **Error Handling and Logging:** Robust error handling and logging for debugging and monitoring.
- **API Documentation:** Comprehensive API documentation for easy integration.
- **Security:** Implement security best practices, such as input validation, SQL injection protection, and secure
- **Scalability:** Designed for horizontal scaling and load balancing.
- **Code Quality and Readability:** Adherence to coding standards, code reviews, and refactoring
- **Code Organization and Structure:** Modular code organization with clear separation of concerns.

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/ibrahim11elian/e-buy.git
   ```

2. **Navigate to the project directory:**

   ```bash
   cd e-buy
   ```

3. **Install dependencies:**

   ```bash
   npm install
   ```

4. **Set up environment variables:**  
   Create a `.env` file in the root directory and add necessary variables:

   **⚠️ Note:** It is strongly recommended to connect with a hosted database instead of a local one because the application utilizes sessions. Atlas provides built-in support for replication, automated backups, and seamless scalability across multiple nodes. This ensures high availability and fault tolerance without the need for manually configuring replicas and scaling resources. Using MongoDB Atlas simplifies database management, allowing you to focus more on developing your application rather than infrastructure maintenance.

   ```.env
   PORT=3000
   NODE_ENV=development
   DB_HOST=
   LOCAL_DB=mongodb://localhost:27017/e_buy

   # Company Email
   EMAIL_FROM=

   HASH_SALT=10

   JWT_SECRET=
   JWT_EXPIRES_IN=10m
   JWT_REFRESH_SECRET=
   JWT_REFRESH_EXPIRES_IN=7d
   JWT_COOKIE_EXPIRES_IN=10


   # Stripe
   STRIPE_KEY=
   STRIPE_WEBHOOK_SECRET=

   # SenGrid
   SENDGRID_USERNAME=
   SENDGRID_PASSWORD=


   # mailtrap
   EMAIL_HOST=
   EMAIL_PORT=
   EMAIL_USERNAME=
   EMAIL_PASSWORD=

   # Cloudinary
   CLOUDINARY_CLOUD_NAME=
   CLOUDINARY_API_KEY=
   CLOUDINARY_API_SECRET=
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

## Usage

After setting up and starting the server, you can access the application at `http://localhost:3000`.

### User Authentication

- **Register a new user:** Allows users to create an account.
- **Login with existing credentials:** Enables users to log in and access their account.
- **Manage user profile:** Update personal information, profile picture, etc.

### Product Management

- **Browse available products:** View a list of all products.
- **Search for products:** Filter products by category, name, price, etc.
- **View product details:** See detailed information and reviews of a product.
- **Admin functionalities:** Add, update, or delete products.

### Shopping Cart

- **Add products to the cart:** Users can add desired products to their shopping cart.
- **Update product quantities:** Adjust the number of items for each product in the cart.
- **Remove products from the cart:** Delete items from the cart.

### Order Management

- **Place orders:** Complete the purchase of items in the cart.
- **View order history:** Check past orders and their statuses.
- **Track order status:** Monitor the current status of orders (Pending, Shipped, Delivered, Cancelled).

### User Profile and Address Management

- **Update user profile:** Change personal details and profile picture.
- **Manage shipping addresses:** Add, update, or delete shipping addresses.

### Favorites Management

- **Add products to favorites:** Save products to a favorites list for easy access.
- **View favorite products:** See a list of all favorited products.

### Admin Dashboard

- **Sales overview:** View total sales and revenue.
- **Product performance analysis:** Analyze which products are performing well.
- **User engagement tracking:** Monitor user activity and engagement.

## File Structure

The project is structured as follows:

```txt
.
├── app.log
├── E-Buy ERD.pdf
├── LICENSE
├── package.json
├── package-lock.json
├── README.md
├── src
│   ├── app.ts
│   ├── controllers
│   │   ├── cart.ts
│   │   ├── dashboard.ts
│   │   ├── helpers
│   │   │   ├── authentication.ts
│   │   │   ├── base.ts
│   │   │   └── error.ts
│   │   ├── order.ts
│   │   ├── product
│   │   │   ├── product.ts
│   │   │   └── review.ts
│   │   └── user
│   │       ├── address.ts
│   │       ├── favorites.ts
│   │       ├── profile.ts
│   │       └── user.ts
│   ├── models
│   │   ├── cart.ts
│   │   ├── order.ts
│   │   ├── product
│   │   │   ├── product.ts
│   │   │   └── reviews.ts
│   │   └── user
│   │       ├── address.ts
│   │       ├── favorites.ts
│   │       ├── profile.ts
│   │       ├── tokens.ts
│   │       └── user.ts
│   ├── routes
│   │   ├── cart-routes.ts
│   │   ├── dashboard-routes.ts
│   │   ├── index.ts
│   │   ├── order-routes.ts
│   │   ├── product
│   │   │   ├── product-routes.ts
│   │   │   └── review-routes.ts
│   │   └── user
│   │       ├── address-routes.ts
│   │       ├── admin-routes.ts
│   │       ├── favorites-routes.ts
│   │       ├── profile-routes.ts
│   │       └── user-routes.ts
│   ├── server.ts
│   ├── utils
│   │   ├── api-features.ts
│   │   ├── cloudinary-config.ts
│   │   ├── cloudinary-controller.ts
│   │   ├── email.ts
│   │   ├── error.ts
│   │   ├── logger.ts
│   │   ├── snitize-input.ts
│   │   └── uploader.ts
│   └── views
│       ├── baseEmail.pug
│       ├── orderShipped.pug
│       ├── passwordReset.pug
│       ├── _style.pug
│       ├── verify.pug
│       └── welcome.pug
├── tsconfig.json
└── types
    └── express.d.ts
```

### Description of Key Directories and Files

- `src/app.ts:` The main application file that sets up the Express app.
- `src/controllers/:` Contains the controllers for different functionalities.

  - `cart.ts:` Handles cart-related operations.
  - `dashboard.ts:` Handles admin dashboard operations.
  - `helpers/:` Contains helper functions for authentication, base operations, and error handling.
  - `order.ts:` Manages order-related operations.
  - `product/:` Handles product and review operations.
  - `user/:` Manages user-related operations like address, favorites, profile, and user account.

- `src/models/:` Contains the Mongoose schemas for different data models.
  - `cart.ts:` Schema for the shopping cart.
  - `order.ts:` Schema for orders.
  - `product/:` Schemas for products and reviews.
  - `user/:` Schemas for user-related data (address, favorites, profile, tokens, and user account).
- `src/routes/:` Defines the routes for different functionalities.
  - `cart-routes.ts:` Routes for cart operations.
  - `dashboard-routes.ts:` Routes for admin dashboard operations.
  - `index.ts:` Main entry point for all routes.
  - `order-routes.ts:` Routes for order operations.
  - `product/:` Routes for product and review operations.
  - `user/:` Routes for user-related operations (address, admin, favorites, profile, and user account).
- `src/server.ts:` The server file that starts the Express app.
- `src/utils/:` Contains utility functions and configurations.
  - `api-features.ts:` Utilities for API features like filtering, pagination, etc.
  - `cloudinary-config.ts:` Configuration for Cloudinary.
  - `cloudinary-controller.ts:` Controller for handling Cloudinary image uploads.
  - `email.ts:` Functions for sending emails.
  - `error.ts:` Custom error handling functions.
  - `logger.ts:` Logger configuration.
  - `sanitize-input.ts:` Functions for sanitizing input.
  - `uploader.ts:` Utilities for file uploading.
- `src/views/:` Contains email templates.
  - `baseEmail.pug:` Base template for emails.
  - `orderShipped.pug:` Template for order shipped notification.
  - `passwordReset.pug:` Template for password reset email.
  - `_style.pug:` Styles for emails.
  - `verify.pug:` Template for email verification.
  - `welcome.pug:` Template for welcome email.
- `types/express.d.ts:` Type definitions for extending Express.

## API Documentation

Detailed API documentation is available on [Postman](https://documenter.getpostman.com/view/20023230/2sA3XY6xzR).

## Entity-Relationship Diagram (ERD)

For the ERD of the database schema and all info about DB collections, please refer to [this file](./E-Buy%20ERD.pdf). _this ERD was generated by [DBSchema](https://dbschema.com/) app_

## Deployment

This project is deployed on [Vercel](https://www.vercel.com/). You can find the live API at [https://e-buy-sigma.vercel.app](https://e-buy-sigma.vercel.app).

## Built With

- [Node.js](https://nodejs.org/en/)
- [Express.js](https://expressjs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [MongoDB](https://www.mongodb.com/)
- [Mongoose](https://mongoosejs.com/) - MongoDB object modeling for Node.js
- [Bcryptjs](https://www.npmjs.com/package/bcryptjs) - Password hashing library
- [Cloudinary](https://cloudinary.com/) - Media management platform
- [Compression](https://www.npmjs.com/package/compression) - HTTP compression middleware for Express
- [Cookie-parser](https://www.npmjs.com/package/cookie-parser) - Cookie parsing middleware
- [Cors](https://www.npmjs.com/package/cors) - CORS middleware for Express
- [Express-mongo-sanitize](https://www.npmjs.com/package/express-mongo-sanitize) - Middleware to sanitize MongoDB queries
- [Express-rate-limit](https://www.npmjs.com/package/express-rate-limit) - Rate limiting middleware for Express
- [Helmet](https://www.npmjs.com/package/helmet) - Security middleware for Express
- [Hpp](https://www.npmjs.com/package/hpp) - HTTP parameter pollution protection middleware
- [Html-to-text](https://www.npmjs.com/package/html-to-text) - HTML to plain text conversion utility
- [Jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) - JSON Web Token implementation
- [Morgan](https://www.npmjs.com/package/morgan) - HTTP request logger middleware
- [Multer](https://www.npmjs.com/package/multer) - Middleware for handling multipart/form-data
- [Nodemailer](https://nodemailer.com/about/) - Node.js library for sending emails
- [Pug](https://pugjs.org/) - Template engine for Node.js
- [Sanitize-html](https://www.npmjs.com/package/sanitize-html) - HTML sanitizer
- [Sharp](https://sharp.pixelplumbing.com/) - Image processing library
- [Stripe](https://stripe.com/) - Payment processing platform
- [Winston](https://www.npmjs.com/package/winston) - Logging library for Node.js
- [Postman](https://www.postman.com/) - Api testing

## Author

<p align="left">

<a href="https://www.linkedin.com/in/ibrahim-ahmed-a8bba9196" target="_blank">![LinkedIn](https://img.shields.io/badge/linkedin-%230077B5.svg?style=for-the-badge&logo=linkedin&logoColor=white)
</a>
<a href="https://www.facebook.com/ibrahim11ahmed" target="_blank">![Facebook](https://img.shields.io/badge/Facebook-%231877F2.svg?style=for-the-badge&logo=Facebook&logoColor=white)
</a>
<a href="mailto:ibrahim11elian@gmail.com" target="_blank">![Gmail](https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white)
</a>
<a href="tel:+201157676284" target="_blank">![WhatsApp](https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)
</a>
<a href="https://www.instagram.com/ibrahim11ahmed/" target="_blank">![Instagram](https://img.shields.io/badge/Instagram-%23E4405F.svg?style=for-the-badge&logo=Instagram&logoColor=white)
</a>
<a href="https://twitter.com/ibrahim11elian" target="_blank">![Twitter](https://img.shields.io/badge/Twitter-%231DA1F2.svg?style=for-the-badge&logo=Twitter&logoColor=white)
<a href="https://leetcode.com/ibrahim11elian" target="_blank">![LeetCode](https://img.shields.io/badge/LeetCode-000000?style=for-the-badge&logo=LeetCode&logoColor=#d16c06)

</p>
