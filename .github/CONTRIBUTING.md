# Contributing to ShelterLab

Thank you for your interest in contributing to ShelterLab! This document provides guidelines and instructions for contributing.

## 🎯 Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Respect user privacy and data protection
- Follow security best practices

## 🐛 Reporting Bugs

### Before Submitting a Bug Report
- Check if the bug has already been reported
- Verify you're using the latest code from `main` branch
- Test in development environment with `npm run dev`

### How to Submit a Bug Report
Create a GitHub issue with:
- **Title:** Clear, concise description of the bug
- **Version:** 0.1.2-beta or specific commit hash
- **Environment:** OS, Node.js version, browser (if frontend)
- **Steps to reproduce:** Detailed reproducible steps
- **Expected behavior:** What should happen
- **Actual behavior:** What actually happens
- **Screenshots:** If applicable (no sensitive data!)
- **Logs:** Console errors, stack traces (mask credentials)

**Example:**
```
**Title:** Profile avatar upload fails for images >2MB

**Environment:** macOS 14, Node 18, Chrome 122

**Steps to Reproduce:**
1. Go to /profile
2. Click "Change Avatar"
3. Upload a 3MB PNG file
4. Observe error

**Expected:** Image compresses automatically
**Actual:** "File exceeds 5MB limit" error (even though file is 3MB)
```

## 💡 Suggesting Enhancements

Create a GitHub issue with:
- **Title:** Short description of enhancement
- **Motivation:** Why this feature would be useful
- **Use Case:** Real-world scenario where this helps
- **Possible Implementation:** (optional) Your ideas on how to implement

**Example:**
```
**Title:** In-app messaging between buyer and seller

**Motivation:** Currently requires external KakaoTalk; built-in chat would be seamless

**Use Case:** Buyer has quick questions about item condition; direct chat speeds up response

**Possible Implementation:** 
- Add `messages` table (sender_id, receiver_id, listing_id, content, created_at)
- Real-time updates via Supabase subscriptions
- Notification when new message arrives
```

## 🚀 Submitting Pull Requests

### Before You Start
1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/yourusername/shelterlab.git`
3. **Create a branch:** `git checkout -b feature/your-feature-name`
4. **Read** the code style and architecture sections below

### Making Changes

#### Code Style
- Use **2 spaces** for indentation (already configured in `.editorconfig`)
- Use **camelCase** for variables and functions
- Use **PascalCase** for React components
- Add **JSDoc comments** for complex functions
- Keep **lines under 100 characters** where reasonable

**Example:**
```javascript
/**
 * Calculate LabCred bonus based on review rating
 * @param {number} rating - Star rating (1-5)
 * @returns {number} Points to add/subtract
 */
function getRatingBonus(rating) {
  if (rating === 5) return 5
  if (rating === 4) return 3
  if (rating === 3) return 1
  if (rating <= 2) return -5
  return 0
}
```

#### Architecture Guidelines
- **API Routes:** Use server-side auth verification, rate limiting
- **Database:** Always use RLS policies; never bypass with admin client in user-facing code
- **Components:** Keep functional, use React hooks, avoid prop drilling (use Context for auth)
- **Utilities:** Extract reusable logic into `/services/utils/`
- **Error Handling:** Return meaningful HTTP status codes (401, 403, 429, 500)

#### Security Considerations
- ✅ Verify auth on **server-side** (not client-side)
- ✅ Apply **rate limiting** to sensitive endpoints
- ✅ Use **parameterized queries** (Supabase handles this)
- ✅ Never log or expose **sensitive data** (credentials, emails in production)
- ✅ Validate **input** on both client and server
- ❌ Don't bypass **RLS policies** with service role key for user operations
- ❌ Don't expose **API keys** or secrets in code

### Testing Your Changes

1. **Build locally:**
   ```bash
   npm run build
   ```

2. **Run linter:**
   ```bash
   npm run lint
   ```

3. **Manual testing:**
   - Test in development: `npm run dev`
   - Test on multiple browsers (Chrome, Safari, Firefox)
   - Test on mobile (use Chrome DevTools mobile view)
   - Test PWA install and offline mode

4. **Verify security:**
   - Check `.env.local` is NOT committed (verify `.gitignore`)
   - Ensure no API keys are hardcoded
   - Run through OWASP Top 10 checklist

### Committing Changes

Use **clear, descriptive commit messages:**

```bash
# Good
git commit -m "feat: add AI pricing suggestions using Groq API"
git commit -m "fix: resolve LabCred score calculation for 5-star reviews"
git commit -m "docs: update README with installation steps"
git commit -m "refactor: extract rate limiting logic into utils"

