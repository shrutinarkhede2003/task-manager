# Task Manager – Proxie Studio Frontend Assignment

A task management web app built with **SvelteKit, Supabase and CSS** as part of the Proxie Studio Frontend Intern assignment.

## 🔧 Tech Stack

- SvelteKit
- Supabase (Auth + Database)
- TypeScript (partially)
- CSS (custom styling)

---

## 🚀 Features

### Authentication
- Sign up with email and password
- Login with email and password
- Logout (clears session and redirects to login)
- Basic "remember session" behaviour via Supabase auth
- Protected `/app` route – redirects to login if user is not authenticated

### Task Management
- Create tasks with:
  - Title (required, max 100 chars)
  - Description (optional, max 500 chars)
  - Priority: Low / Medium / High
  - Due date (required)
  - Status (default: Pending)
- View only your own tasks (Supabase RLS)
- Edit task (title, description, priority, due date, status)
- Delete task (with confirmation)
- Mark tasks as Completed / In Progress / Pending via status

### Task List Features
- Sort:
  - Newest / Oldest
  - Due date (soonest / latest)
  - Priority (High → Low)
- Filter:
  - By status
  - By priority
- Search by title
- Empty state when no tasks match the filters

### UI/UX
- Responsive layout (tested on desktop + small width)
- Loading states for:
  - Auth check
  - Fetching tasks
  - Creating / updating / deleting tasks
- Disabled buttons during async actions
- Success / error messages on task operations

---

## 🗄️ Supabase Setup

1. Create a new Supabase project.
2. Create a `tasks` table:

   ```sql
   create table tasks (
     id uuid primary key default gen_random_uuid(),
     user_id uuid not null references auth.users(id) on delete cascade,
     title text not null,
     description text,
     priority text not null check (priority in ('Low', 'Medium', 'High')),
     due_date date not null,
     status text not null default 'Pending' check (status in ('Pending', 'In Progress', 'Completed')),
     created_at timestamptz default now()
   );

