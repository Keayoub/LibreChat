#!/bin/bash

# SSO Setup Script for LibreChat
# This script helps configure Single Sign-On for LibreChat

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo ""
}

# Generate a secure random string
generate_secret() {
    # Check if node is available
    if command -v node &> /dev/null; then
        node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    elif command -v openssl &> /dev/null; then
        openssl rand -hex 32
    else
        print_error "Neither node nor openssl found. Please install one to generate secrets."
        exit 1
    fi
}

# Check if .env file exists
check_env_file() {
    if [ -f .env ]; then
        print_warning ".env file already exists"
        read -p "Do you want to backup the existing .env file? (y/n): " backup
        if [ "$backup" = "y" ] || [ "$backup" = "Y" ]; then
            cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
            print_success "Backup created"
        fi
        return 0
    else
        print_info "No existing .env file found"
        return 1
    fi
}

# Create .env from example
create_env_from_example() {
    if [ -f .env.sso.example ]; then
        cp .env.sso.example .env
        print_success "Created .env from .env.sso.example"
    elif [ -f .env.example ]; then
        cp .env.example .env
        print_success "Created .env from .env.example"
    else
        print_error "No example .env file found"
        exit 1
    fi
}

# Update or add environment variable
update_env_var() {
    local key=$1
    local value=$2
    local env_file=${3:-.env}
    
    # Escape special characters for sed
    local escaped_value=$(printf '%s\n' "$value" | sed 's/[[\.*^$/]/\\&/g')
    
    if grep -q "^${key}=" "$env_file"; then
        # Update existing variable - use @ as delimiter to avoid issues with /
        sed -i.bak "s@^${key}=.*@${key}=${escaped_value}@" "$env_file" && rm "${env_file}.bak"
    else
        # Add new variable
        echo "${key}=${value}" >> "$env_file"
    fi
}

# Main configuration function
configure_sso() {
    print_header "LibreChat SSO Configuration"
    
    # Check for existing .env
    if ! check_env_file; then
        create_env_from_example
    fi
    
    print_info "This script will help you configure OpenID Connect (SSO) for LibreChat"
    echo ""
    
    # Get OpenID Connect configuration
    print_header "OpenID Connect Provider Configuration"
    
    read -p "Enter your OpenID Issuer URL (e.g., https://auth.example.com/realms/myrealm): " issuer
    if [ -z "$issuer" ]; then
        print_error "Issuer URL is required"
        exit 1
    fi
    
    read -p "Enter your OpenID Client ID: " client_id
    if [ -z "$client_id" ]; then
        print_error "Client ID is required"
        exit 1
    fi
    
    read -sp "Enter your OpenID Client Secret: " client_secret
    echo ""
    if [ -z "$client_secret" ]; then
        print_error "Client Secret is required"
        exit 1
    fi
    
    # Generate secrets if needed
    print_info "Generating secure secrets..."
    jwt_secret=$(generate_secret)
    jwt_refresh_secret=$(generate_secret)
    openid_session_secret=$(generate_secret)
    
    # Get domain configuration
    print_header "Domain Configuration"
    
    read -p "Enter your domain (e.g., http://localhost:3080 or https://chat.example.com): " domain
    if [ -z "$domain" ]; then
        domain="http://localhost:3080"
        print_info "Using default domain: $domain"
    fi
    
    # Optional configuration
    print_header "Optional Configuration"
    
    read -p "Enter SSO button label (press Enter for 'Sign in with SSO'): " button_label
    button_label=${button_label:-"Sign in with SSO"}
    
    read -p "Enable auto-redirect to SSO? (y/n, default: n): " auto_redirect
    if [ "$auto_redirect" = "y" ] || [ "$auto_redirect" = "Y" ]; then
        auto_redirect="true"
    else
        auto_redirect="false"
    fi
    
    read -p "Enable PKCE? (y/n, default: y): " use_pkce
    if [ "$use_pkce" = "n" ] || [ "$use_pkce" = "N" ]; then
        use_pkce="false"
    else
        use_pkce="true"
    fi
    
    # Update .env file
    print_header "Updating Configuration"
    
    update_env_var "DOMAIN_CLIENT" "$domain"
    update_env_var "DOMAIN_SERVER" "$domain"
    update_env_var "OPENID_ISSUER" "$issuer"
    update_env_var "OPENID_CLIENT_ID" "$client_id"
    update_env_var "OPENID_CLIENT_SECRET" "$client_secret"
    update_env_var "OPENID_SESSION_SECRET" "$openid_session_secret"
    update_env_var "OPENID_SCOPE" "\"openid profile email\""
    update_env_var "OPENID_CALLBACK_URL" "/oauth/openid/callback"
    update_env_var "OPENID_BUTTON_LABEL" "\"$button_label\""
    update_env_var "OPENID_AUTO_REDIRECT" "$auto_redirect"
    update_env_var "OPENID_USE_PKCE" "$use_pkce"
    update_env_var "JWT_SECRET" "$jwt_secret"
    update_env_var "JWT_REFRESH_SECRET" "$jwt_refresh_secret"
    update_env_var "ALLOW_SOCIAL_LOGIN" "true"
    
    print_success "Configuration updated successfully!"
    
    # Display summary
    print_header "Configuration Summary"
    
    echo "OpenID Issuer: $issuer"
    echo "Client ID: $client_id"
    echo "Domain: $domain"
    echo "Button Label: $button_label"
    echo "Auto-redirect: $auto_redirect"
    echo "PKCE: $use_pkce"
    echo ""
    echo "Callback URL: ${domain}/oauth/openid/callback"
    echo ""
    print_warning "Important: Make sure to add the callback URL to your identity provider's"
    print_warning "allowed redirect URIs: ${domain}/oauth/openid/callback"
    echo ""
    
    # Verify identity provider
    print_header "Verifying Identity Provider Configuration"
    
    print_info "Attempting to fetch OpenID configuration..."
    well_known_url="${issuer}/.well-known/openid-configuration"
    
    if command -v curl &> /dev/null; then
        if curl -sf "$well_known_url" > /dev/null 2>&1; then
            print_success "Successfully connected to identity provider"
            print_info "Discovery endpoint: $well_known_url"
        else
            print_warning "Could not connect to identity provider"
            print_info "Please verify your issuer URL: $issuer"
            print_info "Discovery endpoint should be accessible at: $well_known_url"
        fi
    else
        print_info "curl not found, skipping verification"
        print_info "Please manually verify: $well_known_url"
    fi
    
    # Next steps
    print_header "Next Steps"
    
    echo "1. Configure your identity provider:"
    echo "   - Add callback URL: ${domain}/oauth/openid/callback"
    echo "   - Ensure client has appropriate scopes: openid, profile, email"
    echo "   - Configure any required roles or claims"
    echo ""
    echo "2. Start LibreChat:"
    echo "   docker compose up -d"
    echo "   OR"
    echo "   npm run backend (for development)"
    echo ""
    echo "3. Test the SSO login:"
    echo "   - Navigate to $domain"
    echo "   - Click the SSO login button"
    echo "   - Complete authentication"
    echo ""
    echo "4. Monitor logs for any issues:"
    echo "   docker compose logs -f api | grep openidStrategy"
    echo ""
    echo "5. Review the documentation:"
    echo "   docs/SSO_CONFIGURATION.md"
    echo ""
    
    print_success "SSO configuration complete!"
}

