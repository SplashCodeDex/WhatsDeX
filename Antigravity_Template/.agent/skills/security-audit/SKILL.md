---
name: security-audit
description: Deep-dive security analysis focusing on defensive coding, vulnerability identification, and "black-box" thinking. Use for sensitive features or comprehensive audits.
---

# Security Audit Skill

This skill focuses on a defensive, "black-hat" perspective to secure the application. It goes beyond basic linting to identify how an attacker might exploit the system.

## Mindset: "How would I break this?"
When auditing, adopt the persona of an ethical researcher looking for bounties or exploits.

## Audit Checklist

### 1. Data Flow Analysis
-   **Entry Points:** Where does data enter? (API endpoints, forms, URL params, headers).
-   **Trust Boundaries:** Is trusted, internal data mixed with untrusted, external data?
-   **Sanitization:** Is data validated *immediately* upon entry?

### 2. Common Vulnerabilities (OWASP Top 10 Focus)
-   **Injection:** SQL, NoSQL, Command Injection?
-   **Broken Auth:** Can session tokens be stolen? Are passwords salted/hashed?
-   **Sensitive Data:** Are logs leaking PII or secrets? (Check `console.log` carefully).
-   **SDE (Insecure Direct Object References):** Can User A access User B's resource by changing an ID?

### 3. Logic Flaws
-   **Race Conditions:** Can simultaneous requests corrupt state?
-   **Business Logic Bypass:** Can a user skip a payment step? Can a negative quantity be ordered?

### 4. Dependency Check
-   Are we using outdated libraries with known CVEs?
-   Are we importing massive packages for simple functions?

## "Black-Box" Testing Strategy
Suggest specific tests the user can run:
-   "Try sending a JSON payload with a circular reference."
-   "Attempt to bypass the frontend validation using `curl`."
-   "Check if error messages reveal stack traces or database structure."

## Output Format

### 🛡️ Security Report

**High Severity** (Immediate Action Required)
*   [Vulnerability Name]: Description of the exploit vector.
*   **Fix:** Concrete code change to mitigate.

**Medium Severity** (Address Soon)
*   [Vulnerability Name]: Risks closer to theoretical or hard to exploit.

**Low Severity / Best Practice**
*   Hardening suggestions (e.g., headers, rate limiting).