# Avoid
git commit -m "fixes"
git commit -m "stuff"
git commit -m "update"
```

**Commit Message Format:**
```
<type>: <subject>

<optional body explaining why/what>

<optional footer with issue reference>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Pushing to Your Fork

```bash
git push origin feature/your-feature-name
```

### Creating a Pull Request

1. Go to [ShelterLab repository](https://github.com/yourusername/shelterlab)
2. Click **"New Pull Request"**
3. Compare your branch against `main`
4. Fill in the PR template:

```markdown
## Description
What does this PR do?

## Related Issues
Closes #123

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How have you tested this? Screenshots?

## Checklist
- [ ] My code follows the code style
- [ ] I have tested locally
- [ ] No new warnings or errors
- [ ] .env files are NOT committed
- [ ] Security best practices applied
- [ ] Documentation updated (if needed)
```

### PR Review Process

- **Wait for review:** Maintainers will review within 3-5 days
- **Address feedback:** Push additional commits to the same branch
- **Don't squash:** Maintainers will squash on merge
- **Be patient:** We're reviewing for quality, security, and fit

## 📚 Development Setup

### Prerequisites
```bash
Node.js 18+
npm 8+
```

### First Time Setup
```bash
# Clone
git clone https://github.com/yourusername/shelterlab.git
cd shelterlab

# Install
npm install

# Setup env
cp .env.example .env.local
# Fill in your API keys

# Run
npm run dev
```

### Useful Commands
```bash
npm run dev         # Start development server
npm run build       # Build for production
npm start          # Start production server
npm run lint       # Run ESLint
```

## 📖 Project Structure for Contributors

```
src/
├── app/                    # Next.js routes
│   ├── api/               # Backend API routes
│   │   └── [feature]/     # Group by feature
│   └── (groups)/          # Route groups for organization
├── services/              # Reusable business logic
│   ├── utils/            # Helper functions
│   ├── supabase.js       # DB client
│   └── brevoEmail.js     # Email service
├── shared/
│   ├── components/       # Reusable UI components
│   ├── hooks/           # Custom React hooks
│   └── context/         # Context API providers
└── middleware.js        # Next.js middleware (auth, security)
```

## 🔒 Security Checklist

Before submitting, verify:

- [ ] No `.env.local` or secrets committed
- [ ] No hardcoded API keys or credentials
- [ ] Server-side auth verification implemented
- [ ] Rate limiting applied where needed
- [ ] Input validation on both client and server
- [ ] Error messages don't leak sensitive info
- [ ] RLS policies respected (no service role in user code)
- [ ] HTTPS-only links used

## 📝 Documentation

### When to Update Docs
- New feature added
- API endpoint changed
- Database schema modified
- Security behavior changed
- User-facing workflows updated

### How to Update Docs
- Update README.md with feature description
- Add API documentation in route comments
- Update .env.example with new variables
- Add CONTRIBUTING.md notes if process changed

## 🆘 Getting Help

- **Questions?** Open a GitHub Discussion
- **Stuck?** Comment on the issue you're working on
- **Need guidance?** Tag `@maintainers` in your PR
- **Security issue?** Email admin@shelterlab.shop (don't create public issue)

---

## 📋 Contribution Types We Welcome

✅ **High Priority**
- Bug fixes with test coverage
- Security improvements
- Performance optimizations
- Documentation improvements

✅ **Medium Priority**
- UI/UX enhancements
- New features (discuss first via issue)
- Code refactoring
- Better error messages

⚠️ **Low Priority (Discuss First)**
- Large architectural changes
- New dependencies
- Breaking API changes
- Major refactors

❌ **Won't Accept**
- Cryptocurrency/blockchain features
- Changes violating user privacy
- Features conflicting with Terms of Service
- Hardcoded configuration values

---

## 🎉 Thank You!

We appreciate your contributions to making ShelterLab safer and better for university students everywhere. Every issue report, feature idea, and code contribution matters!

**Questions?** Reach out at admin@shelterlab.shop

---

*Last Updated: February 20, 2026*
