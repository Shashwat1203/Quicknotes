# QuickNotes SaaS: User & Developer Guide

Congratulations! Your application is now connected to the cloud (MongoDB Atlas) and fully functional with Teacher/Admin roles. Use this guide for daily operation.

## 🚀 Daily Startup (How to "On")

1.  Open **VS Code**.
2.  Open your terminal in the `backend` folder.
3.  Run the following command:
    ```bash
    node server.js
    ```
4.  Once you see "Server is running..." and "MongoDB Connected," open your browser.
5.  Go to **[http://localhost:3000](http://localhost:3000)**.

## 🛑 Stopping the Application (How to "Off")

The "machine" running your app is actually your own computer. To stop it:
1.  Go to the VS Code terminal where the server is running.
2.  Press **`Ctrl + C`** on your keyboard.
3.  The server is now off. You can safely close VS Code or shut down your computer.

## 💾 Finding Your Saved Data

All your notes and users are stored safely in **MongoDB Atlas** (the cloud). 
- **Persistence**: Even if you shut down your computer or delete the local code, your notes remain in the cloud.
- **Login**: To see your data once again, simply start the server and **Log In** with the email and password you used when signing up.

## 🌐 Changing Wi-Fi or Moving Locations

Because we added the **`0.0.0.0/0`** rule in your MongoDB Network Access:
- **It works everywhere**: You can take your laptop to a cafe, a friend's house, or another city. As long as you have internet, the database will connect.
- **No changes needed**: You do not need to update your `.env` or any settings when you change Wi-Fi.

## 👥 Using the Roles

| Role | Primary Features |
| :--- | :--- |
| **Admin** | Can see global activity, delete users, and view system analytics. |
| **Teacher** | Can assign homework (view-only for students) and see student created notes. |
| **Student** | Can create personal notes and view assignments from teachers. |

### 🔑 Pro-Tip
If you ever want to see exactly what is in your database without using the app, go to the **"Database -> Browse Collections"** tab in your MongoDB Atlas dashboard. 
