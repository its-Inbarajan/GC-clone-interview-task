📅 Calendar Task Manager
A drag-and-drop monthly calendar task planner built with React + TypeScript + DnD Kit + TailwindCSS.
Allows you to create, move, resize, and manage tasks visually — similar to Google Calendar.

✨ Features
 - 📆 Month grid view with dates and weeks
 - 
 - 🖱 Click-and-drag to create tasks across multiple days
 - 
 - ↔ Resize tasks by dragging left/right edges
 - 
 - 📦 Drag & drop tasks to new dates (across weeks)
 - 
 - 🎨 Task color coding by status:
 - 
 - ✅ To Do → Green
 - 
 - 🚧 In Progress → Yellow
 - 
 - 📝 Review → Blue
 - 
 - 🛑 Completed → Red
 - 
 - 🗑 Delete tasks instantly
 - 
 - 🖊 Edit task details (name, category, dates)
 - 
 - 🌍 Timezone support (IST / Asia-Kolkat)


🛠 Tech Stack
 - React (with Hooks)
  
 - TypeScript
  
 - @dnd-kit/core (drag & drop)
  
 - Moment.js (date utilities + timezone)
  
 - Tailwind CSS (styling)

🚀 Getting Started
1️⃣ Clone the Repository

 - git clone https://github.com/your-username/calendar-task-manager.git
 - cd calendar-task-manager

2️⃣ Install Dependencies
Make sure you have Node.js v20+ installed.

 - npm install

3️⃣ Run the Development Server

- npm run dev

This will start Vite’s dev server and you can open:

http://localhost:5173


📄 How to Use
For Visitors
1. Create a Task

 - Click and drag from a start date to an end date.
 - Release to open the “Create Task” modal.
 - Enter the task name and select status.

2. Move a Task

 - Click and drag the middle of the task bar to a new date.
 - Resize a Task
 - Drag from the left/right handle to change start/end date (can cross weeks).

3. Edit/Delete a Task

 - Click the ✏️ button to edit.

For Developers
  Code Structure
  
src/
├── components/
│   ├── Calendar.tsx      # Main calendar view
│   ├── TaskBar.tsx       # Draggable task bar component
│   └── Modal.tsx         # Create/Edit/Delete modals
├── utils/
│   └── helper.ts         # Date helper functions
├── styles/
│   └── index.css         # Tailwind base styles
└── main.tsx              # App entry point

