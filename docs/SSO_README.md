# Single Sign-On (SSO) for LibreChat

LibreChat provides comprehensive Single Sign-On (SSO) support through OpenID Connect, SAML, and OAuth 2.0 providers, making it easy to integrate with your existing identity infrastructure and other services in your ecosystem.

## 📚 Documentation

We've created comprehensive documentation to help you set up and configure SSO:

### Quick Links

- **🚀 [Quick Start Guide](./SSO_QUICKSTART.md)** - Get SSO running in minutes
- **📖 [Configuration Guide](./SSO_CONFIGURATION.md)** - Comprehensive configuration reference
- **🔗 [Integration Guide](./SSO_INTEGRATION_GUIDE.md)** - Integrate with LiteLLM, OpenWebUI, SIM Studio, and more

## ✨ Features

- **OpenID Connect (OIDC)** - Primary SSO method, works with most identity providers
- **SAML 2.0** - Enterprise-grade authentication
- **OAuth 2.0** - Support for Google, GitHub, Discord, Facebook, Apple
- **Role-Based Access Control** - Control access using identity provider roles
- **Token Management** - Efficient token caching and refresh
- **Custom Claims Mapping** - Map user attributes from your identity provider
- **PKCE Support** - Enhanced security for public clients
- **Single Logout** - Logout from all connected services

## 🎯 Use Cases

### Individual Setup
- Personal LibreChat instance with Google/GitHub login
- Quick setup with built-in OAuth providers

### Team/Organization Setup
- Centralized authentication across multiple services
- Integration with existing identity provider (Keycloak, Auth0, Azure AD, Okta)
- Role-based access control for different user groups

### Enterprise Setup
- SAML 2.0 for enterprise identity providers
- Advanced security features (PKCE, token encryption)
- High availability with Redis session storage
- Audit logging and compliance

## 🚀 Quick Start

### Option 1: Use Setup Script (Recommended)

```bash
cd /path/to/LibreChat
./scripts/setup-sso.sh
```

The interactive script will guide you through the configuration process.

### Option 2: Docker Compose (All-in-One)

```bash
# Copy example files
cp .env.sso.example .env
cp docker-compose.override.yml.example docker-compose.override.yml

# Edit .env with your identity provider details
nano .env

# Edit docker-compose.override.yml and uncomment the SSO sections
nano docker-compose.override.yml

# Start services (uses docker-compose.yml + docker-compose.override.yml)
docker compose up -d
```

### Option 3: Manual Configuration

See the [Configuration Guide](./SSO_CONFIGURATION.md) for detailed instructions.

## 🔐 Supported Identity Providers

### Tested and Documented
- **Keycloak** - Open-source identity provider
- **Azure Active Directory / Entra ID** - Microsoft's identity platform
- **Auth0** - Identity-as-a-Service platform
- **Okta** - Enterprise identity platform
- **Google Workspace** - OAuth 2.0 integration

### Compatible (OpenID Connect Standard)
Any OpenID Connect 1.0 compliant identity provider should work, including:
- GitLab
- AWS Cognito
- OneLogin
- PingIdentity
- ForgeRock
- And many more...

## 🔗 Integration with Other Services

LibreChat can work seamlessly with other services using the same identity provider:

### Documented Integrations
- **LiteLLM** - AI model proxy and load balancer
- **OpenWebUI** - Alternative AI chat interface
- **SIM Studio** - Simulation and modeling platform

See the [Integration Guide](./SSO_INTEGRATION_GUIDE.md) for step-by-step instructions.

## 🛠️ Configuration Options

### Basic Configuration
```bash
OPENID_CLIENT_ID=your-client-id
OPENID_CLIENT_SECRET=your-client-secret
OPENID_ISSUER=https://your-idp.com/realm/your-realm
OPENID_SESSION_SECRET=generate-random-secret
OPENID_SCOPE="openid profile email"
OPENID_CALLBACK_URL=/oauth/openid/callback
```

### Advanced Features

**Role-Based Access Control**
```bash
OPENID_REQUIRED_ROLE=librechat-user
OPENID_ADMIN_ROLE=librechat-admin
OPENID_REQUIRED_ROLE_PARAMETER_PATH=realm_access.roles
```

**Custom Claims Mapping**
```bash
OPENID_USERNAME_CLAIM=preferred_username
OPENID_NAME_CLAIM=name
```

**Token Management**
```bash
OPENID_REUSE_TOKENS=true
OPENID_JWKS_URL_CACHE_ENABLED=true
```

See the [Configuration Guide](./SSO_CONFIGURATION.md) for all available options.

## 📋 Prerequisites

- Docker and Docker Compose (for containerized deployment)
- OR Node.js v18+ (for local development)
- An OpenID Connect identity provider or compatible OAuth provider
- Client credentials (Client ID and Secret) from your identity provider

## 🔍 Verification

Test your SSO configuration:

