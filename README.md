ShelterLab 

**Your Campus Marketplace** — A verified, safe peer-to-peer marketplace for university students to buy and sell items within their campus community.

![Version](https://img.shields.io/badge/version-0.1.2--beta-yellow)
![License](https://img.shields.io/badge/license-MIT-blue)
![Status](https://img.shields.io/badge/status-In%20Development-orange)

---

## 🎯 What is ShelterLab?

ShelterLab is a **full-stack web application** that enables university students to:
- **Buy & Sell** used items (textbooks, furniture, electronics, clothing) within a trusted community
- **Verify Identity** through university email authentication
- **Build Trust** with LabCred credibility scores and peer reviews
- **Meet Safely** through campus-exclusive, on-campus-only transaction requirements

**Tagline:** "Find what you need, leave what you don't."

---

## ✨ Key Features

### 🔐 University-Exclusive & Verified Community
- University email-only signup (.ac.kr domains)
- Admin-controlled approval workflow
- Verified student badge on all activity
- One account per person policy

### 🛡️ Safety-First Design
- On-campus only transactions (public, high-traffic areas)
- Peer-to-peer cash only (ShelterLab doesn't handle payments)
- 3-business-day fraud investigation & resolution
- Permanent account blacklisting for confirmed scams
- Police cooperation for serious offenses

### ⭐ LabCred Trust System
- **Proprietary credibility scoring** reflecting marketplace activity
- **4-tier progression:** New User → Trusted → Very Trusted → Power User
- **Earn points** by completing sales, confirming purchases, receiving reviews
- **Transparent scoring:** +5 pts (5-star), +3 pts (4-star), +1 pt (3-star), -5 pts (≤2-star)

### 📱 Progressive Web App (PWA)
- Install as native app on iOS/Android home screen
- Offline browsing with Service Worker caching
- Real-time push notifications
- Responsive design (mobile, tablet, desktop)

### 🤖 AI-Powered Pricing Suggestions
- Groq LLM (Mixtral-8x7b-32768) analyzes item details
- Suggests realistic prices for used items in Korean Won
- Context-aware for campus student market

### 🎓 Multi-University Support
- 10+ Korean universities pre-configured
- Campus-specific listing feeds
- University-exclusive marketplace feel
- Top university stats in admin dashboard

### 📊 Real-Time Admin Dashboard
- Platform statistics (listings, users, sold items)
- User approval workflow
- Verified badge management
- Admin notification broadcasting
- Fraud investigation tools

### 🔍 Advanced Search & Filtering
- Full-text search (item name, description, seller)
- Multi-category filtering
- Price range filtering (min/max)
- Condition-based filtering (new, like-new, good, fair, poor)
- Sort options (newest, price low→high, price high→low)

---

## 🏗️ Tech Stack

### Frontend
- **Next.js 16** — React framework with App Router & SSR
- **React 19** — UI library
- **Tailwind CSS 4** — Utility-first CSS
- **React Context API** — State management
- **Service Worker** — PWA & offline support

### Backend & Database
- **Supabase** — PostgreSQL database + Auth
- **JWT Authentication** — Bearer token security
- **Row-Level Security (RLS)** — Database-level access control

### External APIs & Services
- **Brevo SMTP** — Email OTP verification & transactional emails
- **Groq API** — AI pricing suggestions (Mixtral-8x7b-32768)
- **Upstash Redis** — Rate limiting (sliding window algorithm)
- **Web Push API** — Real-time notifications
- **Vercel Analytics** — Usage tracking & performance insights

### Security & Infrastructure
- **Upstash Redis** — Serverless rate limiting
- **HTTPS** — Encrypted in transit
- **Rate Limiting** — 120 searches/min, 10 listings/hour per user
- **Server-side Auth** — Prevent client-side bypasses
- **Environment Variables** — Secrets management

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (free tier works)
- Brevo account (for email)
- Groq API key (for pricing)
- Upstash Redis (for rate limiting)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/keirara04/ShelterLab.git
   cd shelterlab
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your credentials:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Email (Brevo)
   BREVO_API_KEY=your_brevo_api_key
   BREVO_SENDER_EMAIL=your_sender_email

   # AI Pricing (Groq)
   GROQ_API_KEY=your_groq_api_key

   # Rate Limiting (Upstash Redis)
   UPSTASH_REDIS_REST_URL=your_redis_url
   UPSTASH_REDIS_REST_TOKEN=your_redis_token

   # Admin Email
   ADMIN_EMAIL=admin@example.com

   # Push Notifications (Web Push)
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
   VAPID_PRIVATE_KEY=your_vapid_private_key
   VAPID_SUBJECT=your_email@example.com
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000) in your browser**

### Build for Production
```bash
npm run build
npm start
```

---

## 📋 Project Structure

```
kodaefriendlyshelter/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── (auth)/          # Auth pages (login, signup)
│   │   ├── (dashboard)/     # Protected user pages (sell, profile, listings)
│   │   ├── admin/           # Admin dashboard
│   │   ├── api/             # API routes
│   │   │   ├── listings/    # Marketplace listing APIs
│   │   │   ├── reviews/     # Review submission APIs
│   │   │   ├── auth/        # Authentication APIs
│   │   │   ├── admin/       # Admin-only APIs
│   │   │   └── ...
│   │   └── page.js          # Homepage
│   ├── shared/
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React Context (Auth)
│   │   └── hooks/           # Custom React hooks
│   ├── services/            # API clients & utilities
│   │   ├── supabase.js      # Supabase client
│   │   ├── brevoEmail.js    # Email service
│   │   └── utils/           # Helper functions
│   └── middleware.js        # Next.js middleware (auth, security)
├── public/
│   ├── manifest.json        # PWA manifest
│   ├── sw.js                # Service Worker
│   └── offline.html         # Offline fallback page
├── package.json
├── tailwind.config.js
└── README.md

```

---

## 🔐 Security Features

✅ **Authentication**
- Supabase Auth with JWT tokens
- University email-only verification (OTP via email)
- Server-side auth verification (prevent client bypasses)
- 15-minute OTP expiration

✅ **Rate Limiting**
- 120 searches/minute per IP
- 10 listings/hour per user
- 10 reviews/hour per user
- 30 uploads/hour per user
- 5 signups/hour per IP
- Upstash Redis sliding window algorithm

✅ **Database Security**
- Supabase Row-Level Security (RLS) policies
- Password hashing via Supabase Auth
- Encrypted at rest & in transit (HTTPS)

✅ **Compliance**
- PIPA (Personal Information Protection Act) compliant
- Chief Privacy Officer role for inquiries
- 24-hour account deletion on request
- 5-year transaction retention (legal requirement)
- Zero third-party data selling

---

## 📊 Key Metrics

| Metric | Value |
|--------|-------|
| **Universities Supported** | 10+ Korean campuses |
| **Prohibited Items** | 40+ categories enforced |
| **Trust Tiers** | 5 levels (0–9, 10–24, 25–49, 50+) |
| **Listing Expiration** | 90 days (auto-renew on login) |
| **Dispute SLA** | 3 business days |
| **Account Deletion** | 24 hours |
| **OTP Expiration** | 15 minutes |
| **Max Images/Listing** | 5 high-quality images |

---

## 🎯 Core Principles

1. **Trust First** — LabCred system rewards active, honest users
2. **Safety Always** — On-campus only, peer reviews, fraud blacklisting
3. **Community Driven** — University-exclusive, students helping students
4. **Privacy Focused** — Minimal data collection, PIPA compliant
5. **Mobile Accessible** — PWA install, offline support, responsive design

---

## 🚦 Current Status

- **Version:** 0.1.2-beta
- **Status:** In Development
- **Deployment:** Vercel (ready for production)

### Known Limitations
- Pasar Malam feature (flash markets) coming soon
- In-app messaging coming in v0.2
- Optional payment integration planned for v1.0

---

## 📞 Support & Contact

- **Bug Reports:** [admin@shelterlab.shop](mailto:admin@shelterlab.shop?subject=ShelterLab%20Bug%20Report)
- **Feature Requests:** [admin@shelterlab.shop](mailto:admin@shelterlab.shop?subject=Feature%20Request)
- **Privacy Inquiries:** [admin@shelterlab.shop](mailto:admin@shelterlab.shop?subject=Privacy%20Inquiry)
- **Help Center:** [/help-center](/help-center)

---

## 📜 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) file for details.

You are free to use, modify, and distribute this project for personal and commercial purposes, with attribution.

---

## 👤 Author

**[Hakeemi Ridza]**
- GitHub: [@keirara04](https://github.com/keirara04)
- LinkedIn: [hakeemiridza](https://linkedin.com/in/hakeemiridza)
- Email: hakeemiridza@gmail.com

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/), [React](https://react.dev/), and [Tailwind CSS](https://tailwindcss.com/)
- Powered by [Supabase](https://supabase.com/), [Groq](https://groq.com/), and [Upstash](https://upstash.com/)
- Inspired by campus community needs and trust-first marketplace design

---

## 📋 Legal & Compliance

- [Terms of Use](/terms)
- [Privacy Policy](/privacy)
- [Help Center](/help-center)

**ShelterLab** is committed to user safety, data privacy, and regulatory compliance in all markets we operate.

---

*Last Updated: February 20, 2026*

**Ready to contribute or have questions?** Open an issue or reach out at [admin@shelterlab.shop](mailto:admin@shelterlab.shop)"
