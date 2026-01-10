# Contributing to Llama Async Proxy Dashboard

Thank you for your interest in contributing to the Llama Async Proxy Dashboard! This document provides comprehensive guidelines for contributing to this open-source project. Whether you're fixing a bug, adding a feature, improving documentation, or refactoring code, your contributions are welcomed and appreciated.

## Introduction

The Llama Async Proxy Dashboard is an open-source project built with Node.js, Express, Socket.IO, Vanilla JavaScript, and SQLite. We believe that great software is built through collaboration, and we invite developers of all skill levels to participate in this project. Contributing to open-source is an excellent way to learn new technologies, improve your coding skills, and give back to the community.

### Why Contribute?

There are many reasons to contribute to this project. First, you'll have the opportunity to work with a modern tech stack that includes real-time communication via Socket.IO, a lightweight database with SQLite, and an event-driven architecture using Vanilla JavaScript. Second, your contributions will directly impact users who rely on this dashboard for managing llama.cpp models in router mode. Third, you'll join a community of developers who are passionate about building tools for AI model management. Finally, contributing to open-source projects is an excellent addition to your portfolio and demonstrates your ability to work collaboratively on software development.

### Types of Contributions Welcomed

We welcome contributions in several categories, each equally important to the project's success. **Bug fixes** are always appreciated—when you find a bug and fix it, you improve the experience for all users. **Feature additions** help the project grow and meet new user needs; whether it's a small enhancement or a major new capability, all feature contributions are considered. **Documentation improvements** make the project more accessible to new contributors and users; clear documentation reduces confusion and lowers the barrier to entry.

**Test improvements** strengthen the project's reliability; adding tests for new features and maintaining coverage ensures that the codebase remains stable as it evolves. **Code refactoring** keeps the codebase maintainable; if you see opportunities to improve structure, reduce duplication, or enhance readability, those contributions are valuable. **Performance improvements** make the dashboard faster and more efficient, which is especially important for users working with large language models.

## Getting Started

### Prerequisites

Before you can contribute to this project, you'll need to have several tools installed on your development machine. The project requires **Node.js version 18.0.0 or higher** because we use modern JavaScript features and APIs. You can check your Node.js version by running `node --version` in your terminal. If you need to install or update Node.js, visit the official Node.js website for download instructions.

The project uses **pnpm** as its package manager instead of npm or yarn. Pnpm offers faster installation, disk space savings, and a more consistent dependency resolution. Install pnpm globally by running `npm install -g pnpm` or using your preferred package manager. Verify the installation with `pnpm --version`.

**Git** is essential for version control and collaborating on the project. Ensure you have Git installed by running `git --version`. If you need to install Git, visit the official Git website or use your system's package manager.

For code editing, we recommend **Visual Studio Code** (VS Code) because it has excellent support for JavaScript development, Prettier integration, and ESLint. However, you can use any code editor you prefer. If you do use VS Code, consider installing the Prettier and ESLint extensions for automatic formatting and linting as you code.

### Setting Up Development Environment

Once you have all prerequisites installed, you're ready to set up your development environment. The setup process involves forking the repository, cloning your fork, installing dependencies, and preparing your workspace for development.

Forking the repository creates your own copy of the project on GitHub where you can make changes without affecting the original project. Go to the GitHub repository page and click the "Fork" button in the top-right corner. Select your GitHub account as the destination if prompted.

After forking, clone your fork to your local machine. Replace `YOUR-USERNAME` with your actual GitHub username in the following command:

```bash
git clone https://github.com/YOUR-USERNAME/nextjs-llama-async-proxy.git
cd nextjs-llama-async-proxy
```

This creates a new directory containing the project files. Next, add the upstream remote so you can easily sync your fork with the original repository:

```bash
git remote add upstream https://github.com/ORIGINAL-OWNER/nextjs-llama-async-proxy.git
```

Replace `ORIGINAL-OWNER` with the actual owner username of the original repository. Now you're ready to install dependencies and start developing.

## Development Setup

### First-Time Setup Steps

After cloning the repository, follow these steps to prepare your development environment:

```bash
# Install all project dependencies using pnpm
pnpm install

# Create a new feature branch for your changes
git checkout -b feature/amazing-new-feature

# Start the development server with file watching
pnpm dev
```

