# FastAPI Blog - Next.js Frontend

A modern, fast, and responsive blog frontend built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS**, designed to pair seamlessly with a FastAPI backend.

---

## 🚀 Features

- **Next.js 16 App Router Architecture**: Clean folder structure, standardized error boundaries (`error.tsx`), not-found handlers (`not-found.tsx`), and skeleton loading states (`loading.tsx`).
- **Centralized Authentication**: Reactive `AuthContext` with automatic token synchronization across components, state persistence, and instant header state updates.
- **Modern UI & Icons**: Clean interface enhanced with `lucide-react` icons and customizable light/dark/system theme switching.
- **Toast Notifications**: Modern toast alerts powered by `sonner` for immediate user feedback on post creation, login, updates, and errors.
- **Optimized Media**: Image optimization using `next/image` with fallback handling for avatars and author pictures.
- **Full Blog Features**:
  - Feed with pagination ("Load More")
  - Post detail viewing, editing, and deletion for owners
  - Quick post creation dialog accessible from anywhere
  - User profiles and user-specific post filtering
  - Account settings (profile info update, avatar upload, password change, account deletion)
  - Password recovery (forgot password & reset password with token)

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4 & custom variables
- **Icons**: Lucide React
- **Notifications**: Sonner

---

## ⚙️ Environment Variables

Create a `.env.local` file in the root directory:

```env
# Backend API URL (default: http://127.0.0.1:8000)
BACKEND_URL=http://127.0.0.1:8000

# Base Path prefix if deploying under a subpath (optional)
NEXT_PUBLIC_BASE_PATH=
```

---

## 📦 Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for production

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```text
├── app/
│   ├── account/              # User profile & account management
│   ├── forgot-password/      # Password reset request page
│   ├── reset-password/       # Password reset confirmation page
│   ├── login/                # User authentication page
│   ├── register/             # User registration page
│   ├── posts/[postId]/       # Single post details, edit, delete
│   ├── users/[userId]/posts/ # Posts by specific user
│   ├── error.tsx             # Global error boundary
│   ├── loading.tsx           # Global skeleton loader
│   ├── not-found.tsx         # Standard 404 page
│   ├── layout.tsx            # Root layout with AuthProvider & Toaster
│   └── page.tsx              # Home feed with pagination
├── components/
│   ├── AppShell.tsx          # Navigation, theme switcher, post modal
│   ├── Modal.tsx             # Accessible portal-based modal
│   └── PostCard.tsx          # Article card with author avatar & date
├── context/
│   └── AuthContext.tsx       # Reactive authentication context
├── lib/
│   ├── api.ts                # API client helpers & fetch wrappers
│   ├── auth.ts               # Auth token re-exports
│   ├── types.ts              # TypeScript interface definitions
│   └── utils.ts              # ClassName merge utility (cn)
```

