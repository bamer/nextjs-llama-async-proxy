# Documentation Index

Complete guide to all documentation files in this project.

## 📚 Main Documentation (Start Here)

### [README.md](README.md)
**Status**: ✅ Updated Dec 26, 2025
- Project overview and features
- Quick start guide
- Technology stack
- Installation instructions
- API routes reference
- Deployment options
- Resources and links

**When to read**: First time setup, understanding the project

---

### [AGENTS.md](AGENTS.md)
**Status**: ✅ Updated Dec 26, 2025
- **Coding standards and conventions**
- Build/test/lint commands with pnpm
- Architecture overview
- TypeScript requirements
- Import ordering rules
- Naming conventions
- React best practices
- Error handling patterns
- Testing standards
- File templates

**When to read**: Before writing code, during code review

---

### [DEVELOPMENT.md](DEVELOPMENT.md)
**Status**: ✅ Created Dec 26, 2025
- **Comprehensive development guide**
- Getting started instructions
- Development workflow
- Project structure deep dive
- Code style guidelines with examples
- React patterns and best practices
- Server-side code structure
- State management patterns (Zustand, React Query)
- Forms and validation (React Hook Form + Zod)
- Styling approaches (Tailwind, Emotion, MUI)
- Testing guide
- API integration patterns
- Error handling examples
- Performance optimization
- Debugging techniques
- Common development tasks

**When to read**: Daily development work, learning patterns

---

### [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
**Status**: ✅ Created Dec 26, 2025
- **One-page quick lookup guide**
- Essential commands
- Pre-commit checklist
- Code pattern snippets
- Naming conventions
- Common troubleshooting
- Environment variables
- Required versions

**When to read**: Quick lookup, reminders, debugging

---

## 🚀 Production & Deployment

### [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md)
**Status**: ✅ Updated Dec 26, 2025
- **Complete deployment guide**
- Package manager requirements (pnpm)
- Dev vs production modes
- Environment configuration
- Next.js configuration details
- Deployment options:
  - Docker
  - Vercel
  - Self-hosted (VPS)
  - PM2 configuration
  - Nginx reverse proxy
- Performance optimization
- Security best practices
- Monitoring and logging
- Scaling strategies
- Troubleshooting deployment issues
- Maintenance procedures

**When to read**: Before deploying to production

---

## 🔧 Troubleshooting & Help

### [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
**Status**: ✅ Updated Dec 26, 2025
- **12 comprehensive troubleshooting sections:**
  1. Port 3000 already in use
  2. WebSocket connection failed
  3. TypeScript compilation errors
  4. pnpm dependency issues
  5. Production build failures
  6. Development server issues
  7. Socket.IO connection issues
  8. Memory leaks/high usage
  9. ESLint errors
  10. React component errors
  11. Deployment issues
  12. Git/commit issues
- Getting help information
- Resource links

**When to read**: When something breaks or doesn't work

---

## 📋 Reference & Configuration

### [CONFIGURATION.md](CONFIGURATION.md)
**Status**: ✅ Reviewed (still accurate)
- Llama-Server proxy configuration
- Configuration via API
- Complete configuration options reference
- Server options
- Model options
- GPU options
- CPU options
- Sampling options
- Memory options
- RoPE/YaRN options

**When to read**: Setting up Llama server configuration

---

### [SECURITY_NOTICE.md](SECURITY_NOTICE.md)
**Status**: ✅ Reviewed (still accurate)
- Security considerations
- Authentication design (intentionally none)
- WebSocket security
- API access control
- Deployment security

**When to read**: Before deploying to production, security review

---

## 📊 Project Information

### [DOCUMENTATION_UPDATE_SUMMARY.md](DOCUMENTATION_UPDATE_SUMMARY.md)
**Status**: ✅ Created Dec 26, 2025
- Summary of all documentation updates
- Changes made to each file
- Standards applied
- File status table
- Key takeaways
- Recommendations for future updates