The `pnpm dev` command starts the development server with file watching enabled, automatically restarting the server when changes are detected. This provides a fast feedback loop during development. The server runs on port 3000 by default—access it at `http://localhost:3000` in your browser.

Before making any changes, it's a good practice to verify that the project builds and tests pass:

```bash
# Run the test suite to ensure everything works
pnpm test

# Check for linting errors
pnpm lint

# Verify code formatting
pnpm format --check
```

If all these commands complete without errors, your development environment is properly set up and you're ready to start contributing.

## Development Workflow

### Standard Workflow

Following a consistent workflow ensures smooth collaboration and makes it easier for maintainers to review your contributions. The standard workflow involves syncing with upstream, creating feature branches, making changes, committing properly, and submitting pull requests.

First, sync your fork with the upstream repository to ensure you have the latest changes:

```bash
git fetch upstream
git merge upstream/main
```

Resolve any merge conflicts if they exist, then create a new feature branch for your changes:

```bash
git checkout -b feature/your-feature-name
```

Choose a descriptive name for your branch that indicates what you're working on. For bug fixes, use `fix/issue-description`. For documentation improvements, use `docs/description`. For new features, use `feature/feature-name`.

Make your changes to the codebase, following the code style guidelines outlined in this document. As you work, commit your changes with meaningful commit messages:

```bash
# Stage your changes
git add .

# Commit with a descriptive message
git commit -m "feat: add model auto-discovery functionality"
```

Keep commits atomic—each commit should represent a single logical change. This makes it easier to understand the history and to revert specific changes if needed.

When you're ready to share your work, push your branch to your fork:

```bash
git push origin feature/your-feature-name
```

Navigate to the GitHub repository and create a Pull Request. Fill out the PR template completely, describing your changes and providing context for reviewers.

## Code Style Guidelines

### Formatting Standards

This project uses consistent formatting to ensure readability and reduce cognitive load when reading code. All contributors should follow these formatting rules:

- **Quotes**: Use double quotes only. This means `"string"` is correct, while `'string'` is not.
- **Semicolons**: Always use semicolons at the end of statements. Do not rely on JavaScript's automatic semicolon insertion.
- **Indentation**: Use 2 spaces for indentation. Do not use tabs.
- **Trailing commas**: Use trailing commas in multi-line objects and arrays. This improves diff readability.
- **Line width**: Keep lines to 100 characters or fewer.
- **Spacing**: Add spaces inside curly braces for objects (`{ key: value }`), but not inside square brackets for arrays (`[item1, item2]`).

### Code Formatting and Linting

The project uses Prettier for automatic code formatting and ESLint for static analysis. Before committing code, always run these tools to ensure your code meets the project's standards:

```bash
# Format all files with Prettier
pnpm format

# Check for linting errors
pnpm lint

# Auto-fix linting issues
pnpm lint:fix
```

Running `pnpm format` modifies files in place to match the project's formatting standards. Running `pnpm lint:fix` attempts to automatically fix linting issues. After running these commands, review the changes and ensure they don't introduce unintended modifications.

### Prettier Configuration

The project's `.prettierrc` file contains the following configuration:

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

This configuration enforces double quotes, semicolons, 2-space indentation, trailing commas, and a maximum line width of 100 characters. The `trailingComma: "es5"` setting ensures trailing commas are used in multi-line objects and arrays while maintaining compatibility with ES5 environments.

## Naming Conventions

Consistent naming makes code more readable and helps contributors quickly understand the codebase. Follow these naming conventions for all code contributions:

**Classes and Components** use PascalCase, where each word starts with a capital letter. Examples include `DashboardController`, `ModelsPage`, `SocketClient`, and `StateManager`. This convention applies to all JavaScript classes and React-like component functions.

**Functions and Variables** use camelCase, where the first word is lowercase and subsequent words start with capital letters. Examples include `getModels()`, `isLoading`, `currentRoute`, and `updateUI()`. This convention applies to all regular functions, arrow functions, and variable declarations.

**Constants** use UPPER_SNAKE_CASE, where all words are uppercase and separated by underscores. Examples include `DEFAULT_CONFIG`, `API_BASE_URL`, `MAX_MODELS`, and `SOCKET_EVENTS`. Use this convention for any value that should not be modified after initialization.

