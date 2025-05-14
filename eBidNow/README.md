# Online Auction Platform

A real-time online auction platform built with the MERN stack (MongoDB, Express, React, Node.js) and Socket.io for real-time bidding functionality.

## Features

- User authentication and authorization
- Product listing and management
- Real-time auction creation and bidding
- Dashboard for managing products, auctions, and bids
- Responsive design with Bootstrap

## Tech Stack

- **Frontend**: React, Bootstrap, Socket.io-client
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Real-time Communication**: Socket.io
- **Authentication**: JWT (JSON Web Tokens)

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/auction-platform.git
   cd auction-platform
   ```

2. Install server dependencies:
   ```
   cd server
   npm install
   ```

3. Install client dependencies:
   ```
   cd ../client
   npm install
   ```

4. Create a `.env` file in the server directory with the following variables:
   ```
   MONGODB_URI=mongodb://localhost:27017/auction-platform
   PORT=5000
   JWT_SECRET=your_jwt_secret_key_here
   ```

## Running the Application

### Development Mode

To run both the server and client concurrently:

```
cd server
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- Frontend development server on http://localhost:3000

### Production Mode

1. Build the client:
   ```
   cd client
   npm run build
   ```

2. Start the server:
   ```
   cd ../server
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login a user

### Users
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/password` - Change password

### Products
- `POST /api/products` - Create a new product
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `PUT /api/products/:id` - Update a product
- `DELETE /api/products/:id` - Delete a product
- `GET /api/products/user/me` - Get all products by current user

### Auctions
- `POST /api/auctions` - Create a new auction
- `GET /api/auctions` - Get all auctions
- `GET /api/auctions/active` - Get all active auctions
- `GET /api/auctions/:id` - Get auction by ID
- `PUT /api/auctions/:id` - Update auction details
- `DELETE /api/auctions/:id` - Cancel an auction
- `GET /api/auctions/user/me` - Get all auctions created by current user

### Bids
- `POST /api/bids` - Place a new bid
- `GET /api/bids/auction/:auctionId` - Get all bids for a specific auction
- `GET /api/bids/user/me` - Get all bids made by current user
- `GET /api/bids/active` - Get all active bids by current user
- `GET /api/bids/won` - Get all auctions won by current user

## Socket.io Events

- `joinAuction` - Join an auction room
- `leaveAuction` - Leave an auction room
- `newBid` - Place a new bid
- `bidPlaced` - Receive notification of a new bid

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [MongoDB](https://www.mongodb.com/)
- [Express](https://expressjs.com/)
- [React](https://reactjs.org/)
- [Node.js](https://nodejs.org/)
- [Socket.io](https://socket.io/)
- [Bootstrap](https://getbootstrap.com/) 