**When to read**: Understanding what changed in docs

---

### [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)
**Status**: ✅ This file
- Complete navigation guide
- Summary of all docs
- When to read each doc
- Quick links to resources

**When to read**: Finding what documentation you need

---

## 📚 Legacy/Implementation-Specific Documentation

### [TESTING_SUMMARY.md](TESTING_SUMMARY.md)
**Status**: ⚠️ Legacy content (may be outdated)
- Test implementation details
- Coverage information

**Note**: Refer to [DEVELOPMENT.md](DEVELOPMENT.md) Testing section for current practices

---

### [GPU_METRICS_IMPLEMENTATION.md](GPU_METRICS_IMPLEMENTATION.md)
**Status**: ⚠️ Legacy content (implementation-specific)
- GPU metrics feature implementation details

**Note**: Use for reference if working on GPU features

---

### [SIDEBAR_IMPLEMENTATION_SUMMARY.md](SIDEBAR_IMPLEMENTATION_SUMMARY.md)
**Status**: ⚠️ Legacy content (feature-specific)
- Sidebar component implementation details

**Note**: Use for reference if modifying sidebar

---

### [CLEANUP_REPORT.md](CLEANUP_REPORT.md) & [TEST_CLEANUP_REPORT.md](TEST_CLEANUP_REPORT.md)
**Status**: ⚠️ Historical (cleanup records)
- Record of past cleanup operations

**Note**: For historical reference only

---

## 🎯 Documentation by Use Case

### I want to...

#### Get started
1. Read [README.md](README.md)
2. Follow quick start
3. Run `pnpm dev`

#### Understand the codebase
1. Read [README.md](README.md) - Architecture section
2. Read [DEVELOPMENT.md](DEVELOPMENT.md) - Project Structure section
3. Review [AGENTS.md](AGENTS.md) - Architecture & Structure section

