# Contributing to AgentTrace

First off, thanks for taking the time to contribute! 🎉

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (e.g., the codebase structure that caused the issue)
- **Describe the behavior you observed and what you expected**
- **Include the output** of `agenttrace scan --json` if relevant

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List any alternative solutions you've considered**

### Adding New Detectors

One of the best ways to contribute is by adding support for new AI frameworks. Here's how:

1. Create a new file in `packages/cli/src/detectors/`
2. Implement the `Detector` interface:

```typescript
import { Detector, DetectorResult, FileInfo } from './base';

export class MyFrameworkDetector implements Detector {
  name = 'my-framework';
  extensions = ['.py', '.ts']; // File extensions to scan

  async detect(file: FileInfo): Promise<DetectorResult> {
    // Your detection logic here
    return { tools: [], agents: [], mcpServers: [] };
  }
}
```

3. Register your detector in `packages/cli/src/detectors/index.ts`
4. Add tests for your detector
5. Update the README with the new supported framework

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. Ensure the test suite passes
4. Make sure your code follows the existing style
5. Write a clear PR description

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/agenttrace.git
cd agenttrace

# Install dependencies
cd packages/cli && npm install
cd ../dashboard && npm install

# Build
cd ../cli && npm run build
cd ../dashboard && npm run build

# Run tests
npm test

# Try it out
node packages/cli/dist/index.js scan /path/to/test/project
```

## Project Structure

```
packages/
├── cli/           # Command-line scanner
│   └── src/
│       ├── commands/      # CLI commands (scan, dashboard)
│       ├── detectors/     # Framework-specific detectors
│       ├── inference/     # Permission inference logic
│       ├── scanner/       # File walking and routing
│       └── output/        # Console and JSON output
└── dashboard/     # Web UI
    └── src/
        ├── components/    # React components
        ├── hooks/         # Custom hooks
        └── store/         # Zustand state
```

## Code Style

- Use TypeScript for all new code
- Follow existing patterns in the codebase
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions focused and small

## Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters
- Reference issues and pull requests liberally

Examples:
- `feat: add CrewAI detector for Python`
- `fix: handle empty tool descriptions in permission inference`
- `docs: update README with dashboard instructions`
- `refactor: extract common regex patterns to utils`

## Questions?

Feel free to open an issue with the "question" label if you need help getting started.

Thanks for contributing! 🚀
