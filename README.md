# eBidNow
**eBidNow** is a real-time online auction platform built with the MERN stack. It features secure JWT authentication and live bidding via Socket.io. Sellers can list products, and buyers can place bids instantly. From art to electronics, eBidNow brings seamless, real-time auctions to your fingertips.
# 🛒 eBidNow - Real-Time Online Auction Platform

It is a real-time web-based auction system built using the MERN stack. It allows users to buy and sell products via live auctions with instant bid updates powered by WebSockets. The platform includes secure JWT-based authentication, user roles (admin, seller, bidder), and a clean, mobile-friendly interface.

## 🚀 Features

- 🔐 **User Authentication** (JWT-based login/signup)
- 🏷️ **Product Listings** with images, descriptions, and metadata
- 📢 **Real-Time Bidding** with live updates using **Socket.io**
- 👥 **Role-Based Access** for Admins, Sellers, and Buyers
- 📊 **Dashboard** with product, bid, and auction management
- 📨 **Notifications** for auction events and outcomes
- 🖼️ **Image Upload Support** via Multer
- 📱 **Responsive Design** using Bootstrap


## 🛠️ Tech Stack

| Layer        | Technology                   |
|--------------|------------------------------|
| Frontend     | React.js, Bootstrap          |
| Backend      | Node.js, Express.js          |
| Database     | MongoDB (with Mongoose)      |
| Real-time    | Socket.io (WebSockets)       |
| Auth         | JWT (JSON Web Token)         |
| File Upload  | Multer                       |


## 📦 Modules Overview

- **User System**: Register, login, manage profile, view bid history
- **Product Module**: Add, view, filter, and delete products
- **Auction Module**: Create, schedule, and monitor live auctions
- **Bidding System**: Place and view live bids, track auction status
- **Admin Panel**: Manage users and platform content
- **Notifications**: Real-time alerts for new bids and auction results

## 📐 Database Structure

### Users
- `userId`, `name`, `email`, `password`, `isAdmin`, `createdAt`, `updatedAt`

### Products
- `productId`, `name`, `description`, `image`, `startingPrice`, `createdBy`, `createdAt`

### Auctions
- `auctionId`, `product`, `startTime`, `endTime`, `isActive`, `createdBy`

### Bids
- `bidId`, `auction`, `user`, `amount`, `timestamp`

---

## 🖥️ System Requirements

### Hardware:
- Minimum: 4GB RAM, Intel i3 or higher

### Software:
- Node.js, MongoDB, VS Code
- OS: Windows/Linux/macOS

## 📷 Screens & UI Modules

- **Home Page**: Welcome intro + featured auctions
- **Register/Login**: Secure access for sellers and buyers
- **Product Page**: Item image, description, filters, and condition tags
- **Dashboard**: Manage auctions, bids, and listings
- **Auction Page**: Real-time bidding interface
- **Profile Section**: View/update user info, activity history

## 📈 Future Enhancements

- 💳 Payment gateway integration
- 📊 Analytics and reporting
- 📱 Mobile app version (React Native)
- 🔐 2FA security

## 📚 Setup & Installation
1) Clone The Respiratory
   
2) Install dependencies
cd client
npm install

3)Run the development servers
# Backend
cd server
nodemon

# Frontend
cd client
npm start