#### Write code following standards
1. Read [AGENTS.md](AGENTS.md) - Code Style & Conventions
2. Read [DEVELOPMENT.md](DEVELOPMENT.md) - Relevant sections
3. Use [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for patterns

#### Set up a development environment
1. Read [README.md](README.md) - Installation & Development
2. Run commands from [DEVELOPMENT.md](DEVELOPMENT.md) - Getting Started
3. Reference [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Essential Commands

#### Deploy to production
1. Read [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md) - complete
2. Review [README.md](README.md) - Deployment section
3. Check [SECURITY_NOTICE.md](SECURITY_NOTICE.md)

#### Fix a problem
1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Search by symptom (port, WebSocket, build, etc.)
3. Follow the solution steps
4. Check [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Troubleshooting table

#### Understand development patterns
1. Read [DEVELOPMENT.md](DEVELOPMENT.md) - relevant section
2. Look at code examples
3. Reference [AGENTS.md](AGENTS.md) - File Structure Template

#### Set up testing
1. Read [DEVELOPMENT.md](DEVELOPMENT.md) - Testing section
2. Check [AGENTS.md](AGENTS.md) - Testing subsection
3. Use [TESTING_SUMMARY.md](TESTING_SUMMARY.md) for specifics (legacy)

#### Configure the server
1. Read [CONFIGURATION.md](CONFIGURATION.md)
2. Review [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md) - Configuration
3. Check [README.md](README.md) - Environment Variables

#### Integrate with existing systems
1. Read [README.md](README.md) - API Routes
2. Read [DEVELOPMENT.md](DEVELOPMENT.md) - API Integration section
3. Review [CONFIGURATION.md](CONFIGURATION.md)

---

## 📄 File Statistics

| Document | Size | Focus | Priority |
|----------|------|-------|----------|
| README.md | 8.8K | Overview & setup | ⭐⭐⭐ HIGH |
| AGENTS.md | 7.4K | Code standards | ⭐⭐⭐ HIGH |
| DEVELOPMENT.md | 16K | Dev patterns | ⭐⭐⭐ HIGH |
| QUICK_REFERENCE.md | 6.6K | Quick lookup | ⭐⭐ MEDIUM |
| PRODUCTION_SETUP.md | 7.8K | Deployment | ⭐⭐⭐ HIGH |
| TROUBLESHOOTING.md | 8.1K | Problem solving | ⭐⭐⭐ HIGH |
| CONFIGURATION.md | 6.3K | Config details | ⭐⭐ MEDIUM |
| SECURITY_NOTICE.md | 2.9K | Security | ⭐⭐⭐ HIGH |
| DOCUMENTATION_* | 14.6K | Meta info | ⭐ LOW |
| Legacy docs | 32.9K | Historical | ⭐ LOW |

---

## 🔄 Documentation Maintenance

### Last Updated: December 26, 2025

### Version: 2.0 (Complete Overhaul)
- ✅ All files reviewed and updated
- ✅ pnpm as primary package manager throughout
- ✅ Project structure verified
- ✅ Code examples validated
- ✅ Commands tested
- ✅ Consistent terminology
- ✅ Removed outdated information

### Next Review: June 2026 (or when major changes occur)

---

## 🚀 Quick Links

### Setup & Installation
- [README.md - Installation](README.md#-installation--development)
- [DEVELOPMENT.md - Getting Started](DEVELOPMENT.md#getting-started)

### Code Standards
- [AGENTS.md - Code Style](AGENTS.md#code-style--conventions)
- [DEVELOPMENT.md - Code Style](DEVELOPMENT.md#code-style)

### Common Tasks
- [DEVELOPMENT.md - Common Tasks](DEVELOPMENT.md#common-tasks)
- [QUICK_REFERENCE.md - Common Code Patterns](QUICK_REFERENCE.md#common-code-patterns)

### Deployment
- [PRODUCTION_SETUP.md - Deployment](PRODUCTION_SETUP.md#deployment)
- [README.md - Deployment](README.md#-deployment)

### Troubleshooting
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- [QUICK_REFERENCE.md - Troubleshooting](QUICK_REFERENCE.md#troubleshooting)

### API Reference
- [README.md - API Routes](README.md#-api-routes)
- [DEVELOPMENT.md - API Integration](DEVELOPMENT.md#api-integration)

### Configuration
- [CONFIGURATION.md](CONFIGURATION.md)
- [PRODUCTION_SETUP.md - Configuration](PRODUCTION_SETUP.md#configuration)

---

## 💡 Tips

1. **Use Ctrl+F / Cmd+F** to search within documents
2. **Start with README.md** if you're new
3. **Check QUICK_REFERENCE.md** for fast lookups
4. **Read TROUBLESHOOTING.md** when stuck
5. **Use DEVELOPMENT.md** as your main reference while coding
6. **Follow AGENTS.md** during code review

---

## 📞 Getting Help

1. **Check relevant documentation** (use this index to find it)
2. **Search TROUBLESHOOTING.md** for your issue
3. **Review DEVELOPMENT.md** for patterns
4. **Check QUICK_REFERENCE.md** for commands
5. **Ask team with context** (error message, versions, steps to reproduce)

---

## ✅ Verification Checklist

Before any work:
- [ ] Read relevant documentation section
- [ ] Verify Node.js version: `node --version` (18+)
- [ ] Verify pnpm version: `pnpm --version` (9+)
- [ ] Check environment setup matches documentation
- [ ] Have necessary resources bookmarked

Before committing:
- [ ] Code follows AGENTS.md standards
- [ ] No linting errors: `pnpm lint:fix`
- [ ] TypeScript passes: `pnpm type:check`
- [ ] Tests pass: `pnpm test`
- [ ] Build succeeds: `pnpm build`

---

**Navigation**: Use this document to find what you need. Every other document has specific guidance for its topic.
