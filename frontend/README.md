# 📝 Notes App with Authentication

A modern, feature-rich notes application built with React and Bootstrap, featuring user authentication, profile management, and advanced note organization.

## ✨ Features

### 🔐 Authentication System
- **Login**: Users can log in with email and password
- **Signup**: New users can create an account with email and password
- **Session Management**: User sessions are maintained using localStorage
- **Protected Routes**: Dashboard and Profile are accessible only to authenticated users
- **Logout**: Quick logout button in the navigation bar

### 👤 Profile Management
- View user email and password (masked)
- Change password functionality
- Secure password updates with confirmation

### 📋 Notes Dashboard
- **Create Notes**: Add notes with title, content, category, and priority
- **Edit Notes**: Update existing notes through a modal interface
- **Delete Notes**: Remove notes with confirmation
- **Search Notes**: Real-time search by title or content
- **Statistics**: View total notes, high-priority notes, and category count
- **Categories**: Organize notes into General, Work, Personal, Study, and Ideas
- **Priority Levels**: Set notes as Low, Medium, or High priority
- **Visual Indicators**: Color-coded badges for categories and priorities

### 🎨 User Interface
- Modern, responsive design using Bootstrap 5
- Clean and intuitive navigation
- Smooth animations and hover effects
- Mobile-friendly layout
- Custom scrollbar styling
- Professional color scheme

### 🔒 Security Features
- Password validation (minimum 6 characters)
- Email format validation
- Password confirmation on signup
- Duplicate email prevention
- User-specific note storage

## 🚀 Getting Started

### Prerequisites
- Node.js installed on your system
- npm or yarn package manager

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and visit:
```
http://localhost:3000
```

## 📱 How to Use

### First Time Users
1. Click on the application
2. You'll be redirected to the Login page
3. Click "Sign Up" to create a new account
4. Enter your email and password (min 6 characters)
5. Confirm your password
6. After successful signup, you'll be redirected to login
7. Log in with your credentials

### Creating Notes
1. After logging in, you'll see the Dashboard
2. Fill in the "Add New Note" form:
   - Enter a title
   - Write your content
   - Select a category
   - Set priority level
3. Click "Add Note" to save

### Managing Notes
- **Search**: Use the search bar to filter notes
- **Edit**: Click the "Edit" button on any note to modify it
- **Delete**: Click the "Delete" button to remove a note (confirmation required)
- **View Stats**: Check the statistics cards at the top of the dashboard

### Profile
1. Click on your email in the navigation bar
2. Select "Profile" from the dropdown
3. View your email and password
4. Click "Change Password" to update your password

### Logging Out
1. Click on your email in the navigation bar
2. Select "Logout" from the dropdown
3. You'll be redirected to the login page

## 🎯 Features Breakdown

### Components

1. **Login.js** - User authentication
2. **Signup.js** - New user registration
3. **Dashboard.js** - Main notes interface
4. **Profile.js** - User profile management
5. **Header.js** - Navigation bar with logout
6. **NoteForm.js** - Create notes with categories and priorities
7. **NotesList.js** - Display, edit, and delete notes
8. **NotesStats.js** - Visual statistics dashboard
9. **SearchFilter.js** - Real-time note search

### Data Storage
- User credentials stored in localStorage (`users`)
- Current session stored in localStorage (`currentUser`)
- Notes stored per user in localStorage (`notes`)
- Data persists across sessions

### Categories
- 📌 General
- 💼 Work
- 👤 Personal
- 📚 Study
- 💡 Ideas

### Priority Levels
- 🟢 Low (Green)
- 🟡 Medium (Yellow)
- 🔴 High (Red)

## 🔧 Technical Stack

- **Frontend Framework**: React 19.2.0
- **Routing**: React Router DOM 7.9.4
- **UI Framework**: React Bootstrap 2.10.10
- **Styling**: Bootstrap 5.3.8 + Custom CSS
- **State Management**: React Hooks (useState, useEffect)
- **HTTP Client**: Axios 1.12.2

## 📝 Future Enhancements

Potential features to add:
- Backend integration with Node.js/Express
- Database storage (MongoDB, PostgreSQL)
- Note sharing between users
- Rich text editor for notes
- File attachments
- Due dates and reminders
- Export notes to PDF
- Dark mode toggle
- Email verification
- Password reset functionality
- Tags for better organization
- Note archiving

## 🐛 Known Issues

- Data is stored in localStorage (not persistent across devices)
- No password encryption (suitable for development only)
- No backend API integration yet

## 📄 License

This project is open source and available for educational purposes.

## 👨‍💻 Author

Created as part of the CIE Project

---

**Note**: This is a frontend-only application using localStorage for data persistence. For production use, integrate with a proper backend API and database.
