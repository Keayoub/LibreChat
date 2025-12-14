# SSO Configuration Guide for LibreChat

This guide provides comprehensive instructions for configuring Single Sign-On (SSO) for LibreChat and ensuring integration with other services in your ecosystem.

## Table of Contents

1. [Overview](#overview)
2. [OpenID Connect Configuration](#openid-connect-configuration)
3. [Integration with External Services](#integration-with-external-services)
4. [Environment Variables](#environment-variables)
5. [Docker Compose Configuration](#docker-compose-configuration)
6. [Testing and Validation](#testing-and-validation)
7. [Troubleshooting](#troubleshooting)

## Overview

LibreChat supports multiple SSO authentication methods:

- **OpenID Connect (OIDC)** - Recommended for most use cases
- **SAML 2.0** - For enterprise environments
- **OAuth 2.0 Providers** - Google, GitHub, Discord, Facebook, Apple

This guide focuses on OpenID Connect as it provides the most flexibility for integration with other services.

## OpenID Connect Configuration

### Prerequisites

1. An OpenID Connect provider (e.g., Keycloak, Auth0, Azure AD, Okta)
2. Client credentials (Client ID and Client Secret)
3. Issuer URL from your identity provider

### Basic Configuration

Edit your `.env` file with the following OpenID Connect settings:

```bash
# OpenID Connect Configuration
OPENID_CLIENT_ID=your-client-id
OPENID_CLIENT_SECRET=your-client-secret
OPENID_ISSUER=https://your-idp.com/realms/your-realm
OPENID_SESSION_SECRET=a-secure-random-string-min-32-chars
OPENID_SCOPE="openid profile email"
OPENID_CALLBACK_URL=/oauth/openid/callback

# Optional: Configure button label and icon
OPENID_BUTTON_LABEL="Sign in with SSO"
OPENID_IMAGE_URL=https://your-idp.com/logo.png

# Optional: Auto-redirect to SSO (skip login form)
OPENID_AUTO_REDIRECT=false

# Optional: Use PKCE for enhanced security
OPENID_USE_PKCE=true

# Optional: Audience parameter (required for some providers)
OPENID_AUDIENCE=your-audience-id
```

### Advanced Configuration

#### Role-Based Access Control

Restrict access based on user roles from your identity provider:

```bash
# Required role(s) to access LibreChat (comma-separated)
OPENID_REQUIRED_ROLE=librechat-user,librechat-admin
OPENID_REQUIRED_ROLE_TOKEN_KIND=access
OPENID_REQUIRED_ROLE_PARAMETER_PATH=resource_access.librechat.roles

# Admin role configuration
OPENID_ADMIN_ROLE=librechat-admin
OPENID_ADMIN_ROLE_PARAMETER_PATH=resource_access.librechat.roles
OPENID_ADMIN_ROLE_TOKEN_KIND=access
```

#### Custom Claims Mapping

Map identity provider claims to LibreChat user fields:

```bash
# Username claim (default: preferred_username)
OPENID_USERNAME_CLAIM=preferred_username

# Display name claim (default: name)
OPENID_NAME_CLAIM=name
```

#### Token Reuse and Caching

For improved performance and reduced token requests:

```bash
# Reuse OpenID tokens for authentication
OPENID_REUSE_TOKENS=true

# Enable JWKS URL caching
OPENID_JWKS_URL_CACHE_ENABLED=true
OPENID_JWKS_URL_CACHE_TIME=600000

# On-behalf-of flow for Microsoft Graph
OPENID_ON_BEHALF_FLOW_FOR_USERINFO_REQUIRED=false
OPENID_ON_BEHALF_FLOW_USERINFO_SCOPE="user.read"
```

#### End Session Support

Enable proper logout flow with your identity provider:

```bash
OPENID_USE_END_SESSION_ENDPOINT=true
```

## Integration with External Services

### Overview

When using LibreChat as part of a larger ecosystem (e.g., with LiteLLM, OpenWebUI, SIM Studio), all services should authenticate against the same identity provider.

### Architecture

```
┌─────────────────────┐
│   Identity Provider │
│   (Keycloak, etc.)  │
└──────────┬──────────┘
           │
           ├──────────────────────────────────┐
           │                                  │
           ▼                                  ▼
    ┌──────────┐                      ┌──────────┐
    │LibreChat │                      │ LiteLLM  │
    └──────────┘                      └──────────┘
           │                                  │
           └──────────────┬───────────────────┘
                          ▼
                   ┌──────────┐
                   │OpenWebUI │
                   └──────────┘
                          │
                          ▼
                   ┌──────────┐
                   │SIM Studio│
                   └──────────┘
```

### Configuration Steps

1. **Configure Identity Provider**
   - Create a realm/tenant for your organization
   - Create clients for each service (LibreChat, LiteLLM, OpenWebUI, SIM Studio)
   - Configure redirect URIs for each client
   - Set up roles and permissions

2. **Configure LibreChat**
   - Use the OpenID Connect configuration from this guide
   - Ensure `DOMAIN_SERVER` and `DOMAIN_CLIENT` match your deployment URLs

3. **Configure LiteLLM**
   - LiteLLM supports OpenID Connect authentication
   - Configure environment variables similar to LibreChat
   - Example:
     ```bash
     LITELLM_MASTER_KEY=your-secret-key
     UI_OAUTH_PROVIDER=openid
     OIDC_ISSUER=https://your-idp.com/realms/your-realm
     OIDC_CLIENT_ID=litellm-client-id
     OIDC_CLIENT_SECRET=litellm-client-secret
     ```

4. **Configure OpenWebUI**
   - OpenWebUI also supports OpenID Connect
   - Configure through environment variables or UI settings
   - Example:
     ```bash
     ENABLE_OAUTH_SIGNUP=true
     OAUTH_PROVIDER_NAME=SSO
     OPENID_PROVIDER_URL=https://your-idp.com/realms/your-realm/.well-known/openid-configuration
     OAUTH_CLIENT_ID=openwebui-client-id
     OAUTH_CLIENT_SECRET=openwebui-client-secret
     ```

5. **Configure SIM Studio**
   - Follow SIM Studio's documentation for OpenID Connect integration
   - Ensure the client is configured in your identity provider

### Shared Configuration

All services should share:
- The same identity provider (issuer URL)
- Proper redirect URIs configured in the identity provider
- Consistent user attribute mappings (email, username, name)
- Role-based access control configurations

## Environment Variables

### Required Variables

```bash
# Server Configuration
DOMAIN_CLIENT=http://localhost:3080
DOMAIN_SERVER=http://localhost:3080

# MongoDB
MONGO_URI=mongodb://mongodb:27017/LibreChat

# OpenID Connect (Required)
OPENID_CLIENT_ID=your-client-id
OPENID_CLIENT_SECRET=your-client-secret
OPENID_ISSUER=https://your-idp.com/realms/your-realm
OPENID_SESSION_SECRET=generate-secure-random-string
OPENID_SCOPE="openid profile email"
OPENID_CALLBACK_URL=/oauth/openid/callback

# JWT Secrets
JWT_SECRET=generate-secure-random-string
JWT_REFRESH_SECRET=generate-secure-random-string
```

### Optional Variables

```bash
# Social Login Control
ALLOW_EMAIL_LOGIN=true
ALLOW_REGISTRATION=false
ALLOW_SOCIAL_LOGIN=true
ALLOW_SOCIAL_REGISTRATION=true

# OpenID Advanced
OPENID_BUTTON_LABEL="Sign in with SSO"
OPENID_AUTO_REDIRECT=false
OPENID_USE_PKCE=true
OPENID_AUDIENCE=your-audience
OPENID_REUSE_TOKENS=true

# Role-Based Access
OPENID_REQUIRED_ROLE=user
OPENID_REQUIRED_ROLE_TOKEN_KIND=access
OPENID_REQUIRED_ROLE_PARAMETER_PATH=realm_access.roles
OPENID_ADMIN_ROLE=admin
OPENID_ADMIN_ROLE_PARAMETER_PATH=realm_access.roles
OPENID_ADMIN_ROLE_TOKEN_KIND=access

# Claims Mapping
OPENID_USERNAME_CLAIM=preferred_username
OPENID_NAME_CLAIM=name

# Debugging
DEBUG_OPENID_REQUESTS=false
```

## Docker Compose Configuration

Create a `docker-compose.override.yml` file for SSO configuration:

```yaml
version: '3.8'

services:
  api:
    environment:
      # OpenID Connect
      - OPENID_CLIENT_ID=${OPENID_CLIENT_ID}
      - OPENID_CLIENT_SECRET=${OPENID_CLIENT_SECRET}
      - OPENID_ISSUER=${OPENID_ISSUER}
      - OPENID_SESSION_SECRET=${OPENID_SESSION_SECRET}
      - OPENID_SCOPE=openid profile email
      - OPENID_CALLBACK_URL=/oauth/openid/callback
      
      # Optional
      - OPENID_BUTTON_LABEL=Sign in with SSO
      - OPENID_AUTO_REDIRECT=false
      - OPENID_USE_PKCE=true
      
      # Social Login Control
      - ALLOW_EMAIL_LOGIN=true
      - ALLOW_REGISTRATION=false
      - ALLOW_SOCIAL_LOGIN=true
      - ALLOW_SOCIAL_REGISTRATION=false
      
      # Domain Configuration
      - DOMAIN_CLIENT=https://chat.yourdomain.com
      - DOMAIN_SERVER=https://chat.yourdomain.com
```

### Complete Stack with Identity Provider

Example configuration including Keycloak:

```yaml
version: '3.8'

services:
  # LibreChat API
  api:
    environment:
      - OPENID_CLIENT_ID=librechat
      - OPENID_CLIENT_SECRET=${OPENID_CLIENT_SECRET}
      - OPENID_ISSUER=http://keycloak:8080/realms/tifinia
      - OPENID_SESSION_SECRET=${OPENID_SESSION_SECRET}
      - OPENID_SCOPE=openid profile email
      - OPENID_CALLBACK_URL=/oauth/openid/callback
      - OPENID_USE_PKCE=true
    networks:
      - sso-network

  # Keycloak Identity Provider
  keycloak:
    image: quay.io/keycloak/keycloak:latest
    environment:
      - KEYCLOAK_ADMIN=admin
      - KEYCLOAK_ADMIN_PASSWORD=${KEYCLOAK_ADMIN_PASSWORD}
      - KC_DB=postgres
      - KC_DB_URL=jdbc:postgresql://postgres:5432/keycloak
      - KC_DB_USERNAME=keycloak
      - KC_DB_PASSWORD=${KC_DB_PASSWORD}
    command: start-dev
    ports:
      - "8080:8080"
    depends_on:
      - postgres
    networks:
      - sso-network

  # PostgreSQL for Keycloak
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=keycloak
      - POSTGRES_USER=keycloak
      - POSTGRES_PASSWORD=${KC_DB_PASSWORD}
    volumes:
      - keycloak-db:/var/lib/postgresql/data
    networks:
      - sso-network

networks:
  sso-network:
    driver: bridge

volumes:
  keycloak-db:
```

## Testing and Validation

### 1. Verify Identity Provider Configuration

Check your identity provider's OpenID Connect discovery endpoint:

```bash
curl https://your-idp.com/realms/your-realm/.well-known/openid-configuration
```

This should return configuration including:
- `issuer`
- `authorization_endpoint`
- `token_endpoint`
- `userinfo_endpoint`
- `jwks_uri`

### 2. Test LibreChat SSO Login

1. Start LibreChat:
   ```bash
   docker compose up -d
   ```

2. Navigate to `http://localhost:3080`

3. Click the SSO login button (or auto-redirect if enabled)

4. Complete authentication with your identity provider

5. Verify you're redirected back to LibreChat and logged in

### 3. Check Logs

Monitor LibreChat logs for authentication events:

```bash
docker compose logs -f api | grep openidStrategy
```

Look for:
- `[openidStrategy] login success`
- Token exchange information
- User information retrieval

### 4. Verify User Roles

If using role-based access:

1. Check that users with required roles can log in
2. Verify users without required roles are denied
3. Confirm admin users have appropriate permissions

### 5. Test Token Refresh

1. Log in to LibreChat
2. Wait for token expiration (or use short-lived tokens for testing)
3. Verify automatic token refresh works
4. Check that you remain logged in

### 6. Test Logout

1. Log out from LibreChat
2. If `OPENID_USE_END_SESSION_ENDPOINT=true`, verify you're also logged out from the identity provider
3. Verify you cannot access protected resources

## Troubleshooting

### Common Issues

#### 1. "Invalid redirect URI" Error

**Problem**: The redirect URI configured in your client doesn't match the callback URL.

**Solution**:
- Verify `DOMAIN_SERVER + OPENID_CALLBACK_URL` matches your client configuration
- Ensure the identity provider allows the redirect URI
- Check for trailing slashes

Example:
```bash
# If DOMAIN_SERVER=http://localhost:3080
# And OPENID_CALLBACK_URL=/oauth/openid/callback
# Then redirect URI should be: http://localhost:3080/oauth/openid/callback
```

#### 2. "Email domain not allowed" Error

**Problem**: User's email domain is not in the allowed list.

**Solution**:
- Check `librechat.yaml` for `allowedDomains` configuration
- Add the user's domain to the allowed list:
  ```yaml
  registration:
    allowedDomains:
      - "yourdomain.com"
      - "example.com"
  ```

#### 3. Role-Based Access Denied

**Problem**: User has valid credentials but lacks required role.

**Solution**:
- Verify the role configuration matches your identity provider's token structure
- Check token claims:
  ```bash
  # Decode access token (use jwt.io or similar)
  echo $ACCESS_TOKEN | base64 -d
  ```
- Ensure `OPENID_REQUIRED_ROLE_PARAMETER_PATH` points to the correct claim path
- Verify the role exists in the token at the specified path

#### 4. Token Expired Immediately

**Problem**: User is logged out immediately after login.

**Solution**:
- Check system clock synchronization (token timestamps are sensitive)
- Increase `OPENID_CLOCK_TOLERANCE` (default: 300 seconds)
- Verify token expiration times in your identity provider
- Check `SESSION_EXPIRY` and `REFRESH_TOKEN_EXPIRY` settings

#### 5. Cannot Retrieve User Info

**Problem**: Authentication succeeds but user profile is incomplete.

**Solution**:
- Verify `OPENID_SCOPE` includes necessary scopes
- Check that the access token has permissions to access userinfo endpoint
- For Microsoft Graph, enable on-behalf-of flow:
  ```bash
  OPENID_ON_BEHALF_FLOW_FOR_USERINFO_REQUIRED=true
  OPENID_ON_BEHALF_FLOW_USERINFO_SCOPE="user.read"
  ```

#### 6. PKCE Errors

**Problem**: "Code challenge method not supported" or similar errors.

**Solution**:
- Verify your identity provider supports PKCE
- For AWS Cognito or similar providers that support S256 but don't advertise it:
  ```bash
  MCP_SKIP_CODE_CHALLENGE_CHECK=true
  ```

### Debug Mode

Enable detailed logging:

```bash
DEBUG_LOGGING=true
DEBUG_OPENID_REQUESTS=true
```

This will log:
- Request/response details
- Token exchange information
- User info retrieval
- Authentication flow steps

### Network Issues

If behind a proxy:

```bash
# Configure proxy for OpenID requests
PROXY=http://your-proxy:port

# For HTTPS proxies with custom CA certificates
NODE_EXTRA_CA_CERTS=/path/to/ca-cert.pem
```

### Health Check Endpoints

Verify LibreChat is running:

```bash
curl http://localhost:3080/api/config
```

This should return configuration including available authentication methods.

## Best Practices

1. **Security**
   - Use strong, unique secrets for all tokens and sessions
   - Enable PKCE for enhanced security
   - Use HTTPS in production
   - Regularly rotate secrets and credentials
   - Implement proper CORS policies

2. **Production Configuration**
   - Disable email/password login if using SSO exclusively
   - Set `ALLOW_REGISTRATION=false` to control user provisioning
   - Configure proper session and token expiration times
   - Enable token reuse to reduce identity provider load
   - Use Redis for session storage in multi-instance deployments

3. **Monitoring**
   - Monitor authentication success/failure rates
   - Track token refresh failures
   - Log suspicious authentication attempts
   - Set up alerts for configuration changes

4. **User Management**
   - Provision users through your identity provider
   - Use role-based access control
   - Implement proper group/team structures
   - Document user onboarding procedures

5. **Integration**
   - Document all client configurations in your identity provider
   - Maintain consistent role and claim structures across services
   - Test the complete authentication flow regularly
   - Keep all services updated

## Additional Resources

- [LibreChat Documentation](https://www.librechat.ai/docs)
- [OpenID Connect Core Specification](https://openid.net/specs/openid-connect-core-1_0.html)
- [OAuth 2.0 Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [Azure AD OpenID Connect](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-protocols-oidc)

## Support

For issues specific to LibreChat:
- GitHub Issues: https://github.com/danny-avila/LibreChat/issues
- Discord: https://discord.librechat.ai
- Documentation: https://docs.librechat.ai
