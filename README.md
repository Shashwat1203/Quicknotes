# QuickNotes SaaS ⚡

A production-level full-stack note-taking application designed for efficiency, security, and professional monitoring.

## ✨ Features

- **Auth System**: Secure Signup & Login with JWT and Bcrypt hashing.
- **Roles**: Admin, Teacher, and Student workflows.
- **Homework System**: Teachers can assign view-only homework to students.
- **Global Monitoring**: Admin dashboard with system analytics and global activity feed.
- **Premium UI**: Modern Glassmorphism design with auto-dark mode, smooth animations, and toast notifications.
- **Cloud Database**: Powered by MongoDB Atlas.

## 🚀 Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB Atlas (Mongoose).
- **Security**: JWT (JSON Web Tokens), Bcrypt.js.

## 🛠️ Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <your-repo-link>
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the `backend` folder:
   ```env
   PORT=3000
   MONGODB_URI=your_mongodb_atlas_uri
   JWT_SECRET=your_secret_key
   ```

4. **Run the App**:
   ```bash
   node server.js
   ```
   Open `http://localhost:3000` in your browser.

## 📜 License
MIT License
