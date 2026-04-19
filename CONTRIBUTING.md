# Contributing to AI Image Generator Pro

First off, thank you for considering contributing to AI Image Generator Pro! It's people like you that make this tool better for everyone.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Review Process](#review-process)
- [Recognition](#recognition)

## 📝 Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

### Our Standards

- **Be respectful**: Treat everyone with respect. Healthy debate is encouraged, but harassment is not tolerated.
- **Be inclusive**: Welcome newcomers and help them learn. Use inclusive language.
- **Be constructive**: Provide constructive feedback and be open to receiving it.
- **Focus on what's best**: Prioritize the community and users over individual preferences.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm 9+ or yarn 1.22+
- Git
- (Optional) Docker for local development

### Fork and Clone

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ai-image-generator-pro.git
   cd ai-image-generator-pro
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/original-owner/ai-image-generator-pro.git
   ```

4. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Environment Setup

1. **Install dependencies**:
   ```bash
   # Server
   cd server
   npm install
   
   # Client
   cd ../client
   npm install
   ```

2. **Configure environment**:
   ```bash
   cd ../server
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Start development servers**:
   ```bash
   # Terminal 1 - Backend
   cd server
   npm start
   
   # Terminal 2 - Frontend
   cd client
   npm run dev
   ```

## 🔄 Development Workflow

### 1. Find or Create an Issue

- Check existing [issues](https://github.com/original-owner/ai-image-generator-pro/issues)
- Create a new issue if needed
- Comment on the issue to claim it

### 2. Create a Feature Branch

```bash
git checkout -b feature/description-of-feature
# or
git checkout -b fix/description-of-bug
```

**Branch naming conventions:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/changes
- `chore/` - Maintenance tasks

### 3. Make Your Changes

- Write clean, readable code
- Follow our coding standards (see below)
- Add/update tests as needed
- Update documentation

### 4. Test Locally

```bash
# Run server tests
cd server
npm test

# Run client tests
cd ../client
npm test

# Manual testing
# 1. Verify the 20/day limit works
# 2. Test with different providers
# 3. Check all generation modes
```

### 5. Commit Your Changes

```bash
git add .
git commit -m "feat: add new generation mode for 3D depth maps

- Implemented depth-based ControlNet
- Added UI controls for depth strength
- Updated rate limiter to track new mode

Closes #123"
```

### 6. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## 📁 Project Structure

```
ai-image-generator-pro/
├── server/                 # Backend (Node.js/Express)
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions
│   ├── middleware/        # Express middleware
│   └── uploads/           # Generated images
├── client/                # Frontend (React)
│   ├── src/
│   │   ├── components/   # React components
│   │   └── styles/       # CSS styles
│   └── public/           # Static assets
├── docs/                 # Documentation
├── .github/              # GitHub templates and workflows
└── tests/                # E2E and integration tests
```

## 💻 Coding Standards

### JavaScript/TypeScript

- Use **ESLint** configuration (included in project)
- Follow **Airbnb JavaScript Style Guide** (with modifications)
- Use **2 spaces** for indentation
- Use **single quotes** for strings
- Add **trailing commas** in multi-line objects/arrays
- Maximum **100 characters** per line

### Example:

```javascript
// ✅ Good
const generateImage = async (prompt, options) => {
  const { provider, style, quality } = options;
  
  const enhancedPrompt = enhancePrompt(prompt, style, quality);
  
  const result = await provider.generate(enhancedPrompt, {
    width: 1024,
    height: 1024,
    steps: quality.steps,
  });
  
  return result;
};

// ❌ Bad
const generateImage = async(prompt,options) => {
  const {provider,style,quality}=options
  const enhancedPrompt = enhancePrompt(prompt,style,quality)
  const result = await provider.generate(enhancedPrompt, { width: 1024, height: 1024, steps: quality.steps })
  return result
}
```

### React Components

- Use **functional components** with hooks
- Use **PascalCase** for component names
- Use **camelCase** for props
- Destructure props in function parameters

```typescript
// ✅ Good
interface GeneratorProps {
  prompt: string;
  onGenerate: (result: GenerationResult) => void;
}

export const ImageGenerator: React.FC<GeneratorProps> = ({ prompt, onGenerate }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  return (
    <div className="generator">
      {/* Component content */}
    </div>
  );
};
```

### CSS

- Use **kebab-case** for class names
- Use **BEM methodology** for complex components
- Prefer **CSS custom properties** (variables)
- Group related properties together

```css
/* ✅ Good */
.generator-card {
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: var(--bg-primary);
  border-radius: var(--border-radius);
}

.generator-card__image {
  width: 100%;
  height: auto;
  object-fit: cover;
}

.generator-card__actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
```

### API Design

- Use **RESTful conventions**
- Version APIs in URL: `/api/v1/...`
- Use **kebab-case** for URLs: `/api/generate/img2img`
- Return **consistent response format**:

```javascript
// Success
{
  "success": true,
  "data": { ... },
  "meta": { ... }
}

// Error
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Daily limit (20) reached",
    "details": { ... }
  }
}
```

## 🧪 Testing

### Unit Tests

```bash
# Server
cd server
npm test

# Client
cd client
npm test
```

### Integration Tests

```bash
npm run test:integration
```

### E2E Tests

```bash
npm run test:e2e
```

### Manual Testing Checklist

Before submitting, verify:

- [ ] User can login/register
- [ ] All 7 generation modes work
- [ ] 20/day limit is enforced
- [ ] WebSocket progress updates work
- [ ] All 4 AI providers work (with valid keys)
- [ ] Image uploads work
- [ ] Gallery displays correctly
- [ ] Responsive design works on mobile
- [ ] No console errors

## 📤 Submitting Changes

### Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Ensure all tests pass**
4. **Update CHANGELOG.md** with your changes
5. **Fill out the PR template completely**
6. **Link related issues**
7. **Request review** from maintainers

### PR Checklist

Before submitting:

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added where needed
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] No new warnings
- [ ] Rebased on latest main

## 💬 Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, missing semi colons, etc)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or correcting tests
- `chore`: Build process or auxiliary tool changes

### Examples

```
feat(api): add support for batch generation

- Implemented batch endpoint accepting multiple prompts
- Added concurrent processing with rate limiting
- Updated documentation with examples

Closes #456
```

```
fix(rate-limiter): correct UTC midnight calculation

Daily limit was resetting at wrong time for users in
non-UTC timezones. Now properly resets at UTC midnight.

Fixes #789
```

```
docs(readme): update API examples with new endpoints

Added examples for:
- ControlNet generation
- Face enhancement
- Background removal
```

## 👀 Review Process

### What We Look For

- **Correctness**: Does it work as intended?
- **Code Quality**: Is it clean and maintainable?
- **Testing**: Are there adequate tests?
- **Documentation**: Is it well documented?
- **Performance**: Does it impact the 20/day limit tracking?
- **Security**: Any vulnerabilities introduced?

### Timeline

- Initial review: Within 48 hours
- Follow-up reviews: Within 24 hours
- Merge: After approval and CI passes

### Feedback

- Be open to constructive criticism
- Respond to comments promptly
- Make requested changes
- Ask questions if unclear

## 🏆 Recognition

Contributors will be:

- Listed in the [CONTRIBUTORS.md](CONTRIBUTORS.md) file
- Mentioned in release notes
- Added to our Hall of Fame (for significant contributions)

### Levels of Contribution

- **Contributor**: Any merged PR
- **Regular Contributor**: 5+ merged PRs
- **Core Contributor**: 20+ merged PRs + code review
- **Maintainer**: Invitation-only, extensive contribution history

## 🆘 Getting Help

### Resources

- **Documentation**: Check the `docs/` folder
- **Issues**: Search existing issues first
- **Discussions**: Use GitHub Discussions for questions
- **Discord**: [Join our community](https://discord.gg/ai-image-generator)

### Contact

- **Security Issues**: Email security@aiimagegenerator.pro
- **General Questions**: Open a GitHub Discussion
- **Bug Reports**: Create an issue with the bug template

## 🎯 Priority Areas

We especially welcome contributions in:

1. **New AI Providers**: Integration with new free/paid providers
2. **UI/UX Improvements**: Better user experience
3. **Performance**: Faster generation, lower latency
4. **Mobile Experience**: Better mobile UI
5. **Documentation**: Tutorials, examples, translations
6. **Testing**: More comprehensive test coverage
7. **Accessibility**: Making the app accessible to everyone

## 🚫 What NOT to Contribute

Please don't submit:

- Generated images (use the app for that!)
- API keys or credentials
- Changes that break the 20/day limit for free users
- Code that violates provider terms of service
- Malicious code or security exploits

## 📜 License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

## Thank You! 🙏

Your contributions make AI Image Generator Pro better for everyone. Whether you're fixing a typo or adding a major feature, we appreciate your time and effort.

Happy coding! 🎨✨

---

**Questions?** Open a [GitHub Discussion](https://github.com/original-owner/ai-image-generator-pro/discussions) or email us at contribute@aiimagegenerator.pro
