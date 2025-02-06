# URL shortener application

A URL shortener application built with Node.js, Express, and MongoDB. This app allows users to shorten long URLs into compact, shareable links and provides analytics for the shortened URLs.

## Table of contents

- [Project Features](#project-features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Redis Setup](#redis-setup)
- [Running the Project](#running-the-project)
- [Running the project in docker ](#running-the-project-in-docker)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Contact](#contact)


## Project Features

- User Authentication: Google authentication.
- Shorten URLs: Convert long URLs into short, shareable links.
- Custom Aliases: Optionally provide a custom alias for the short URL.
- Topic tags: Use topic tags to better manager urls for analysis such as marketing, sales etc.
- Analytics: Track total clicks, unique users, clicks by date, OS, and device type.
- Redis Caching: Improve performance with Redis caching for frequently accessed data.
- Rate Limiting: Protect the API from abuse with rate limiting.


## Tech Stack

- Node.js: Backend JavaScript runtime.
- Express: Web framework for Node.js.
- MongoDB: NoSQL database for data storage.
- Mongoose: ODM for MongoDB.
- Google auth: For secure authentication with passport.js.
- Redis: Caching data.
- Express Rate Limit: Rate limiting.
- Code Quality: ESLint, Prettier.
- Railway: Deployment.
- Docker: Dockerise the application.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js: You need to have Node.js installed on your system. You can download it from [here](https://nodejs.org/en).
- MongoDB: Ensure MongoDB is installed locally or use a MongoDB cloud service like [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database).

## Setup

1. Clone the repository

   ```bash
     git clone https://github.com/AbhishekOraonDev/url-shortener-app.git
   ```

2. Install dependencies
Use npm to install the required dependencies.

  ```bash
    npm install
  ```

## Environment Variables
Create a .env file in the root directory with the following variables:

  ```bash
    PORT=3000
    GOOGLE_CLIENT_ID=<google-client-id>
    GOOGLE_CLIENT_SECRET=<google-client-secret>
    SESSION_SECRET=<session-secret>
    MONGO_URI=<mongo-uri>
    REDIS_ENDPOINT=<redis-endpoint>
    REDIS_PASSWORD=<redis-password>
    REDIS_HOST=<redis-host>
    CALLBACKURL=<callback-prod-url>
  ```

## Database Setup
If you're using a local MongoDB instance, you don't need to take any additional steps. If you're using MongoDB Atlas, set up your database cluster and get the connection string for the .env file.
1. Set up a MongoDB Atlas cluster [here](https://www.mongodb.com/products/platform/atlas-database).
2. Replace <your_mongo_db_uri> in the .env file with your MongoDB Atlas URI.

## Redis Setup

1. Create a redis server for caching, you can use redis/redis-stack image from dockerhub. 
2. Local Redis: Install Redis locally and ensure it’s running.
    Update the .env file:
    ```bash
        REDIS_ENDPOINT=redis://localhost:6379
    ```
3. Redis Cloud: Use a Redis cloud service and update the .env file with the provided credentials.

## Running the Project
To run the project locally, use the following commands.

1. Development Mode
    ```bash
        npm run dev
    ```
This will start the server using nodemon, which automatically restarts the server when code changes are detected.

2. Production Mode
   ```bash
        npm start
   ```
This starts the server in production mode.

## Running the project in docker 
To run the project in docker conatiner. 

1. Pull the docker image - 
    ```bash
        docker pull dash8/url-shortener-app:server
    ```
2. Start the Redis container:
    ```bash
        docker run -d --name redis-stack -p 6379:6379 redis/redis-stack
    ```

Ensure that you have docker installed. Use a redis/redis-stack image to run along with the above image.
Create a conatiner and run two image containers - "dash8/url-shortener-app:server" & "redis/redis-stack"


## API Endpoints
Access the api endpoints or api docs in the deployed swagger link - [👉 API Docs](https://url-shortener-app-production.up.railway.app/api/docs/).


## Project-Structure

```bash
.
├── config
│   ├── dbConnection.js
│   └── redisClient.js
├── controllers
│   ├── authController.js
│   ├── urlController.js
│   └── analyticsController.js
├── models
│   ├── UrlModel.js
│   ├── analyticsModel.js
│   └── UserModel.js
├── routes
│   ├── authRoutes.js
│   ├── urlRoutes.js
│   └── analyticsRoutes.js
├── middleware
│   ├── authMiddleware.js
│   ├── rateLimitingMiddleware.js
│   └── errorMiddleware.js
├── utils
│   ├── ErrorHandler.js
│   ├── getOSName.js
│   └── getDeviceType.js
├── index.js
└── .env

```


## Contact
  email - reachtoabhisheko@gmail.com
  linkedIn -[Abhishek Oraon](https://www.linkedin.com/in/abhishek-oraon-developer/)