# Additional utility functions

# Test SSO configuration
test_sso_config() {
    print_header "Testing SSO Configuration"
    
    if [ ! -f .env ]; then
        print_error ".env file not found. Please run configuration first."
        exit 1
    fi
    
    # Safely source .env file
    set -a
    # shellcheck disable=SC1091
    source .env 2>/dev/null || true
    set +a
    
    # Check required variables
    required_vars=("OPENID_ISSUER" "OPENID_CLIENT_ID" "OPENID_CLIENT_SECRET" "OPENID_SESSION_SECRET")
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        print_error "Missing required variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi
    
    print_success "All required variables are set"
    
    # Test connection to issuer
    if command -v curl &> /dev/null; then
        print_info "Testing connection to identity provider..."
        well_known_url="${OPENID_ISSUER}/.well-known/openid-configuration"
        
        if response=$(curl -sf "$well_known_url" 2>&1); then
            print_success "Successfully connected to identity provider"
            
            # Parse and display some configuration
            if command -v jq &> /dev/null; then
                echo ""
                print_info "OpenID Configuration:"
                echo "$response" | jq '{issuer, authorization_endpoint, token_endpoint, userinfo_endpoint}'
            fi
        else
            print_error "Failed to connect to identity provider"
            print_info "URL: $well_known_url"
        fi
    fi
    
    # Display callback URL
    echo ""
    print_info "Callback URL: ${DOMAIN_SERVER}${OPENID_CALLBACK_URL}"
    print_warning "Ensure this URL is configured in your identity provider"
}

# Show help
show_help() {
    cat << EOF
LibreChat SSO Setup Script

Usage: $0 [command]

Commands:
    configure    Configure SSO for LibreChat (default)
    test         Test current SSO configuration
    help         Show this help message

Examples:
    $0                    # Run interactive configuration
    $0 configure          # Run interactive configuration
    $0 test              # Test current configuration

For more information, see docs/SSO_CONFIGURATION.md

EOF
}

# Main script logic
case "${1:-configure}" in
    configure)
        configure_sso
        ;;
    test)
        test_sso_config
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
