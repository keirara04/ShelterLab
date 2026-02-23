# ShelterLab — Complete Code Documentation

> **Written for:** Beginners, non-coders, and developers who are new to this tech stack.
> **Purpose:** Explain every file, folder, concept, and design decision in the ShelterLab codebase.

---

## Table of Contents

1. [What is ShelterLab?](#1-what-is-shelterlab)
2. [Tech Stack — Plain English](#2-tech-stack--plain-english)
3. [How to Run the Project](#3-how-to-run-the-project)
4. [Project File Structure](#4-project-file-structure)
5. [Configuration Files](#5-configuration-files)
6. [The Entry Points](#6-the-entry-points)
7. [Global Styles](#7-global-styles)
8. [Authentication System](#8-authentication-system)
9. [Pages](#9-pages)
10. [Shared Components](#10-shared-components)
11. [API Routes (Backend)](#11-api-routes-backend)
12. [Services & Utilities](#12-services--utilities)
13. [Database Structure](#13-database-structure)
14. [Security Features](#14-security-features)
15. [PWA (Installable App)](#15-pwa-installable-app)
16. [Error & Loading States](#16-error--loading-states)
17. [Glossary](#17-glossary)

---

## 1. What is ShelterLab?

ShelterLab is a **campus marketplace** — a website where university students in Korea can buy and sell second-hand items with each other. Think of it like a private version of Carousell or Facebook Marketplace, but exclusively for verified university students.

### Key Features

| Feature | What it does |
|---|---|
| **Listings** | Students post items for sale with photos, price, and description |
| **University Verification** | Only students with `.ac.kr` email addresses can sign up |
| **Trust Score (LabCred)** | A score that grows with each completed transaction — like a reputation system |
| **Reviews** | Buyers and sellers can rate each other after a transaction |
| **Push Notifications** | The app can send alerts about new listings |
| **PWA** | The website can be installed on a phone like a normal app |
| **AI Price Suggestions** | Uses Groq AI to suggest fair prices for items |
| **Admin Panel** | Admins can manage users, send announcements, and see stats |

### Supported Universities (9 total)
- Korea University
- Yonsei University
- Hanyang University
- Sungkyunkwan University
- Kyung Hee University
- Ewha Womans University
- Sejong University
- Konkuk University
- Seoultech

---

## 2. Tech Stack — Plain English

A "tech stack" is the collection of tools and technologies used to build the application.

### Frontend (What users see)

| Technology | What it is | Why it's used |
|---|---|---|
| **Next.js 16** | A framework built on top of React that handles routing, server functions, and performance | Makes building fast, modern websites much easier |
| **React 19** | A JavaScript library for building user interfaces with reusable "components" | The standard way to build interactive websites |
| **Tailwind CSS 4** | A utility-first CSS framework — instead of writing custom CSS, you add class names like `bg-blue-500` directly to your HTML | Very fast to write styles, consistent design |

### Backend (Server-side logic)

| Technology | What it is | Why it's used |
|---|---|---|
| **Next.js API Routes** | Next.js allows you to write backend server code inside the same project | No need for a separate server — everything lives in one place |
| **Supabase** | A managed database + authentication service built on PostgreSQL | Handles user accounts, stores data, and manages file uploads |

### Database & Storage

| Technology | What it is | Why it's used |
|---|---|---|
| **Supabase (PostgreSQL)** | A relational database — stores users, listings, reviews, etc. | Reliable, scalable, with built-in security rules (RLS) |
| **Supabase Storage** | Cloud file storage | Stores listing images |

### Extra Services

| Technology | What it is | Why it's used |
|---|---|---|
| **Brevo (formerly Sendinblue)** | An email sending service | Sends OTP/verification emails |
| **Upstash Redis** | A fast in-memory database | Used for rate limiting (prevents abuse) |
| **Groq AI** | An AI inference API | Suggests fair prices for items using LLM |
| **Vercel Analytics** | Analytics tool | Tracks page views and performance |
| **Web Push API** | Browser push notification standard | Sends real-time notifications to users |
| **Zod** | A validation library | Validates that form data is correct before saving it |

---

## 3. How to Run the Project

### Prerequisites
You need to have these installed on your computer:
- **Node.js** (v18 or later) — the JavaScript runtime
- **npm** (comes with Node.js) — the package manager

### Steps

```bash
# 1. Go into the project folder
cd kodaefriendlyshelter

# 2. Install all dependencies (only needed once)
npm install

# 3. Set up environment variables
# Copy the example file and fill in your real keys
cp .env.example .env.local
# Then edit .env.local with your actual Supabase, Brevo, etc. keys

# 4. Start the development server
npm run dev

# The website will be available at http://localhost:3000
```

### Available Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start development server with hot-reloading |
| `npm run build` | Build the production-ready version |
| `npm run start` | Run the production build |
| `npm run lint` | Check code for errors/style issues |

### Environment Variables (.env.local)

These are secret configuration values that the app needs to connect to external services. Never commit these to Git.

```env
NEXT_PUBLIC_SUPABASE_URL=       # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase public API key (safe to expose)
SUPABASE_SERVICE_ROLE_KEY=      # Supabase admin key (KEEP SECRET)
BREVO_API_KEY=                  # Brevo email service key
BREVO_SENDER_EMAIL=             # Email address to send from
GROQ_API_KEY=                   # Groq AI key for price suggestions
UPSTASH_REDIS_REST_URL=         # Upstash Redis URL for rate limiting
UPSTASH_REDIS_REST_TOKEN=       # Upstash Redis auth token
ADMIN_EMAIL=                    # Email of the admin user
NEXT_PUBLIC_VAPID_PUBLIC_KEY=   # Web Push public key
VAPID_PRIVATE_KEY=              # Web Push private key (KEEP SECRET)
VAPID_SUBJECT=                  # Email for Web Push contact
```

> **Note:** Variables starting with `NEXT_PUBLIC_` are safe to use in the browser. Variables without that prefix are server-only secrets.

---

## 4. Project File Structure

```
kodaefriendlyshelter/
│
├── public/                         Static files served directly (images, icons)
│   ├── manifest.json               PWA configuration
│   ├── sw.js                       Service Worker (offline support)
│   ├── offline.html                Page shown when offline
│   ├── robots.txt                  Search engine crawling rules
│   ├── logo.svg                    App logo
│   └── [University Logos].png      Logo images for each university
│
├── src/                            All application source code
│   ├── app/                        Next.js App Router pages and API routes
│   │   ├── layout.js               Root HTML wrapper (applied to ALL pages)
│   │   ├── page.js                 Homepage (the listing feed)
│   │   ├── globals.css             Global CSS styles
│   │   ├── error.js                Global error page
│   │   ├── sitemap.js              Auto-generated sitemap for SEO
│   │   │
│   │   ├── (auth)/                 Route GROUP for auth pages (no layout effect)
│   │   │   ├── login/page.js       Login page
│   │   │   └── signup/page.js      Sign up page
│   │   │
│   │   ├── (dashboard)/            Route GROUP for logged-in pages
│   │   │   ├── profile/            My profile page
│   │   │   ├── sell/               Create new listing
│   │   │   ├── my-listings/        Manage my listings
│   │   │   ├── my-sold-items/      View past sold items
│   │   │   ├── pasarmalam/         Special event page
│   │   │   └── listing/[id]/       View a specific listing (dynamic route)
│   │   │       └── edit/           Edit a listing
│   │   │
│   │   ├── admin/                  Admin-only pages
│   │   │   └── notifications/      Push notification admin panel
│   │   │
│   │   ├── auth/                   Auth redirect handlers
│   │   │   ├── callback/           Email confirmation redirect
│   │   │   ├── email-confirmation/ Email confirm route
│   │   │   └── university-email-confirmation/
│   │   │
│   │   ├── api/                    Backend API endpoints
│   │   │   ├── auth/signup/        Create user profile after signup
│   │   │   ├── listings/           CRUD for listings
│   │   │   ├── profile/            Read/update profile
│   │   │   ├── reviews/            Post/delete reviews
│   │   │   ├── notifications/      Get announcements
│   │   │   ├── upload/             Upload images to Supabase
│   │   │   ├── users/search/       Search users by name
│   │   │   ├── transactions/       Confirm/reject sales
│   │   │   ├── pricing-suggestion/ AI price suggestion
│   │   │   ├── push/subscribe/     Subscribe to push notifications
│   │   │   ├── verify-university-email/ University email OTP flow
│   │   │   └── admin/              Admin-only endpoints
│   │   │
│   │   ├── profile/[id]/           Public seller profile page
│   │   ├── buyer/[id]/             Buyer profile page
│   │   ├── contact/                Contact page
│   │   ├── help-center/            Help & FAQ page
│   │   ├── privacy/                Privacy policy
│   │   ├── terms/                  Terms of service
│   │   └── sold-items/             Public sold items showcase
│   │
│   ├── lib/
│   │   └── supabase.js             Supabase browser client (singleton)
│   │
│   ├── services/
│   │   ├── supabase.js             Supabase browser client (duplicate)
│   │   ├── supabaseServer.js       Supabase admin client (server-only)
│   │   ├── brevoEmail.js           Email sending service
│   │   └── utils/
│   │       ├── constants.js        Global app constants (categories, etc.)
│   │       ├── helpers.js          Reusable utility functions
│   │       ├── validation.js       Zod validation schemas
│   │       ├── rateLimit.js        Rate limiters (Upstash Redis)
│   │       ├── sendPush.js         Send push notifications
│   │       ├── getSessionUser.js   Auth session helper
│   │       └── verifyAdmin.js      Admin check helper
│   │
│   ├── shared/
│   │   ├── context/
│   │   │   └── AuthContext.js      Global authentication state
│   │   ├── components/             Reusable UI components
│   │   │   ├── AuthModal.js        Login/signup modal popup
│   │   │   ├── MobileNav.js        Mobile hamburger menu
│   │   │   ├── LayoutWrapper.js    App shell with auto-refresh
│   │   │   ├── BottomNav.js        Mobile bottom navigation bar
│   │   │   ├── Navbar.js           Desktop top navigation bar
│   │   │   ├── NotificationBell.js Bell icon with notification badge
│   │   │   ├── LoadingScreen.js    Full-screen loading spinner
│   │   │   ├── SkeletonLoader.js   Placeholder loading cards
│   │   │   ├── EmptyState.js       "No results" UI
│   │   │   ├── LogoHome.js         Logo + home link component
│   │   │   ├── SchemaScript.js     SEO JSON-LD data injector
│   │   │   ├── ServiceWorkerRegistrar.js  Registers the PWA service worker
│   │   │   ├── PWAInstallButton.js  "Install App" button
│   │   │   ├── FilterDropdown.js   Category/filter selector
│   │   │   └── Stats.js            Homepage statistics display
│   │   └── hooks/
│   │       ├── useListings.js      Custom hook: fetch listings
│   │       ├── useFavorites.js     Custom hook: manage favorites
│   │       ├── useReviews.js       Custom hook: fetch/post reviews
│   │       └── useVisibilityRefetch.js  Custom hook: refresh on tab focus
│   │
│   ├── auth.js                     Server-side auth helpers
│   ├── middleware.js               Route protection (runs before every page)
│   └── schema.js                   SEO structured data generators
│
├── .env.example                    Template for environment variables
├── next.config.mjs                 Next.js configuration
├── jsconfig.json                   Path alias configuration
├── postcss.config.mjs              CSS processing configuration
├── tailwind.config.js              (Tailwind is v4; config is in globals.css)
├── eslint.config.mjs               Code style rules
└── package.json                    Project dependencies and scripts
```

### What is a "Route Group"?
Folders like `(auth)` and `(dashboard)` have parentheses — these are **route groups**. The parentheses tell Next.js to group the pages together without affecting the URL. So `/login` is the URL (not `/auth/login`). Route groups are purely for code organization.

### What is `[id]`?
Square brackets like `[id]` are **dynamic route segments**. The `listing/[id]/page.js` file handles ALL individual listing pages. If you visit `/listing/abc123`, the `id` variable will equal `abc123`. This way you only need one file to handle thousands of different listing URLs.

---

## 5. Configuration Files

### `package.json` — Project Manifest
This file lists all the tools and libraries the project depends on. Running `npm install` reads this file and downloads everything.

```json
{
  "name": "kodaefriendlyshelter",
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev",        // Start development server
    "build": "next build",    // Build for production
    "start": "next start",    // Run the production build
    "lint": "eslint"          // Check for code errors
  }
}
```

**Key dependencies explained:**
- `next` — The core framework
- `react` / `react-dom` — The UI library
- `@supabase/supabase-js` — Database & auth SDK
- `@upstash/ratelimit` + `@upstash/redis` — Rate limiting (prevent abuse)
- `@getbrevo/brevo` — Email sending
- `groq-sdk` — AI price suggestions
- `web-push` — Browser push notifications
- `browser-image-compression` — Shrink images before upload
- `react-hot-toast` — Small notification popups
- `zod` — Form/data validation

---

### `next.config.mjs` — Next.js Settings
```js
const nextConfig = {
  serverExternalPackages: ['web-push'],  // Run web-push on server only (not bundled for browser)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' }  // Only allow images from Supabase
    ],
    formats: ['image/avif', 'image/webp'],  // Modern image formats for better performance
    minimumCacheTTL: 14400,                 // Cache images for 4 hours
  },
}
```

---

### `jsconfig.json` — Path Aliases
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]  // @/components/Foo = src/components/Foo
    }
  }
}
```
Instead of writing `import Foo from '../../../shared/components/Foo'`, you write `import Foo from '@/shared/components/Foo'`. The `@` symbol is a shortcut to the `src/` folder.

---

### `public/manifest.json` — PWA Configuration
```json
{
  "name": "ShelterLab",
  "short_name": "ShelterLab",
  "description": "Your Campus Marketplace",
  "display": "standalone",       // Opens without browser chrome (like a native app)
  "theme_color": "#2563eb",      // Blue title bar color
  "background_color": "#000000", // Black splash screen
  "icons": [{ "src": "/logo.svg", "sizes": "any" }]
}
```
This tells the browser how to behave when someone installs ShelterLab as an app on their phone.

---

## 6. The Entry Points

### `src/app/layout.js` — Root Layout (Applied to EVERY page)

Every page on the website is wrapped inside this file. It sets up the global structure that never changes between pages.

```js
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>        {/* Makes login state available everywhere */}
          <LayoutWrapper>     {/* Adds navigation and auto-refresh logic */}
            {children}        {/* The actual page content goes here */}
          </LayoutWrapper>
        </AuthProvider>
        <Analytics />         {/* Vercel page tracking */}
        <ServiceWorkerRegistrar />  {/* Enables offline support */}
      </body>
    </html>
  )
}
```

**What `{ children }` means:** In React, components can wrap other components. `children` is a special variable that holds whatever content was passed inside a component. Think of it like a picture frame — the frame (layout) is always the same, but the picture (children) changes.

**The `metadata` export** at the top of this file sets the browser tab title, description, and Open Graph tags (the preview card that appears when you share a link on social media).

```js
export const metadata = {
  title: { default: 'ShelterLab - Your Campus Marketplace' },
  description: 'Buy and sell items with your campus community...',
  openGraph: { ... },   // Link preview cards
  twitter: { ... },     // Twitter/X card preview
}
```

---

### `src/middleware.js` — The Route Guard (Runs on EVERY request)

Middleware is code that runs **before** a page loads. It's the security guard at the door — it checks if you're allowed to be here.

```
User visits a URL
       ↓
  middleware.js runs
       ↓
  Is this a public page? (/, /login, /listing/...)
       ↓ YES                ↓ NO
  Allow access         Is user logged in?
                            ↓ YES         ↓ NO
                        Allow access   Redirect to /login
```

**Route Categories:**

| Type | Examples | What happens |
|---|---|---|
| **Auth routes** | `/login`, `/signup`, `/terms` | Always allowed — no check needed |
| **Public routes** | `/`, `/listing/abc`, `/pasarmalam` | Always allowed — anyone can browse |
| **Public APIs** | `/api/listings`, `/api/notifications` | Always allowed |
| **Protected routes** | `/profile`, `/sell`, `/my-listings` | Must be logged in |

**Security Headers** added to every response:
```
X-Frame-Options: SAMEORIGIN         → Prevents clickjacking attacks
X-Content-Type-Options: nosniff     → Prevents MIME type sniffing
Referrer-Policy: strict-origin...   → Controls what's sent in referrer header
X-XSS-Protection: 1; mode=block    → Activates browser XSS filter
```

---

## 7. Global Styles

### `src/app/globals.css` — Global Styles & Tailwind

This file contains global CSS rules and custom utility classes used throughout the app.

#### Tailwind CSS
```css
@import "tailwindcss";
```
This single line imports the entire Tailwind CSS framework. Tailwind lets you style elements by adding class names directly in HTML:
```html
<div class="bg-blue-600 text-white p-4 rounded-lg">
  I'm a blue, white-text, padded, rounded box
</div>
```

#### Glass Morphism (The "frosted glass" look)
The app uses a dark "liquid glass" design. These custom classes create the effect:

```css
.glass {
  background: rgba(255, 255, 255, 0.06);   /* Very slightly white transparent */
  backdrop-filter: blur(24px);             /* Blurs what's behind the element */
  border: 1px solid rgba(255, 255, 255, 0.1); /* Subtle white border */
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); /* Drop shadow */
}
```

Three variants exist:
- `.glass` — Standard frosted glass panel
- `.glass-strong` — More opaque, stronger blur (for important panels)
- `.glass-subtle` — Very subtle, almost invisible (for minor UI elements)

#### Custom Animations
| Class | Animation | Used for |
|---|---|---|
| `.avatar-glow` | Teal pulsing ring | Profile avatar highlight |
| `.animate-fadeIn` | Scale + fade from 95% → 100% | Modals appearing |
| `.btn-shimmer-loading` | Moving shimmer gradient | Submit buttons while loading |
| `.upload-zone-pulse` | Gentle glowing border | Empty upload zones |
| `.upload-zone-drag` | Bright teal border | Drag-over state on upload |
| `.char-counter-enter` | Slide in from left | Character count appearing |

---

## 8. Authentication System

Authentication is how the app knows who you are. Here's how ShelterLab handles it.

### The Full Authentication Flow

```
Sign Up:
User fills form → Supabase creates Auth user → Email sent →
User clicks email link → /auth/callback confirms → Profile created in DB → Done

Log In:
User enters email/password → Supabase checks credentials →
Token issued (stored in cookie) → Profile loaded → Done

Each page load:
Browser sends cookie → middleware.js checks it →
If valid: allow → If not: redirect to /login
```

---

### `src/shared/context/AuthContext.js` — Global Auth State

This is the most important file for authentication. It uses React's **Context API** — a way to share data with any component in the app without manually passing it through every level.

**What is "Context"?** Imagine a company's Wi-Fi password. Instead of emailing it to every employee individually (passing props), you just put it on the wall in the office (Context). Any employee (component) can look at the wall anytime.

```js
// This creates the "Wi-Fi board on the wall"
const AuthContext = createContext({})

// This is the "office" that provides the Wi-Fi board
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)       // Who is logged in (from Supabase Auth)
  const [profile, setProfile] = useState(null) // Their profile data (from database)
  const [loading, setLoading] = useState(true) // Are we still checking?
  const [error, setError] = useState(null)     // Was there an error?

  // ...
}

// This is how any component "reads the Wi-Fi board"
export const useAuth = () => useContext(AuthContext)
```

**What is `useState`?** A way to store a value in a component that, when changed, causes the component to re-render (update). Think of it like a variable that the UI is "watching".

**What `AuthProvider` provides to the entire app:**

| Property/Method | Type | What it is |
|---|---|---|
| `user` | Object or null | The Supabase Auth user (email, id, etc.) |
| `profile` | Object or null | Database profile (full name, university, avatar, etc.) |
| `loading` | Boolean | `true` while auth state is being determined |
| `error` | String or null | Any auth error message |
| `isAuthenticated` | Boolean | `true` if user is logged in |
| `isAdmin` | Boolean | `true` if the user has admin privileges |
| `login(email, pass)` | Function | Log the user in |
| `logout()` | Function | Log the user out |
| `signup(email, pass, name, uni)` | Function | Create a new account |
| `updateProfile(updates)` | Function | Save profile changes |
| `refreshProfile()` | Function | Re-fetch profile from database |

**The `initAuth` function** runs once when the app loads:
1. Gets the current session from Supabase (reads the saved cookie)
2. If a session exists, fetches the user's profile from the `profiles` table
3. Sets up a listener (`onAuthStateChange`) that watches for login/logout events

**Important `TOKEN_REFRESHED` skip:**
```js
if (event === 'TOKEN_REFRESHED') return
```
When the user returns to the tab, Supabase automatically refreshes the session token in the background. If we updated React state here, it would trigger 3+ unnecessary network requests. So we intentionally ignore this event.

---

### `src/app/(auth)/login/page.js` — Login Page

A simple form with email and password fields. Uses the `login()` function from `AuthContext`.

**Key logic:**
```js
// If already logged in, go to the homepage
useEffect(() => {
  if (isAuthenticated && !authLoading) {
    router.push(redirectPath || '/')
  }
}, [isAuthenticated, authLoading])
```

The `redirect` search parameter allows the app to send users back to where they were trying to go. Example: A user tries to access `/sell`, gets redirected to `/login?redirect=/sell`, logs in, then is sent back to `/sell`.

---

### `src/app/(auth)/signup/page.js` — Sign Up Page

More complex than login. Includes:
- Full name, email, university, password, confirm password fields
- **Password strength indicator** — shows Weak/Fair/Good/Strong as you type
- **University lock warning** — a popup warns you that your university cannot be changed after signup
- **Terms & Privacy checkbox** — must be agreed to before submitting
- After successful signup, shows a "Check Your Email" screen

**University Lock Modal:** When the form is submitted, instead of immediately creating the account, it first shows a confirmation dialog:
```
"You selected: Korea University
Your university CANNOT be changed after signup.
[Go Back] [Confirm]"
```
Only when Confirm is clicked does `handleConfirmSignup()` actually run.

---

### `src/app/auth/callback/page.js` — Email Confirmation

When a user clicks the confirmation link in their email, they are directed here. This page:
1. Shows a spinning loader ("Confirming your email...")
2. Reads the URL hash fragment (Supabase puts the token there)
3. Calls `supabase.auth.getSession()` which processes the token
4. Redirects to the homepage if successful

**Status states:**
- `confirming` — Loading spinner shown
- `success` — Green checkmark + redirect
- `error` — Red X + "link may have expired" message

---

## 9. Pages

### `src/app/page.js` — Homepage (Listing Feed)

The main page everyone sees when they visit ShelterLab. It shows all available listings in a grid.

**Features:**
- **Search bar** with debouncing — waits 300ms after you stop typing before searching (saves server requests)
- **Filters** — Category, University, Price range, Condition, Sort order
- **Pagination** — Shows 12 listings per page
- **Active/Sold indicators** — Sold listings show a "SOLD" overlay
- **Login prompt** — Non-logged-in users see a "Sign in to Contact" button instead of contact details

**How listings are loaded:**
```js
// Fetch from the API with all active filters
const response = await fetch(
  `/api/listings?category=${category}&search=${search}&page=${page}...`
)
```

**Stats bar** — Shows total users, listings, and completed transactions at the top.

---

### `src/app/(dashboard)/sell/page.js` — Create Listing

The form where sellers post new items. Protected — you must be logged in.

**Form fields:**
- Title (3-100 characters)
- Description (10-2000 characters)
- Price (Korean Won)
- Category (Electronics, Textbooks, Fashion, etc.)
- Condition (New, Like New, Good, Fair, Poor)
- Images (up to 5 photos)
- Kakao Open Chat link (for buyers to contact you)
- Meetup location preference

**Image upload flow:**
1. User selects or drags images
2. Client-side compression runs (reduces to ~190KB each)
3. POST to `/api/upload` with the compressed files
4. Supabase returns public image URLs
5. URLs are stored with the listing

**AI Price Suggestion:** A "Suggest Price" button calls `/api/pricing-suggestion` which sends the item title and description to Groq AI and gets back a suggested price range.

---

### `src/app/(dashboard)/my-listings/page.js` — Manage My Listings

Shows all listings the current user has posted. Protected.

**Features:**
- List of active listings with thumbnails
- **Mark as Sold** — Opens a modal where seller selects who bought it (buyer search by name), then the listing is marked sold
- **Delete listing** — Confirmation modal before deleting
- **Auto-refresh** — When you come back to this tab after 30+ seconds away, listings automatically reload

**Buyer selection in "Mark as Sold":**
1. Seller types a buyer's name in search box
2. After a 500ms debounce, calls `/api/users/search?q=name`
3. Returns a list of users to select from
4. Seller selects the buyer and confirms

---

### `src/app/(dashboard)/listing/[id]/page.js` — Listing Detail

The full detail page for a single listing. Publicly visible.

**What it shows:**
- Image gallery (swipe/click through multiple photos)
- Title, price, condition badge, category, university
- Days until expiry (listings expire after 90 days)
- Seller's profile card (name, trust score, university logo)
- Contact button (Kakao link)
- Report listing button
- Reviews section with star ratings

**Dynamic route:** The `[id]` in the folder name means this single file handles every listing. When the URL is `/listing/abc-123`, Next.js passes `{ params: { id: 'abc-123' } }` to the page component.

---

### `src/app/(dashboard)/listing/[id]/edit/page.js` — Edit Listing

Only the listing's owner can access this page (checked server-side). Allows changing all listing fields. Has the same form as the Sell page, pre-filled with existing data.

---

### `src/app/(dashboard)/profile/page.js` — My Profile

The logged-in user's own profile page. This is the largest file in the project.

**Sections:**
1. **Profile header** — Avatar, name, university, LabCred score
2. **Edit profile** — Change name, Kakao link, meetup place, avatar
3. **Contact Info** — University email verification badge
4. **My Listings** tab — Shows active listings
5. **Reviews** tab — Shows reviews received
6. **Admin** tab (admin only) — Admin controls
   - Push notification broadcaster
   - Install App button
   - Analytics stats
   - Listing management

**LabCred / Trust Score:** A number shown on every profile.
- 0-9 points: **New User** (gray badge)
- 10-24 points: **Trusted** (blue badge)
- 25-49 points: **Very Trusted** (green badge)
- 50+ points: **Power User** (purple badge)

---

### `src/app/profile/[id]/page.js` — Public Seller Profile

The public profile page for any seller. Visitors see:
- Seller's name, avatar, university, LabCred score
- All their active listings
- All reviews they've received
- "Report user" option

---

### `src/app/admin/notifications/page.js` — Admin Notification Panel

Admin-only page for broadcasting announcements to all users.

**How it works:**
1. Admin writes a notification title and message
2. Clicks "Push Notification to All Users"
3. The notification is saved to the database
4. On the next page load, all users see a bell icon with the notification
5. Only one notification can be active at a time — new ones replace old ones

---

## 10. Shared Components

Components are reusable pieces of UI. Instead of writing the same button or card 10 times, you write it once as a component and use it anywhere.

### `src/shared/components/LayoutWrapper.js` — App Shell

Wraps every page with:
1. **Auto-refresh on tab return** — If you were away for 10+ seconds and come back, it calls `router.refresh()` to show updated data
2. **BottomNav** — The mobile navigation bar at the bottom of the screen

```js
const MIN_AWAY_MS = 10_000 // 10 seconds

// When user hides the tab:
hiddenAt.current = Date.now()  // Record when they left

// When user returns:
if (Date.now() - hiddenAt.current >= MIN_AWAY_MS) {
  router.refresh()  // Reload server data
}
```

---

### `src/shared/components/MobileNav.js` — Mobile Menu

The hamburger menu that appears on small screens. Triggered by tapping the profile picture in the top-right corner.

**What it shows:**
- If logged in: Home, Profile, Sell Item, Logout
- If logged out: Home, Login

Opens as a full-screen overlay with a blurred background.

```js
<div className="md:hidden">  {/* Only visible on mobile (hidden on md+ screens) */}
```

---

### `src/shared/components/AuthModal.js` — Login/Signup Popup

A modal (popup window) that allows users to log in or sign up without navigating away from the current page. Used when a guest user tries to contact a seller.

**How it works:**
- Shows on top of the current page
- Has two tabs: Login and Sign Up
- After successful auth, closes and continues what the user was doing

---

### `src/shared/components/NotificationBell.js` — Notification Icon

A bell icon shown in the header. Has a red pulsing dot when there's an unread announcement. Clicking it opens a panel showing the notification.

---

### `src/shared/components/PWAInstallButton.js` — Install App Button

A button that lets users install ShelterLab as a phone app (PWA).

**How it detects installation support:**
1. **Android Chrome** — Listens for the `beforeinstallprompt` browser event, which provides a native install dialog
2. **iOS Safari** — Shows manual instructions (iOS doesn't support the automatic prompt)
3. **Other browsers** — Shows a generic instruction dialog

---

### `src/shared/components/Stats.js` — Homepage Statistics

Shows three numbers at the top of the homepage:
- Total users registered
- Total listings posted
- Total completed transactions

Fetches these from `/api/admin/stats` when the homepage loads.

---

### `src/shared/components/SkeletonLoader.js` — Loading Placeholders

When listings are being fetched, instead of showing a blank page, skeleton loaders display animated gray placeholder cards in the shape of listing cards. This makes the page feel faster.

---

## 11. API Routes (Backend)

In Next.js, any file inside `src/app/api/` that exports functions named `GET`, `POST`, `PUT`, `DELETE` etc. becomes a backend API endpoint. The browser (and other services) can call these endpoints to read or save data.

**What is an API?** An API (Application Programming Interface) is a way for two systems to talk to each other. When the browser needs listing data, it sends a "request" to the API, and the API sends back a "response" with the data.

### Pattern used across all API routes:
```
Request arrives
      ↓
Check authentication (is the user logged in?)
      ↓
Check rate limit (has this user sent too many requests?)
      ↓
Validate the input data (is it correctly formatted?)
      ↓
Talk to the database (Supabase)
      ↓
Return the result as JSON
```

---

### `src/app/api/listings/route.js` — Listings Endpoint

**GET `/api/listings`** — Fetch listings (public, no login needed)

Query parameters you can pass:
```
/api/listings?category=tech&university=Korea University&search=laptop&page=2&sort=price_asc
```

**POST `/api/listings`** — Create a new listing (requires login)

Rate limited: 10 new listings per hour per user.

What the request body should contain:
```json
{
  "title": "Used MacBook Pro",
  "description": "Good condition, 2021 model...",
  "price": 800000,
  "categories": ["tech"],
  "condition": "good",
  "imageUrls": ["https://...supabase.co/...jpg"],
  "kakaoLink": "abcdef123",
  "meetupPlace": "Library lobby"
}
```

After creating a listing, it fires a push notification to all subscribers (fire-and-forget — doesn't wait for it to complete).

---

### `src/app/api/listings/[id]/route.js` — Single Listing

- **GET** — Get one listing's full details (public)
- **PUT** — Update a listing (must be the owner)
- **DELETE** — Delete a listing (must be the owner)

---

### `src/app/api/listings/[id]/mark-sold/route.js` — Mark as Sold

**POST** — Mark a listing as sold and assign a buyer.

```json
{
  "buyerId": "uuid-of-buyer"
}
```

This:
1. Sets `is_sold = true` on the listing
2. Creates a transaction record
3. Awards LabCred points to both parties
4. Sends push notification to the buyer

---

### `src/app/api/upload/route.js` — Image Upload

**POST** — Upload listing images.

- Rate limited: 30 uploads per hour per user
- Maximum: 5 images per request
- Maximum size: 5MB per image
- Stores images in Supabase Storage at path: `listings/{userId}/{timestamp}-{random}.jpg`
- Returns public URLs for the uploaded images

---

### `src/app/api/reviews/route.js` — Reviews

**GET** — Get reviews for a user (public)
```
/api/reviews?reviewee_id=user-uuid
```

**POST** — Submit a review (requires login)

Rate limited: 10 reviews per hour per user.

```json
{
  "revieweeId": "seller-uuid",
  "listingId": "listing-uuid",
  "rating": 5,
  "comment": "Great seller, fast response!",
  "isSellerReview": true
}
```

**DELETE** — Delete a review (admin only)

---

### `src/app/api/notifications/route.js` — Announcements

**GET** — Returns the current active announcement from the admin.

This is public — even non-logged-in users can see announcements on the homepage.

---

### `src/app/api/profile/[id]/route.js` — Get Profile

**GET** — Returns a user's public profile data (name, university, avatar, trust score, etc.)

---

### `src/app/api/profile/update/route.js` — Update Profile

**PUT** — Update the logged-in user's profile.

Requires Bearer token in the Authorization header.

```json
{
  "full_name": "Kim Soo-min",
  "kakao_link": "open.kakao.com/o/abc",
  "meetup_place": "Main Library"
}
```

---

### `src/app/api/admin/stats/route.js` — Admin Statistics

**GET** — Returns app-wide statistics (total users, listings, transactions). Admin only.

---

### `src/app/api/pricing-suggestion/route.js` — AI Price Suggestion

**POST** — Calls Groq AI to suggest a price for a listing.

```json
{
  "title": "Used textbook - Introduction to Economics",
  "description": "3rd edition, some highlights..."
}
```

Returns: `{ "suggestedPrice": 25000, "reasoning": "..." }`

---

### `src/app/api/push/subscribe/route.js` — Push Subscription

**POST** — Save a browser's push notification subscription.

When a user agrees to receive notifications, the browser generates a unique "subscription" object. This endpoint saves it to the database so the server can send notifications to that user later.

---

### `src/app/api/verify-university-email/` — University Email Verification

A multi-step flow to verify that a user has a real university email:
1. User submits their `.ac.kr` email address
2. Server sends a 6-digit OTP code via Brevo email
3. User enters the code
4. Server verifies it and marks the user as university-verified

This gives users a "Verified Student" badge on their profile.

---

## 12. Services & Utilities

### `src/lib/supabase.js` — Supabase Browser Client

```js
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
```

This creates a single Supabase client instance for use in browser-side code (React components). The `ANON_KEY` is safe to use in the browser — Supabase Row Level Security (RLS) policies restrict what it can access.

---

### `src/services/supabaseServer.js` — Supabase Server Client

Used only in API routes (server-side code). Uses the `SERVICE_ROLE_KEY` which bypasses all RLS policies and has full database access. **Never expose this key to the browser.**

---

### `src/services/brevoEmail.js` — Email Service

Sends transactional emails via the Brevo API. Currently used to send OTP codes for university email verification.

**Function:**
```js
sendOtpEmail(email, otp)
```

Sends an HTML email with:
- A large, easy-to-read OTP code in a styled card
- A 15-minute expiry warning
- A security notice ("if you didn't request this, ignore it")

---

### `src/services/utils/constants.js` — Global Constants

A single place to define all the fixed values used across the application. Changing one value here affects the entire app.

```js
// Item categories
export const CATEGORIES = [
  { id: 'tech', name: 'Electronics' },
  { id: 'books', name: 'Textbooks' },
  { id: 'clothing', name: 'Fashion' },
  { id: 'dorm', name: 'Dorm Essentials' },
  { id: 'other', name: 'Miscellaneous' },
]

// Item condition levels
export const CONDITIONS = [
  { id: 'new', name: 'New', color: 'bg-green-500' },
  { id: 'like-new', name: 'Like New', color: 'bg-blue-500' },
  { id: 'good', name: 'Good', color: 'bg-yellow-500' },
  { id: 'fair', name: 'Fair', color: 'bg-orange-500' },
  { id: 'poor', name: 'Poor', color: 'bg-red-500' },
]

// Listings expire after this many days
export const LISTING_EXPIRY_DAYS = 90

// Maximum image file size: 5MB
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024

// How many listings to show per page
export const PAGINATION_LIMIT = 12

// LabCred trust tiers
export const TRUST_SCORE_THRESHOLDS = {
  NEW_USER: 0,
  TRUSTED: 10,
  VERY_TRUSTED: 25,
  POWER_USER: 50,
}

// Only allow Korean university emails
export const ALLOWED_UNIVERSITY_EMAIL_DOMAINS = ['.ac.kr']
```

---

### `src/services/utils/helpers.js` — Utility Functions

Reusable functions used throughout the codebase.

| Function | What it does | Example |
|---|---|---|
| `formatPrice(price)` | Formats price with Korean Won | `formatPrice(15000)` → `₩15,000` |
| `formatDate(date, 'long')` | Formats dates for display | `"January 15, 2025"` |
| `calculateExpiryDate(createdAt)` | Adds 90 days to find expiry | Returns a Date object |
| `isListingExpired(expiresAt)` | Checks if listing is expired | Returns `true` or `false` |
| `daysUntilExpiry(expiresAt)` | How many days left | Returns a number like `45` |
| `getTrustBadge(score)` | Gets badge label + color | `{ label: 'Trusted', color: 'bg-blue-500' }` |
| `getInitials(fullName)` | Gets initials | `"Kim Soo-min"` → `"KS"` |
| `truncateText(text, 50)` | Cuts text if too long | `"Very long text..."` |
| `compressImage(file)` | Reduces image to ~190KB | Returns compressed File object |
| `buildContactUrl('kakao', id)` | Builds Kakao chat URL | `"https://open.kakao.com/o/..."` |
| `calculateAverageRating(reviews)` | Average of ratings | `4.3` |

**Image compression** uses the `browser-image-compression` library and runs in a Web Worker (a background thread) so it doesn't freeze the page while compressing:
```js
export const compressImage = async (file) => {
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.19,          // Under 200KB
    maxWidthOrHeight: 1920,   // Max dimension
    useWebWorker: true,       // Don't block the UI
    fileType: 'image/jpeg',   // Convert everything to JPEG
  })
  return compressed
}
```

---

### `src/services/utils/validation.js` — Input Validation (Zod)

Zod is a TypeScript-first validation library. It defines **schemas** — descriptions of what valid data looks like — and validates incoming data against them.

**Why validate?** Never trust user input. Before saving anything to the database, always check that the data is what you expect.

```js
// Listing schema — defines what a valid listing must look like
export const listingSchema = z.object({
  title: z.string().min(3).max(100),         // Between 3 and 100 characters
  description: z.string().min(10).max(2000), // Between 10 and 2000 characters
  price: z.number().positive(),              // A positive number
  categories: z.array(z.string()).min(1),    // At least one category
  condition: z.enum(['new', 'like-new', 'good', 'fair', 'poor']),
  imageUrls: z.array(z.string()).min(1).max(5), // 1 to 5 image URLs
})

// If data fails validation, Zod returns an error with details:
// "title: String must contain at least 3 character(s)"
```

---

### `src/services/utils/rateLimit.js` — Rate Limiting

Rate limiting prevents abuse by restricting how many requests a user can make in a given time window. Uses **Upstash Redis** (a fast cloud key-value store) as the tracking backend.

**What is a "sliding window"?** Instead of resetting a counter at a fixed time (like every hour exactly at :00), a sliding window looks at the last N minutes from the current moment. This is fairer and harder to game.

| Limiter | Limit | Window | Identifier |
|---|---|---|---|
| `emailVerificationLimiter` | 3 OTP emails | 10 minutes | User ID |
| `createListingLimiter` | 10 listings | 1 hour | User ID |
| `createReviewLimiter` | 10 reviews | 1 hour | User ID |
| `uploadLimiter` | 30 images | 1 hour | User ID |
| `signupLimiter` | 5 signups | 1 hour | IP address |
| `userSearchLimiter` | 60 searches | 1 minute | IP address |
| `pushSubscribeLimiter` | 10 subscriptions | 1 hour | User ID |
| `profileUpdateLimiter` | 30 updates | 1 hour | User ID |

**Using a rate limiter:**
```js
const rl = await applyRateLimit(createListingLimiter, auth.user.id)
if (rl) return rl  // Returns a "429 Too Many Requests" response
```

**Fail-open behavior:** If Redis is unavailable (network issue, outage), the rate limiter fails open — it lets the request through instead of blocking it. This prevents Redis downtime from taking down the entire app.

---

### `src/auth.js` — Server-Side Auth Helpers

Two functions used in API routes to verify the caller's identity.

```js
// Returns the user object if authenticated, or null if not
export async function verifyAuth(request) { ... }

// Returns the user object if authenticated, or a 401 Response if not
// Use this when auth is required:
// const auth = await requireAuth(request)
// if (auth instanceof Response) return auth  // Sends 401 to client
export async function requireAuth(request) { ... }
```

These check both:
1. **Bearer token** in the `Authorization: Bearer <token>` header (used by the frontend fetch calls)
2. **Cookie** — Supabase session cookie (used by Next.js server components)

---

### `src/schema.js` — SEO Structured Data

Generates **JSON-LD** (JavaScript Object Notation for Linked Data) — a format that tells search engines detailed information about your content. This helps with SEO and rich search results.

| Function | What it generates | Used on |
|---|---|---|
| `generateOrganizationSchema()` | Organization info | layout.js |
| `generateProductSchema(listing)` | Product details + price | Listing pages |
| `generateProfileSchema(profile, rating, count)` | Person + reputation | Profile pages |
| `generateBreadcrumbSchema(items)` | Navigation path | Various pages |
| `generateFAQSchema(faqs)` | FAQ data | Help center |

---

## 13. Database Structure

ShelterLab uses **Supabase** (PostgreSQL under the hood). Here are the main tables inferred from the codebase:

### `profiles` table
Stores user profile information. Created when a user signs up.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key, matches Supabase Auth user ID |
| `full_name` | Text | Display name |
| `email` | Text | User's email address |
| `university` | Text | Which university (e.g., "Korea University") |
| `avatar_url` | Text | URL to profile picture |
| `is_admin` | Boolean | Whether user has admin access |
| `kakao_link` | Text | Kakao Open Chat ID |
| `meetup_place` | Text | Preferred meeting location |
| `trust_score` | Integer | LabCred points (default: 0) |
| `university_email` | Text | Verified university email address |
| `university_email_verified` | Boolean | Whether email was confirmed |
| `created_at` | Timestamp | When the account was created |

### `listings` table
Every item for sale.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `seller_id` | UUID | Foreign key → profiles.id |
| `title` | Text | Item name |
| `description` | Text | Detailed description |
| `price` | Integer | Price in Korean Won |
| `categories` | Text[] | Array of categories |
| `condition` | Text | Item condition |
| `image_urls` | Text[] | Array of image URLs |
| `is_sold` | Boolean | Whether item has been sold |
| `kakao_link` | Text | Seller's Kakao contact |
| `meetup_place` | Text | Where to meet |
| `university` | Text | Seller's university |
| `created_at` | Timestamp | When listed |
| `expires_at` | Timestamp | When it expires (90 days) |

### `reviews` table
Ratings between buyers and sellers.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `reviewer_id` | UUID | Who wrote the review |
| `reviewee_id` | UUID | Who received the review |
| `listing_id` | UUID | Which listing the transaction was for |
| `rating` | Integer | 1-5 stars |
| `comment` | Text | Optional text review |
| `is_seller_review` | Boolean | true if reviewing a seller, false if reviewing a buyer |
| `created_at` | Timestamp | When written |

### `push_subscriptions` table
Browser push notification subscriptions.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `user_id` | UUID | Which user this belongs to |
| `subscription` | JSONB | The browser subscription object |
| `created_at` | Timestamp | When subscribed |

---

## 14. Security Features

Security is taken seriously in ShelterLab. Here's what's in place:

### Authentication
- All session tokens are stored in **HTTP-only cookies** (JavaScript can't read them, preventing XSS theft)
- Middleware checks every protected route before rendering
- Server-side `requireAuth()` on every API route that modifies data

### Input Validation
- **Zod schemas** validate all POST/PUT request bodies
- Field lengths enforced (e.g., title max 100 chars)
- Image type whitelist (only JPEG, PNG, WebP)

### Rate Limiting
- Every API endpoint has rate limits to prevent spam/abuse
- Backed by Upstash Redis (fast, distributed, survives server restarts)
- Returns HTTP `429 Too Many Requests` when limit exceeded
- Fails open (doesn't break the app if Redis is down)

### Database Security
- Supabase **Row Level Security (RLS)** — database-level rules that prevent users from accessing each other's private data
- API routes use the **service role key** (admin access) but validate the user's identity before acting on their behalf
- The anon key (safe for browsers) has limited database access

### HTTP Security Headers (on every response)
```
X-Frame-Options: SAMEORIGIN       → Prevents the site from being embedded in iframes (clickjacking)
X-Content-Type-Options: nosniff   → Browser won't guess file types (MIME sniffing)
Referrer-Policy: strict-origin    → Limits URL info sent to external sites
X-XSS-Protection: 1; mode=block  → Activates browser's built-in XSS filter
```

### Content Security
- Images only loaded from Supabase domains (no arbitrary external URLs)
- SVGs served with a sandboxed content security policy

### Admin Protection
- Admin-only routes check `is_admin` field server-side
- Admin API endpoints verify admin status using `verifyAdmin.js`

---

## 15. PWA (Installable App)

ShelterLab is a **Progressive Web App (PWA)**. This means it can be installed on a phone like a native app, work offline, and receive push notifications.

### How it works:

**1. `public/manifest.json`** — Tells the browser how to present the app when installed (app name, icon, colors, full-screen mode)

**2. `public/sw.js`** — The **Service Worker**, a background script that:
- Intercepts network requests
- Caches pages and assets for offline use
- Handles incoming push notifications

**3. `src/shared/components/ServiceWorkerRegistrar.js`** — A React component that runs once and registers the Service Worker with the browser

**4. `src/shared/components/PWAInstallButton.js`** — An "Install App" button that:
- On Android: triggers the native browser install dialog
- On iOS: shows step-by-step instructions (iOS doesn't allow automatic installs)
- In development: shows as "Demo Mode" since localhost isn't a valid PWA context

### Push Notifications Flow:
```
1. User clicks "Enable Notifications" in their profile
2. Browser asks for permission
3. If granted, browser generates a unique subscription object
4. Subscription saved to database via POST /api/push/subscribe
5. When a new listing is posted:
   Server sends push via web-push library → Browser receives it →
   Service Worker shows the notification
```

---

## 16. Error & Loading States

### Error Pages

Next.js supports special `error.js` files in any route folder. When something crashes on a page, Next.js automatically shows the error page instead of a blank screen.

**Files:**
- `src/app/error.js` — Global fallback for any unhandled error
- `src/app/(dashboard)/listing/[id]/error.js` — Specific to listing pages
- `src/app/(dashboard)/profile/error.js` — Specific to the profile page
- `src/app/(dashboard)/my-listings/error.js` — Specific to my-listings page
- `src/app/profile/[id]/error.js` — Specific to public profile pages

**What they show:**
- A yellow warning triangle SVG
- An error heading
- "Try Again" button (calls `reset()` — re-renders the page)
- "Browse Listings" link back to safety
- In development mode: an expandable "Debug Info" section showing the full error stack trace

### Loading Pages

`loading.js` files show a loading UI while the page's data is being fetched. Next.js automatically shows them during navigation.

### Skeleton Loaders

The `SkeletonLoader` component shows animated gray placeholder cards in the exact shape of listing cards while data loads. This prevents the "flash of empty content" that makes pages feel slow.

---

## 17. Glossary

Terms you'll encounter throughout the codebase, explained simply:

| Term | Plain English Explanation |
|---|---|
| **Component** | A reusable chunk of UI code. Like a LEGO brick — you build the page by combining components |
| **Props** | Data passed into a component from its parent. Like arguments to a function |
| **State** | Data stored inside a component that, when changed, causes it to re-render (update visually) |
| **Hook** | A special React function that "hooks into" React features. Names always start with `use` |
| **Context** | A way to share data across the whole app without passing props through every level |
| **Route** | A URL path. `/profile` is a route. In Next.js, each folder/file = a route |
| **Dynamic Route** | A route with a variable segment. `[id]` matches any value |
| **Middleware** | Code that runs before a request reaches its destination (like a security checkpoint) |
| **API Route** | A backend endpoint that handles HTTP requests. Lives in `src/app/api/` |
| **JSX** | A syntax extension that lets you write HTML-like code inside JavaScript |
| **Async/Await** | A way to handle asynchronous operations (like fetching data) without blocking the UI |
| **Supabase** | A service that provides a database, authentication, and file storage |
| **RLS** | Row Level Security — database rules that control which rows each user can read/write |
| **JWT** | JSON Web Token — an encoded string that proves your identity to the server |
| **Bearer Token** | An auth token sent in the `Authorization: Bearer <token>` HTTP header |
| **Rate Limit** | Capping how many requests a user can make in a time period |
| **Redis** | An in-memory key-value store — extremely fast, used for rate limiting |
| **PWA** | Progressive Web App — a website that can be installed like an app |
| **Service Worker** | A script that runs in the background of the browser, independent of any page |
| **Web Push** | A standard for sending notifications to browsers even when the site isn't open |
| **Zod** | A library for validating data shapes |
| **Tailwind CSS** | A CSS framework where you style elements by adding utility class names |
| **Glass Morphism** | A UI design trend featuring frosted-glass panels with blur and transparency |
| **Debounce** | Waiting until a user stops typing before running a function — prevents firing on every keystroke |
| **Fire-and-forget** | Starting an async operation without waiting for it to complete (used for push notifications) |
| **HOT reloading** | When you save a file during development, the browser immediately shows the change |
| **SSR** | Server-Side Rendering — the server builds the HTML before sending it to the browser |
| **Open Graph** | Meta tags that define what appears when you share a link on social media |
| **JSON-LD** | A format for embedding structured data in web pages for search engines |
| **Singleton** | A pattern ensuring only one instance of something exists (like the Supabase client) |
| **`export default`** | Makes a function/component the main thing exported from a file |
| **`'use client'`** | A Next.js directive that tells React this component runs in the browser (not server) |
| **`useEffect`** | A React hook that runs code when a component mounts or when certain values change |
| **`useState`** | A React hook that creates a stateful variable that re-renders the UI when changed |
| **`useRef`** | A React hook that stores a value without causing re-renders |
| **`async/await`** | Keywords for handling Promises — `async` marks a function, `await` pauses until a Promise resolves |
| **LabCred** | ShelterLab's internal trust scoring system (short for "Lab Credibility") |

---

*Documentation generated for ShelterLab v0.1.x — a campus marketplace for Korean university students.*
*Last updated: February 2026*
