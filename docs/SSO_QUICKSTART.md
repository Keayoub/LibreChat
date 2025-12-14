# SSO Quick Start Guide

Get LibreChat up and running with Single Sign-On in minutes!

## Prerequisites

- Docker and Docker Compose installed
- An OpenID Connect identity provider (or use the included Keycloak setup)

## Option 1: Quick Start with Keycloak (All-in-One)

This is the fastest way to get started with SSO.

### Step 1: Clone and Navigate

```bash
cd /path/to/LibreChat
```

### Step 2: Create Environment File

```bash
cp .env.sso.example .env
```

### Step 3: Generate Secrets

Run these commands to generate secure secrets:

```bash
# Generate JWT secret
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT refresh secret
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate OpenID session secret
node -e "console.log('OPENID_SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate Keycloak admin password
node -e "console.log('KEYCLOAK_ADMIN_PASSWORD=' + require('crypto').randomBytes(16).toString('hex'))"

# Generate Keycloak database password
node -e "console.log('KC_DB_PASSWORD=' + require('crypto').randomBytes(16).toString('hex'))"
```

Copy these generated values into your `.env` file, replacing the placeholder values.

### Step 4: Configure Docker Compose Override

Create a `docker-compose.override.yml` file based on the example:

```bash
cp docker-compose.override.yml.example docker-compose.override.yml
```

Edit the file and uncomment the SSO sections you need (see examples in the file).

### Step 5: Start Services

```bash
docker compose up -d
```

### Step 5: Configure Keycloak

1. Wait for services to start (30-60 seconds)
2. Access Keycloak: http://localhost:8080
3. Login with `admin` / `<your KEYCLOAK_ADMIN_PASSWORD>`
4. Create a realm named `tifinia`
5. Create a client:
   - Client ID: `librechat`
   - Root URL: `http://localhost:3080`
   - Valid redirect URIs: `http://localhost:3080/oauth/openid/callback`
   - Access Type: `confidential`
6. Save and copy the client secret from Credentials tab
7. Update `.env`:
   ```bash
   OPENID_CLIENT_ID=librechat
   OPENID_CLIENT_SECRET=<paste-client-secret>
   OPENID_ISSUER=http://keycloak:8080/realms/tifinia
   ```

### Step 6: Restart LibreChat

```bash
docker compose restart api
```

### Step 7: Create a Test User

1. In Keycloak, go to Users → Add user
2. Set username and email
3. Go to Credentials tab → Set password
4. Uncheck "Temporary"
5. Save

### Step 8: Test Login

1. Navigate to http://localhost:3080
2. Click "Sign in with SSO"
3. Login with your test user
4. Success! 🎉

## Option 2: Use Existing Identity Provider

If you already have an OpenID Connect provider (Auth0, Azure AD, Okta, etc.):

### Step 1: Run Setup Script

```bash
./scripts/setup-sso.sh
```

Follow the interactive prompts to configure your settings.

### Step 2: Start LibreChat

```bash
docker compose up -d
```

### Step 3: Test

Navigate to your LibreChat URL and click "Sign in with SSO"

## Option 3: Manual Configuration

### Step 1: Create .env File

```bash
# Server Configuration
DOMAIN_CLIENT=http://localhost:3080
DOMAIN_SERVER=http://localhost:3080

# MongoDB
MONGO_URI=mongodb://mongodb:27017/LibreChat

# OpenID Connect
OPENID_CLIENT_ID=your-client-id
OPENID_CLIENT_SECRET=your-client-secret
OPENID_ISSUER=https://your-idp.com/realms/your-realm
OPENID_SESSION_SECRET=generate-with-node-crypto-command
OPENID_SCOPE="openid profile email"
OPENID_CALLBACK_URL=/oauth/openid/callback
OPENID_USE_PKCE=true

# JWT Secrets (generate using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=generate-with-node-crypto-command
JWT_REFRESH_SECRET=generate-with-node-crypto-command

# Authentication
ALLOW_SOCIAL_LOGIN=true
```

### Step 2: Configure Redirect URI

In your identity provider, add this redirect URI:
```
http://localhost:3080/oauth/openid/callback
```

### Step 3: Start Services

```bash
docker compose up -d
```

## Verification

### Check Configuration

```bash
# Test if OpenID discovery endpoint is accessible
curl http://localhost:8080/realms/tifinia/.well-known/openid-configuration

# Check LibreChat config endpoint
curl http://localhost:3080/api/config
```

### Check Logs

```bash
# LibreChat logs
docker compose logs -f api | grep openidStrategy

# Look for successful connection messages
```

## Common Quick Fixes

### Issue: "Invalid redirect URI"

**Fix**: Ensure the redirect URI in your identity provider exactly matches:
```
<DOMAIN_SERVER><OPENID_CALLBACK_URL>
```

Example: `http://localhost:3080/oauth/openid/callback`

### Issue: "Cannot connect to identity provider"

**Fix**: 
- If using Docker, use service name instead of localhost
- Change `OPENID_ISSUER=http://localhost:8080/...` 
- To: `OPENID_ISSUER=http://keycloak:8080/...`

### Issue: "Token validation failed"

**Fix**: Check system clock synchronization:
```bash
# Linux/Mac
date

# If time is off, synchronize
sudo ntpdate -s time.nist.gov
```

### Issue: User can login but has no access

**Fix**: Check role configuration in `.env`:
```bash
# Remove role restrictions for testing
# Comment out these lines:
# OPENID_REQUIRED_ROLE=
# OPENID_REQUIRED_ROLE_TOKEN_KIND=
# OPENID_REQUIRED_ROLE_PARAMETER_PATH=
```

## Next Steps

Once SSO is working:

1. **Configure additional services** (LiteLLM, OpenWebUI, etc.)
   - See [SSO Integration Guide](./SSO_INTEGRATION_GUIDE.md)

2. **Set up role-based access control**
   - See [SSO Configuration](./SSO_CONFIGURATION.md#role-based-access-control)

3. **Configure production settings**
   - Use HTTPS
   - Set proper domain names
   - Configure secrets management
   - Enable session storage with Redis

4. **Add more users**
   - Create users in your identity provider
   - Assign appropriate roles
   - Test access

## Useful Commands

```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f librechat-api
docker compose logs -f keycloak

# Restart a service
docker compose restart librechat-api

# Stop all services
docker compose down

# Clean up (WARNING: Removes all data)
docker compose down -v

# Check service status
docker compose ps

# Generate a secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Test configuration script
./scripts/setup-sso.sh test
```

## Resources

- Full configuration guide: [SSO_CONFIGURATION.md](./SSO_CONFIGURATION.md)
- Multi-service integration: [SSO_INTEGRATION_GUIDE.md](./SSO_INTEGRATION_GUIDE.md)
- LibreChat documentation: https://docs.librechat.ai

## Getting Help

If you encounter issues:

1. Check the logs: `docker compose logs -f api`
2. Enable debug mode: `DEBUG_OPENID_REQUESTS=true`
3. Review [Troubleshooting](./SSO_CONFIGURATION.md#troubleshooting) section
4. Ask on Discord: https://discord.librechat.ai
5. Open an issue: https://github.com/danny-avila/LibreChat/issues

---

**Need help?** Join our community:
- Discord: https://discord.librechat.ai
- GitHub Discussions: https://github.com/danny-avila/LibreChat/discussions