**Private class members** use an underscore prefix to indicate they are internal implementation details. Examples include `_init()`, `_handleEvent()`, and `_unsubscribers`. This convention helps distinguish between public API and internal implementation.

**File names** should match their primary export. For example, `layout.js` exports `Layout`, `router.js` exports `Router`, and `component.js` exports `Component`. This makes it easier to navigate the codebase and understand the relationship between files and their contents.

## Testing Requirements

### Test Coverage Standards

This project maintains high test coverage to ensure reliability and prevent regressions. All new code contributions must include appropriate tests, and the overall coverage must remain at 98% or higher. Before submitting a Pull Request, ensure that your changes don't reduce coverage:

```bash
# Run the test suite
pnpm test

# Generate coverage report
pnpm test:coverage
```

The coverage report is generated in the `coverage/` directory. Open `coverage/index.html` in a browser to view a detailed breakdown of coverage by file and line number. Pay special attention to any new code that isn't covered by tests.

### Test Organization

Tests are organized in the `__tests__` directory following a structure that mirrors the main codebase:

```
__tests__/
├── server/           # Server-side tests (db.test.js, metadata.test.js)
├── utils/            # Utility tests (validation.test.js, format.test.js)
└── integration/      # Integration tests
```

Server-side tests cover database operations, API endpoints, and server-side logic. Utility tests cover formatting functions, validation functions, and other standalone utilities. Integration tests verify that components work together correctly.

### Writing Tests

Follow this pattern when writing tests using the project's testing framework:

```javascript
describe('FeatureName', () => {
  describe('when condition', () => {
    it('should do something expected', () => {
      // Arrange: Set up test fixtures
      const input = 'test-value';
      const expected = 'expected-result';

      // Act: Perform the action being tested
      const result = featureUnderTest(input);

      // Assert: Verify the result matches expectations
      expect(result).toBe(expected);
    });

    it('should handle error conditions', () => {
      // Test error handling paths
    });
  });
});
```

Use descriptive test names that clearly indicate what is being tested and what the expected behavior is. Each test should focus on a single behavior to make debugging easier when tests fail. The Arrange-Act-Assert pattern helps structure tests clearly.

## Documentation Requirements

Good documentation is essential for a successful open-source project. All contributions should include appropriate documentation updates:

**Update docs for new features**: When adding new functionality, document how it works, what options are available, and how to use it. Add a new section to the appropriate documentation file in the `docs/` directory.

**Add JSDoc for new functions**: Every new function should have JSDoc comments describing its purpose, parameters, return value, and any exceptions it may throw. This enables IDE auto-completion and helps other developers understand your code.

**Update README for user-facing changes**: If your changes affect how users interact with the dashboard, update the README.md file to reflect those changes. User-facing documentation should be clear, concise, and include examples where helpful.

**Add examples for new APIs**: When adding new API endpoints or Socket.IO events, include example usage in the documentation. This helps integrators understand how to use your new functionality.

## Pull Request Process

### Before Submitting

Before creating a Pull Request, verify that your contribution meets all requirements:

- [ ] Code follows style guidelines (run `pnpm format` and `pnpm lint`)
- [ ] All tests pass (run `pnpm test`)
- [ ] No linting errors remain (run `pnpm lint`)
- [ ] Documentation has been updated
- [ ] Commit messages are clear and follow conventional commit format
- [ ] PR description is detailed and fills out all template sections

### Pull Request Template

Use the following template when creating your Pull Request:

```markdown
## Description

Brief description of the changes made. Explain what problem this solves or what feature this adds.

## Type of Change

- [ ] Bug fix (fixes an existing issue)
- [ ] New feature (adds new functionality)
- [ ] Breaking change (changes that break existing functionality)
- [ ] Documentation update (changes to documentation only)

## Motivation and Context

Explain why these changes are necessary. What use case do they address? Link to any related issues.

## How Has This Been Tested?

Describe how you tested your changes. Include specific steps to reproduce any bugs that were fixed.

## Screenshots

If your changes affect the UI, include screenshots showing before and after states.

## Checklist

- [ ] My code follows the project's code style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have updated the documentation to reflect my changes
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or my feature works
- [ ] New and existing tests pass locally with my changes
```

