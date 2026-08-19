# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in InvisiProof, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

### How to Report

Email: security@invisiproof.com

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes (optional)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 5 business days
- **Fix timeline**: Within 90 days for confirmed vulnerabilities

### Scope

In scope:
- Authentication bypass
- Data exposure (other users' scans, assessments, or evidence)
- RLS policy bypasses in Supabase
- API key exposure
- Injection vulnerabilities in edge functions

Out of scope:
- Social engineering
- Physical attacks
- Denial of service
- Issues in third-party services (Supabase, RevenueCat, PostHog)

### Disclosure Policy

InvisiProof follows responsible disclosure. We ask that you:
- Give us 90 days to fix the issue before public disclosure
- Not access or modify other users' data during testing
- Not perform testing that degrades service for other users

We will credit researchers who report valid vulnerabilities (with permission).
