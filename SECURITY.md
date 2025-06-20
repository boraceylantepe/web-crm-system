# Security Policy

## 🔒 Security Overview

This document outlines the security practices for the Web-Based CRM System and provides guidelines for reporting security vulnerabilities.

## 🚨 Critical Security Notice

**⚠️ IMPORTANT**: This repository previously contained hardcoded sensitive information that has been removed. If you forked or downloaded the repository before the security fixes, please:

1. **Immediately change any exposed passwords**
2. **Generate new secret keys**
3. **Update your local environment configuration**

## 🛡️ Security Practices

### Environment Variables

**NEVER commit sensitive information to version control:**

- ❌ Database passwords
- ❌ Secret keys
- ❌ API keys
- ❌ Email credentials
- ❌ Third-party service tokens

**✅ Always use environment variables:**

```bash
# Create .env file in backend/ directory
SECRET_KEY=your-super-secret-key-here-min-50-chars
DB_PASSWORD=your-database-password
```

### Required Environment Variables

The following environment variables **MUST** be set:

| Variable | Description | Example |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key (min 50 chars) | `your-super-secret-key-here...` |
| `DB_PASSWORD` | PostgreSQL password | `your-secure-password` |
| `DEBUG` | Debug mode (False in production) | `False` |

### Password Security

- **Minimum 8 characters**
- **Must contain**: uppercase, lowercase, numbers, special characters
- **Password expiration**: 90 days
- **Force password change** on first login

### Authentication Security

- **JWT tokens** with 15-minute expiration
- **Refresh token rotation** enabled
- **Token blacklisting** after logout
- **Session timeout** after 15 minutes of inactivity

### Database Security

- **PostgreSQL** with proper user permissions
- **No raw SQL queries** (use Django ORM)
- **Input validation** for all user inputs
- **SQL injection protection** via parameterized queries

### API Security

- **CORS** properly configured
- **CSRF protection** enabled
- **Rate limiting** implemented
- **Input validation** on all endpoints
- **Authentication required** for protected endpoints

## 🔍 Security Checklist for Deployment

### Before Production Deployment:

- [ ] Set `DEBUG=False`
- [ ] Generate strong `SECRET_KEY` (50+ characters)
- [ ] Use secure database password
- [ ] Enable HTTPS (`SECURE_SSL_REDIRECT=True`)
- [ ] Set secure cookies (`SESSION_COOKIE_SECURE=True`)
- [ ] Configure HSTS headers
- [ ] Set up proper CORS origins
- [ ] Enable audit logging
- [ ] Configure secure file permissions
- [ ] Set up regular database backups
- [ ] Implement monitoring and alerting

### Environment Configuration:

```env
# Production settings
DEBUG=False
SECRET_KEY=your-production-secret-key-here
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

## 🐛 Reporting Security Vulnerabilities

### Security Contact

If you discover a security vulnerability, please report it responsibly:

**Email**: [Create an issue with [SECURITY] prefix]

### What to Include

When reporting a security issue, please include:

1. **Description** of the vulnerability
2. **Steps to reproduce** the issue
3. **Potential impact** assessment
4. **Suggested fix** (if known)
5. **Your contact information**

### Response Timeline

- **Acknowledgment**: Within 24 hours
- **Initial assessment**: Within 72 hours
- **Status updates**: Weekly until resolved
- **Resolution**: Target within 30 days

### Responsible Disclosure

- **Do not** publicly disclose the vulnerability until it's fixed
- **Allow reasonable time** for the issue to be resolved
- **Work with us** to understand and resolve the issue

## 🔐 Security Features

### Current Security Measures

- **JWT Authentication** with token rotation
- **Role-Based Access Control** (Admin, Manager, Employee)
- **Password Complexity Validation**
- **Session Management** with timeout
- **Audit Logging** for user actions
- **CSRF Protection** enabled
- **XSS Protection** headers set
- **Input Validation** on all forms
- **Secure File Upload** with type validation

### Planned Security Enhancements

- [ ] Two-Factor Authentication (2FA)
- [ ] OAuth2 integration
- [ ] Advanced threat detection
- [ ] Security headers middleware
- [ ] Content Security Policy (CSP)
- [ ] API rate limiting per user
- [ ] Automated security scanning

## 📚 Security Resources

### Documentation

- [Django Security Best Practices](https://docs.djangoproject.com/en/stable/topics/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)

### Tools

- **Backend Security**: Django's built-in security features
- **Frontend Security**: Content Security Policy headers
- **Database Security**: PostgreSQL security features
- **Infrastructure**: HTTPS, secure headers, firewall rules

## 🚨 Security Incidents

### In Case of Security Breach

1. **Immediate Response**:
   - Change all passwords and secrets immediately
   - Revoke all active JWT tokens
   - Check audit logs for suspicious activity
   - Notify affected users

2. **Investigation**:
   - Preserve evidence and logs
   - Identify the attack vector
   - Assess the scope of the breach
   - Document timeline of events

3. **Recovery**:
   - Fix the vulnerability
   - Restore from clean backups if needed
   - Monitor for continued threats
   - Update security measures

4. **Communication**:
   - Notify stakeholders
   - Prepare public disclosure (if required)
   - Document lessons learned
   - Update security procedures

## 📋 Security Updates

This security policy is reviewed and updated regularly. Last updated: January 2025

---

**Remember**: Security is everyone's responsibility. When in doubt, ask questions and follow the principle of least privilege. 