### Review Process

After submitting a Pull Request, the following process occurs:

Automated checks run first, including the test suite, linting, and coverage analysis. If any of these checks fail, you'll need to address the issues before a maintainer can review your code.

A maintainer then reviews your code for architecture, clarity, and adherence to project standards. Review comments are provided to help improve the contribution. Address all comments by either implementing the suggested changes or explaining why you chose a different approach.

When all feedback has been addressed and the code meets all standards, a maintainer approves the Pull Request. Your changes are then merged into the main branch and will be included in the next release.

## Bug Reports

### Before Submitting a Bug Report

Before submitting a bug report, check if the issue has already been reported by searching the GitHub Issues page. If you find a similar report, add a comment to the existing issue with any additional information you have rather than creating a duplicate.

Also, try to reproduce the bug in the latest version of the codebase. If the bug was fixed recently, your issue may already be resolved.

### Bug Report Template

Use the following template when submitting bug reports:

```markdown
## Bug Description

Clear and concise description of the bug. Describe what happens and why this is a problem.

## Steps to Reproduce

1. Navigate to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error / unexpected behavior

## Expected Behavior

What should happen? Describe the correct, intended behavior.

## Actual Behavior

What actually happens? Include the exact error message if available.

## Environment

- Operating System: [e.g., Ubuntu 22.04, macOS Sonoma, Windows 11]
- Node.js Version: [e.g., 20.0.0]
- pnpm Version: [e.g., 9.0.0]
- Project Version: [e.g., commit hash or release tag]

## Screenshots

If the bug affects the UI, include screenshots showing the error state. Use code blocks or formatted text for error messages.

## Additional Context

Any other context about the problem. This might include:
- Browser/terminal output
- Configuration settings
- Steps you've already tried
- Related issues or discussions
```

## Feature Requests

### Feature Request Template

Use the following template when submitting feature requests:

```markdown
## Feature Description

Clear and concise description of the feature you want to see added to the project.

## Use Case

Explain why this feature is needed. What problem does it solve? Who benefits from this feature?

## Proposed Solution

Describe how you think this feature should work. Include any relevant technical details, API suggestions, or UI mockups.

## Alternatives Considered

What other approaches have you considered? Why did you reject them in favor of your proposed solution?

## Additional Context

Add any other context, screenshots, diagrams, or references that might help explain your feature request. Links to similar features in other projects are also helpful.
```

## Community

### Getting Help

If you need help with contributing, there are several ways to get assistance. GitHub Discussions is the best place to ask questions about the project, discuss implementation approaches, and get guidance on where to start. The Issue Tracker should be used for bug reports and specific feature requests with clear requirements.

Before asking questions, review this contributing guide and the project's README to see if your question has already been answered. When asking questions, provide context about what you've tried and what specific help you need.

### Code of Conduct

This project adheres to a Code of Conduct that defines expected behavior for all contributors. By participating in this project, you agree to abide by its terms. The Code of Conduct is designed to ensure a welcoming and inclusive environment for everyone.

Treat all community members with respect. Be constructive in feedback and criticism. Harassment, discrimination, and other inappropriate behavior will not be tolerated. If you witness or experience behavior that violates the Code of Conduct, please contact the project maintainers.

## Recognition

### How Contributors Are Recognized

Contributors are acknowledged in several ways. All contributors are listed in the README.md file under a dedicated contributors section. Each contribution is attributed to the GitHub username of the person who made it, and the list is updated automatically when Pull Requests are merged.

Commit attribution is preserved through Git's history—your contributions are permanently recorded in the project's commit log. Issue and Pull Request acknowledgment happens through mentions and links in documentation when your contributions are referenced.

For significant contributions, maintainers may highlight contributors in release announcements or blog posts. If you've made substantial contributions and would like additional recognition, please reach out to the maintainers.

### Becoming a Maintainer

Active contributors who consistently provide high-quality contributions may be invited to become maintainers. Maintainers have additional privileges and responsibilities, including reviewing Pull Requests and managing issues. If you're interested in becoming a maintainer, demonstrate your commitment to the project through consistent, high-quality contributions.

---

Thank you for reading this contributing guide. Your willingness to contribute makes this project better for everyone. We look forward to your contributions and are happy to help you get started!