```bash
# Using the setup script
./scripts/setup-sso.sh test

# Manual verification
curl http://localhost:8080/realms/your-realm/.well-known/openid-configuration
curl http://localhost:3080/api/config
```

Check logs:
```bash
docker compose logs -f api | grep openidStrategy
```

## 🐛 Troubleshooting

Common issues and solutions:

### Invalid Redirect URI
Ensure your callback URL matches exactly:
```
<DOMAIN_SERVER><OPENID_CALLBACK_URL>
```

Example: `http://localhost:3080/oauth/openid/callback`

### Cannot Connect to Identity Provider
- Check network connectivity
- Verify issuer URL is accessible
- For Docker: use service names instead of `localhost`

### Token Validation Failed
- Verify system clocks are synchronized
- Check token expiration times
- Review `OPENID_CLOCK_TOLERANCE` setting

See [Troubleshooting Guide](./SSO_CONFIGURATION.md#troubleshooting) for more solutions.

## 📖 Full Documentation

### Guides
1. **[Quick Start Guide](./SSO_QUICKSTART.md)**
   - Get up and running in minutes
   - Three different setup options
   - Common quick fixes

2. **[Configuration Guide](./SSO_CONFIGURATION.md)**
   - Comprehensive configuration reference
   - All environment variables explained
   - Advanced features and options
   - Security best practices
   - Production deployment guide

3. **[Integration Guide](./SSO_INTEGRATION_GUIDE.md)**
   - Multi-service SSO architecture
   - Step-by-step integration instructions
   - Keycloak setup tutorial
   - LiteLLM, OpenWebUI, SIM Studio configuration
   - Complete Docker Compose examples

### Files
- **`.env.sso.example`** - Example environment file with SSO configuration
- **`docker-compose.override.yml.example`** - Docker Compose override examples with SSO configuration
- **`scripts/setup-sso.sh`** - Interactive setup script

## 🔒 Security Considerations

### Best Practices
1. **Use HTTPS in production** - Always use TLS/SSL for production deployments
2. **Enable PKCE** - Set `OPENID_USE_PKCE=true` for enhanced security
3. **Strong secrets** - Generate cryptographically secure random secrets
4. **Regular updates** - Keep LibreChat and identity provider updated
5. **Monitor authentication** - Log and monitor failed login attempts

### Secret Generation
Generate secure secrets:
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

### Production Checklist
- [ ] HTTPS enabled with valid SSL certificates
- [ ] Strong, unique secrets for all tokens
- [ ] PKCE enabled (`OPENID_USE_PKCE=true`)
- [ ] Role-based access control configured
- [ ] Regular security updates scheduled
- [ ] Monitoring and alerting configured
- [ ] Backup and disaster recovery plan
- [ ] Session storage using Redis (for multi-instance)

## 🎓 Examples

### Example 1: Basic OpenID Connect
```bash
OPENID_CLIENT_ID=librechat
OPENID_CLIENT_SECRET=abc123secret
OPENID_ISSUER=https://auth.example.com/realms/myorg
OPENID_SESSION_SECRET=generated-secret-here
OPENID_USE_PKCE=true
```

### Example 2: With Role-Based Access
```bash
OPENID_CLIENT_ID=librechat
OPENID_CLIENT_SECRET=abc123secret
OPENID_ISSUER=https://auth.example.com/realms/myorg
OPENID_SESSION_SECRET=generated-secret-here
OPENID_REQUIRED_ROLE=librechat-user,librechat-admin
OPENID_REQUIRED_ROLE_PARAMETER_PATH=realm_access.roles
OPENID_ADMIN_ROLE=librechat-admin
```

### Example 3: Azure AD Configuration
```bash
OPENID_CLIENT_ID=your-azure-client-id
OPENID_CLIENT_SECRET=your-azure-client-secret
OPENID_ISSUER=https://login.microsoftonline.com/your-tenant-id/v2.0
OPENID_SESSION_SECRET=generated-secret-here
OPENID_USE_PKCE=true
OPENID_ON_BEHALF_FLOW_FOR_USERINFO_REQUIRED=true
OPENID_ON_BEHALF_FLOW_USERINFO_SCOPE="user.read"
```

## 📞 Support

Need help with SSO configuration?

- **Documentation**: Start with the [Quick Start Guide](./SSO_QUICKSTART.md)
- **Discord**: https://discord.librechat.ai
- **GitHub Issues**: https://github.com/danny-avila/LibreChat/issues
- **Discussions**: https://github.com/danny-avila/LibreChat/discussions

## 🤝 Contributing

Found an issue or want to improve the SSO documentation?

1. Check existing issues: https://github.com/danny-avila/LibreChat/issues
2. Open a new issue or pull request
3. Join our Discord to discuss: https://discord.librechat.ai

## 📄 License

LibreChat is licensed under the MIT License. See the main repository LICENSE file for details.

---

**Ready to get started?** Check out the [Quick Start Guide](./SSO_QUICKSTART.md)!
