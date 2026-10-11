# Security Policy

## Supported Versions

Currently, only the main `v1.x` branch receives security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within IntelliReview AI, please do not disclose it publicly.

Instead, please send an e-mail to the maintainer. We take all security vulnerabilities seriously and will work to resolve them as quickly as possible.

### What to include in your report:
- A description of the vulnerability.
- Steps to reproduce the issue.
- Potential impact of the vulnerability.

## Webhook Security

If you deploy IntelliReview AI and connect it to GitHub, ensure your `GITHUB_WEBHOOK_SECRET` is strong and matches the configuration in your GitHub App. The server explicitly uses `X-Hub-Signature-256` to validate that webhooks originated from GitHub.

## Artificial Intelligence Precautions

IntelliReview AI sends code snippets to LLMs (like Ollama or Groq) for analysis. 
- If using **Ollama**, the data remains strictly local to your server.
- If using **Groq** or another cloud provider, your code snippets will be transmitted over the internet to that provider. Please review the privacy policy of any cloud LLM provider you configure. Do not use cloud providers to analyze proprietary code unless you have clearance to do so.
