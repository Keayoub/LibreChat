# SSO Integration Guide for Multiple Services

This guide provides step-by-step instructions for configuring SSO across multiple services including LibreChat, LiteLLM, OpenWebUI, and SIM Studio using a centralized identity provider.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Identity Provider Setup](#identity-provider-setup)
4. [LibreChat Configuration](#librechat-configuration)
5. [LiteLLM Configuration](#litellm-configuration)
6. [OpenWebUI Configuration](#openwebui-configuration)
7. [SIM Studio Configuration](#sim-studio-configuration)
8. [Testing the Integration](#testing-the-integration)
9. [Troubleshooting](#troubleshooting)

## Architecture Overview

```
                    ┌─────────────────────────────────┐
                    │  Identity Provider (Keycloak)   │
                    │  - Centralized Authentication   │
                    │  - User Management              │
                    │  - Role-Based Access Control    │
                    └────────────┬────────────────────┘
                                 │
                                 │ OpenID Connect
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────┐        ┌───────────────┐      ┌───────────────┐
│  LibreChat    │        │   LiteLLM     │      │  OpenWebUI    │
│  Port: 3080   │        │   Port: 4000  │      │  Port: 8080   │
│               │        │               │      │               │
│  - AI Chat UI │        │  - LLM Proxy  │      │  - Chat UI    │
│  - Multi-Model│        │  - Cost Track │      │  - Local LLMs │
└───────────────┘        └───────────────┘      └───────────────┘
                                 │
                                 ▼
                         ┌───────────────┐
                         │  SIM Studio   │
                         │               │
                         │  - Simulator  │
                         └───────────────┘
```

## Prerequisites

Before starting, ensure you have:

1. **Docker and Docker Compose** installed
2. **Node.js** (v18 or higher) if running locally
3. **An identity provider** (Keycloak, Auth0, Azure AD, Okta, etc.)
4. **Domain names or localhost** for each service
5. **SSL certificates** (recommended for production)

## Identity Provider Setup

We'll use Keycloak as an example, but the principles apply to any OpenID Connect provider.

### 1. Install Keycloak

Using Docker:

```bash
docker run -d \
  --name keycloak \
  -p 8080:8080 \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:latest \
  start-dev
```

### 2. Create a Realm

1. Access Keycloak at `http://localhost:8080`
2. Login with admin credentials
3. Click **Create Realm**
4. Name it `tifinia` (or your organization name)
5. Click **Create**

### 3. Create Clients for Each Service

#### LibreChat Client

1. Go to **Clients** → **Create client**
2. Configure:
   - **Client ID**: `librechat`
   - **Client Protocol**: `openid-connect`
   - **Root URL**: `http://localhost:3080`
3. In **Settings**:
   - **Valid redirect URIs**: `http://localhost:3080/oauth/openid/callback`
   - **Web origins**: `http://localhost:3080`
   - **Access Type**: `confidential`
4. Save and note the **Client Secret** from the **Credentials** tab

#### LiteLLM Client

1. Create another client with:
   - **Client ID**: `litellm`
   - **Root URL**: `http://localhost:4000`
   - **Valid redirect URIs**: `http://localhost:4000/sso/callback`
   - **Web origins**: `http://localhost:4000`
2. Save the client secret

#### OpenWebUI Client

1. Create client:
   - **Client ID**: `openwebui`
   - **Root URL**: `http://localhost:8080`
   - **Valid redirect URIs**: `http://localhost:8080/oauth/oidc/callback`
   - **Web origins**: `http://localhost:8080`
2. Save the client secret

#### SIM Studio Client

1. Create client:
   - **Client ID**: `simstudio`
   - **Root URL**: `http://localhost:9000` (adjust as needed)
   - **Valid redirect URIs**: Configure according to SIM Studio documentation
2. Save the client secret

### 4. Create Roles

1. Go to **Realm roles** → **Create role**
2. Create the following roles:
   - `user` - Basic user access
   - `admin` - Administrator access
   - `librechat-user` - LibreChat access
   - `litellm-user` - LiteLLM access
   - `openwebui-user` - OpenWebUI access
   - `simstudio-user` - SIM Studio access

### 5. Create Users

1. Go to **Users** → **Add user**
2. Set username, email, and other details
3. In **Credentials** tab, set password
4. In **Role Mapping** tab, assign appropriate roles

### 6. Configure Client Scopes (Optional but Recommended)

1. Go to **Client scopes** → Create scopes for fine-grained access
2. Assign scopes to clients as needed

## LibreChat Configuration

### Using Environment Variables

Create or update your `.env` file:

```bash
# Domain Configuration
DOMAIN_CLIENT=http://localhost:3080
DOMAIN_SERVER=http://localhost:3080

# MongoDB
MONGO_URI=mongodb://mongodb:27017/LibreChat

# OpenID Connect Configuration
OPENID_CLIENT_ID=librechat
OPENID_CLIENT_SECRET=your-librechat-client-secret
OPENID_ISSUER=http://localhost:8080/realms/tifinia
OPENID_SESSION_SECRET=generate-random-32-char-string
OPENID_SCOPE="openid profile email"
OPENID_CALLBACK_URL=/oauth/openid/callback
OPENID_BUTTON_LABEL="Sign in with SSO"
OPENID_USE_PKCE=true

# Role-Based Access (Optional)
OPENID_REQUIRED_ROLE=librechat-user
OPENID_REQUIRED_ROLE_TOKEN_KIND=access
OPENID_REQUIRED_ROLE_PARAMETER_PATH=realm_access.roles

# JWT Secrets
JWT_SECRET=generate-random-32-char-string
JWT_REFRESH_SECRET=generate-random-32-char-string

# Authentication Control
ALLOW_EMAIL_LOGIN=false
ALLOW_REGISTRATION=false
ALLOW_SOCIAL_LOGIN=true
```

### Using the Setup Script

```bash
cd /path/to/LibreChat
./scripts/setup-sso.sh configure
```

Follow the prompts to configure SSO.

### Start LibreChat

```bash
docker compose up -d
```

Or for development:

```bash
npm run backend
```

## LiteLLM Configuration

### Create LiteLLM Configuration

Create `litellm/litellm-config.yaml`:

```yaml
model_list:
  - model_name: gpt-4
    litellm_params:
      model: openai/gpt-4
      api_key: os.environ/OPENAI_API_KEY
  
  - model_name: claude-3
    litellm_params:
      model: anthropic/claude-3-opus-20240229
      api_key: os.environ/ANTHROPIC_API_KEY

general_settings:
  master_key: your-master-key-here
  database_url: sqlite:///litellm.db
  
  # SSO Configuration
  ui_oauth_provider: openid
  oidc_issuer: http://keycloak:8080/realms/tifinia
  oidc_client_id: litellm
  oidc_client_secret: your-litellm-client-secret
  oidc_scopes: ["openid", "profile", "email"]
```

### Environment Variables

Create `litellm/.env`:

```bash
LITELLM_MASTER_KEY=your-master-key-here
UI_OAUTH_PROVIDER=openid
OIDC_ISSUER=http://keycloak:8080/realms/tifinia
OIDC_CLIENT_ID=litellm
OIDC_CLIENT_SECRET=your-litellm-client-secret
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
```

### Docker Compose

Add to your `docker-compose.yml`:

```yaml
services:
  litellm:
    image: ghcr.io/berriai/litellm:main-latest
    container_name: litellm
    volumes:
      - ./litellm/litellm-config.yaml:/app/config.yaml
    ports:
      - "4000:8000"
    command: ["--config", "/app/config.yaml", "--port", "8000"]
    environment:
      - LITELLM_MASTER_KEY=${LITELLM_MASTER_KEY}
      - UI_OAUTH_PROVIDER=openid
      - OIDC_ISSUER=http://keycloak:8080/realms/tifinia
      - OIDC_CLIENT_ID=litellm
      - OIDC_CLIENT_SECRET=${LITELLM_CLIENT_SECRET}
    networks:
      - sso-network
```

## OpenWebUI Configuration

### Environment Variables

Create `openwebui/.env`:

```bash
# SSO Configuration
ENABLE_OAUTH_SIGNUP=true
OAUTH_PROVIDER_NAME=SSO
OPENID_PROVIDER_URL=http://keycloak:8080/realms/tifinia/.well-known/openid-configuration
OAUTH_CLIENT_ID=openwebui
OAUTH_CLIENT_SECRET=your-openwebui-client-secret
OAUTH_SCOPES=openid profile email

# Optional: Merge accounts with same email
ENABLE_OAUTH_ROLE_MANAGEMENT=true
OAUTH_ROLE_CLAIM=realm_access.roles
OAUTH_ADMIN_ROLE=admin
```

### Docker Compose

Add to your `docker-compose.yml`:

```yaml
services:
  openwebui:
    image: ghcr.io/open-webui/open-webui:main
    container_name: openwebui
    ports:
      - "8080:8080"
    volumes:
      - openwebui-data:/app/backend/data
    environment:
      - ENABLE_OAUTH_SIGNUP=true
      - OAUTH_PROVIDER_NAME=SSO
      - OPENID_PROVIDER_URL=http://keycloak:8080/realms/tifinia/.well-known/openid-configuration
      - OAUTH_CLIENT_ID=openwebui
      - OAUTH_CLIENT_SECRET=${OPENWEBUI_CLIENT_SECRET}
      - OAUTH_SCOPES=openid profile email
    networks:
      - sso-network
    restart: always
```

## SIM Studio Configuration

SIM Studio configuration will depend on your specific setup. Generally, you'll need to:

### 1. Locate SIM Studio Configuration

Find the configuration file (usually `config.yaml`, `settings.ini`, or similar).

### 2. Add OpenID Connect Settings

Example configuration (adapt to your SIM Studio version):

```yaml
authentication:
  type: openid
  openid:
    issuer: http://localhost:8080/realms/tifinia
    client_id: simstudio
    client_secret: your-simstudio-client-secret
    redirect_uri: http://localhost:9000/auth/callback
    scopes:
      - openid
      - profile
      - email
    
    # Optional: Role mapping
    role_claim: realm_access.roles
    admin_role: admin
    user_role: simstudio-user
```

### 3. Environment Variables

If SIM Studio uses environment variables:

```bash
SIMSTUDIO_AUTH_TYPE=openid
SIMSTUDIO_OIDC_ISSUER=http://localhost:8080/realms/tifinia
SIMSTUDIO_OIDC_CLIENT_ID=simstudio
SIMSTUDIO_OIDC_CLIENT_SECRET=your-simstudio-client-secret
```

**Note**: Consult SIM Studio's official documentation for the exact configuration method.

## Testing the Integration

### 1. Test Individual Service Login

#### Test LibreChat

1. Navigate to `http://localhost:3080`
2. Click "Sign in with SSO"
3. Login with Keycloak credentials
4. Verify successful login

#### Test LiteLLM

1. Navigate to `http://localhost:4000`
2. SSO should redirect automatically or show SSO button
3. Login with the same Keycloak credentials
4. Verify access to LiteLLM dashboard

#### Test OpenWebUI

1. Navigate to `http://localhost:8080`
2. Click SSO login option
3. Login with Keycloak credentials
4. Verify successful login

#### Test SIM Studio

1. Navigate to SIM Studio URL
2. Use SSO login
3. Verify authentication

### 2. Test Single Sign-On Behavior

1. Login to one service (e.g., LibreChat)
2. Open another service in a new tab (e.g., LiteLLM)
3. You should be automatically logged in without re-entering credentials
4. This confirms SSO is working correctly

### 3. Test Single Logout

1. Logout from one service
2. Check if you're logged out from other services
3. Enable `OPENID_USE_END_SESSION_ENDPOINT=true` in LibreChat for proper logout

### 4. Test Role-Based Access

1. Create a test user with only `librechat-user` role
2. Verify they can access LibreChat
3. Verify they cannot access services requiring other roles

## Troubleshooting

### Common Issues

#### 1. Redirect URI Mismatch

**Error**: "Invalid redirect URI" or "redirect_uri_mismatch"

**Solution**:
- Verify redirect URIs in Keycloak match exactly
- Check for trailing slashes
- Ensure protocol (http/https) matches
- Example: `http://localhost:3080/oauth/openid/callback`

#### 2. CORS Errors

**Error**: CORS policy blocking requests

**Solution**:
- Add web origins in Keycloak client configuration
- For LibreChat: `http://localhost:3080`
- For LiteLLM: `http://localhost:4000`
- For OpenWebUI: `http://localhost:8080`

#### 3. Token Validation Failures

**Error**: "Invalid token" or "Token expired"

**Solution**:
- Check system clock synchronization across all services
- Verify issuer URL is accessible from all services
- Ensure token expiration times are reasonable
- Check `OPENID_CLOCK_TOLERANCE` setting

#### 4. Network Connectivity Issues

**Error**: Cannot connect to identity provider

**Solution**:
- Ensure all services are on the same Docker network
- Use service names for internal communication (e.g., `keycloak:8080` not `localhost:8080`)
- Check firewall rules
- Verify DNS resolution

#### 5. Role-Based Access Not Working

**Error**: User can't access service despite having correct role

**Solution**:
- Verify role claim path in token
- Check token structure using jwt.io
- Ensure `OPENID_REQUIRED_ROLE_PARAMETER_PATH` is correct
- Example for Keycloak: `realm_access.roles`

### Debug Mode

Enable detailed logging for all services:

**LibreChat**:
```bash
DEBUG_LOGGING=true
DEBUG_OPENID_REQUESTS=true
```

**LiteLLM**:
```bash
LITELLM_LOG=DEBUG
```

**Keycloak**:
- Set log level to DEBUG in Keycloak admin console

### Testing Tools

1. **JWT Decoder**: https://jwt.io - Decode and inspect tokens
2. **OpenID Connect Debugger**: https://oidcdebugger.com
3. **Postman**: Test OAuth flows manually
4. **curl**: Test endpoints directly

```bash
# Test OpenID configuration endpoint
curl http://localhost:8080/realms/tifinia/.well-known/openid-configuration

# Test if service is accessible
curl http://localhost:3080/api/config
```

## Production Considerations

### 1. Security

- **Use HTTPS** for all services
- **Secure secrets** using environment variables or secret management
- **Regular security updates** for all components
- **Enable rate limiting** on authentication endpoints
- **Monitor failed login attempts**
- **Implement proper session management**

### 2. High Availability

- **Load balancing** for multiple instances
- **Shared session storage** using Redis
- **Database replication** for Keycloak
- **Health checks** for all services

### 3. Monitoring

- **Log aggregation** (ELK, Splunk, etc.)
- **Metrics collection** (Prometheus, Grafana)
- **Alerting** for authentication failures
- **Audit logging** for security events

### 4. Backup and Disaster Recovery

- **Regular backups** of Keycloak database
- **Backup secrets** and configurations
- **Document recovery procedures**
- **Test recovery regularly**

## Complete Docker Compose Example

Here's a complete `docker-compose.yml` for all services:

```yaml
version: '3.8'

networks:
  sso-network:
    driver: bridge

volumes:
  mongodb-data:
  keycloak-db-data:
  openwebui-data:
  meilisearch-data:

services:
  # Keycloak Identity Provider
  keycloak:
    image: quay.io/keycloak/keycloak:latest
    container_name: keycloak
    environment:
      - KEYCLOAK_ADMIN=admin
      - KEYCLOAK_ADMIN_PASSWORD=${KEYCLOAK_ADMIN_PASSWORD}
      - KC_DB=postgres
      - KC_DB_URL=jdbc:postgresql://keycloak-db:5432/keycloak
      - KC_DB_USERNAME=keycloak
      - KC_DB_PASSWORD=${KC_DB_PASSWORD}
      - KC_HOSTNAME=localhost
      - KC_HTTP_ENABLED=true
    command: start-dev
    ports:
      - "8080:8080"
    depends_on:
      - keycloak-db
    networks:
      - sso-network
    restart: always

  keycloak-db:
    image: postgres:15-alpine
    container_name: keycloak-db
    environment:
      - POSTGRES_DB=keycloak
      - POSTGRES_USER=keycloak
      - POSTGRES_PASSWORD=${KC_DB_PASSWORD}
    volumes:
      - keycloak-db-data:/var/lib/postgresql/data
    networks:
      - sso-network
    restart: always

  # LibreChat
  librechat-api:
    image: ghcr.io/danny-avila/librechat-dev-api:latest
    container_name: librechat-api
    ports:
      - "3080:3080"
    environment:
      - OPENID_CLIENT_ID=librechat
      - OPENID_CLIENT_SECRET=${LIBRECHAT_CLIENT_SECRET}
      - OPENID_ISSUER=http://keycloak:8080/realms/tifinia
      - OPENID_SESSION_SECRET=${OPENID_SESSION_SECRET}
      - OPENID_SCOPE=openid profile email
      - OPENID_CALLBACK_URL=/oauth/openid/callback
      - OPENID_USE_PKCE=true
      - DOMAIN_CLIENT=http://localhost:3080
      - DOMAIN_SERVER=http://localhost:3080
      - MONGO_URI=mongodb://mongodb:27017/LibreChat
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - ALLOW_SOCIAL_LOGIN=true
    depends_on:
      - mongodb
      - keycloak
    networks:
      - sso-network
    restart: always

  mongodb:
    image: mongo:7.0
    container_name: mongodb
    volumes:
      - mongodb-data:/data/db
    networks:
      - sso-network
    restart: always

  # LiteLLM
  litellm:
    image: ghcr.io/berriai/litellm:main-latest
    container_name: litellm
    ports:
      - "4000:8000"
    volumes:
      - ./litellm/litellm-config.yaml:/app/config.yaml
    command: ["--config", "/app/config.yaml", "--port", "8000"]
    environment:
      - UI_OAUTH_PROVIDER=openid
      - OIDC_ISSUER=http://keycloak:8080/realms/tifinia
      - OIDC_CLIENT_ID=litellm
      - OIDC_CLIENT_SECRET=${LITELLM_CLIENT_SECRET}
    depends_on:
      - keycloak
    networks:
      - sso-network
    restart: always

  # OpenWebUI
  openwebui:
    image: ghcr.io/open-webui/open-webui:main
    container_name: openwebui
    ports:
      - "8081:8080"
    volumes:
      - openwebui-data:/app/backend/data
    environment:
      - ENABLE_OAUTH_SIGNUP=true
      - OAUTH_PROVIDER_NAME=SSO
      - OPENID_PROVIDER_URL=http://keycloak:8080/realms/tifinia/.well-known/openid-configuration
      - OAUTH_CLIENT_ID=openwebui
      - OAUTH_CLIENT_SECRET=${OPENWEBUI_CLIENT_SECRET}
      - OAUTH_SCOPES=openid profile email
    depends_on:
      - keycloak
    networks:
      - sso-network
    restart: always
```

## Additional Resources

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [OpenID Connect Specification](https://openid.net/connect/)
- [LibreChat SSO Configuration](./SSO_CONFIGURATION.md)
- [LiteLLM Documentation](https://docs.litellm.ai/)
- [OpenWebUI Documentation](https://docs.openwebui.com/)

## Support

For issues with specific services:
- **LibreChat**: https://github.com/danny-avila/LibreChat/issues
- **LiteLLM**: https://github.com/BerriAI/litellm/issues
- **OpenWebUI**: https://github.com/open-webui/open-webui/issues
- **Keycloak**: https://github.com/keycloak/keycloak/discussions
