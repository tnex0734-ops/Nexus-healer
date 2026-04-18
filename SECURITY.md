# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly:

1. **Do NOT** open a public GitHub issue for security vulnerabilities
2. Email the maintainer directly or use GitHub's private vulnerability reporting feature
3. Include a description of the vulnerability, steps to reproduce, and potential impact

## Security Best Practices for This Project

### Environment Variables
- **Never commit `.env` files** — they contain sensitive API keys
- Use `.env.example` as a template for required variables
- Rotate API keys immediately if accidentally exposed

### Firebase Security
- The Firebase client configuration (API key, project ID) is designed to be public
- **Security is enforced via Firebase Security Rules**, not by hiding client keys
- Ensure your Firestore Security Rules restrict read/write access appropriately

#### Recommended Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Assessments collection
    match /assessments/{assessmentId} {
      // Allow anyone to create (patient submissions)
      allow create: if true;
      // Restrict read/update/delete to authenticated admin users
      allow read, update, delete: if request.auth != null;
    }
  }
}
```

### API Key Security
- The Gemini API key is stored server-side only (in `.env`)
- It is never exposed to the client/browser
- Use Google Cloud API key restrictions to limit usage

### Dependencies
- Run `npm audit` regularly to check for known vulnerabilities
- Keep dependencies up to date with `npm update`
