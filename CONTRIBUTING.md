# Contributing to IntelliReview AI

First off, thank you for considering contributing to IntelliReview AI!

## Development Environment Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/jagetheswaren/AI-Code-Review-Assistant.git
   cd AI-Code-Review-Assistant
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

## Pull Request Process

1. Ensure any install or build dependencies are removed before the end of the layer when doing a build.
2. Update the README.md with details of changes to the interface, this includes new environment variables, exposed ports, useful file locations and container parameters.
3. You may merge the Pull Request in once you have the sign-off of two other developers, or if you do not have permission to do that, you may request the second reviewer to merge it for you.

## Architecture Guidelines

- **Stateless Backend:** Keep the Flask backend stateless. Store all state in MongoDB.
- **Error Handling:** Use the existing `ErrorBoundary` in React. Do not let components crash silently.
- **Testing:** We use Playwright for E2E testing. If you add a new page, add a Playwright test for it in `frontend/tests/e2e/`.

## Code Style

- **Python:** We follow PEP 8.
- **JavaScript/React:** We use Prettier for formatting. Ensure no linting errors remain before submitting a PR.
