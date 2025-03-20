# Security Policy

## Supported Versions

We currently support the following versions of MagicPods with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of MagicPods seriously. If you believe you've found a security vulnerability, please follow these steps:

1. **Do not disclose the vulnerability publicly** until it has been addressed by our team
2. Email security details to [jack.dalegomaster@gmail.com](mailto:jack.dalegomaster@gmail.com) with:
   - A description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact of the vulnerability
   - Any suggested mitigations (if you have them)

## What to expect

- We will acknowledge receipt of your vulnerability report within 3 business days
- We will provide a detailed response about the next steps in handling your report
- We will keep you informed about our progress in fixing the issue
- We will post a security advisory when the vulnerability is fixed

## Security Measures

MagicPods implements various security measures:

- Regular security audits of dependencies (using `npm audit` and automated workflows)
- Pre-commit hooks that include security checks
- CI/CD pipeline with security scanning
- Input validation and sanitization to prevent injection attacks
- Authentication using modern security practices
- Data encryption for sensitive information

## Recent Security Updates

Our most recent security audit was performed on March 9, 2025. You can find the audit results in the `security-audits` directory.

## Third-Party Libraries and Dependencies

We regularly monitor and update our dependencies to patch security vulnerabilities. Our policy is to:

1. Update dependencies with critical vulnerabilities within 7 days
2. Update dependencies with high severity vulnerabilities within 14 days
3. Update dependencies with medium/low severity vulnerabilities during regular maintenance cycles

## Security Best Practices for Contributors

If you're contributing to MagicPods, please follow these security best practices:

1. Do not commit secrets or API keys to the repository
2. Run `npm audit` before submitting a PR
3. Follow the principle of least privilege when implementing new features
4. Validate and sanitize all user inputs
5. Follow the established authentication and authorization patterns in the codebase

## Responsible Disclosure

We follow responsible disclosure principles and appreciate the efforts of security researchers who help keep our projects secure. We promise not to take legal action against researchers who follow our responsible disclosure policy.