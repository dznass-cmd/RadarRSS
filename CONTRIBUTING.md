# Contributing to Radar RSS

Thank you for your interest in contributing to **Radar RSS**! We welcome bug reports, feature requests, documentation improvements, and code contributions from the community.

---

## Code of Conduct

Please maintain a respectful, welcoming, and harassment-free environment for everyone.

---

## How to Contribute

### 1. Reporting Bugs
- Search existing [Issues](https://github.com/dznass-cmd/RadarRSS/issues) before opening a new one.
- Use the **Bug Report** template and include:
  - Clear title and detailed description.
  - Steps to reproduce the issue.
  - Expected vs. actual behavior.
  - Environment details (OS, Node.js version, browser / Android version).

### 2. Suggesting Features
- Open an issue using the **Feature Request** template.
- Clearly describe the problem you want to solve and your proposed solution.

### 3. Pull Requests (PRs)
1. Fork the repository and create a branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Follow code standards:
   - TypeScript strict typing.
   - Clean, modular component architecture.
   - Run type checks and build before committing:
     ```bash
     npm run lint
     npm run build
     ```
3. Commit your changes with clear, descriptive commit messages.
4. Push to your fork and submit a Pull Request describing your changes.

---

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/RadarRSS.git
cd RadarRSS

# Install dependencies
npm install

# Start development server
npm run dev

# Run desktop Electron version
npm run desktop

# Sync and build Android
npm run build:android
```

---

## License
By contributing to Radar RSS, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
