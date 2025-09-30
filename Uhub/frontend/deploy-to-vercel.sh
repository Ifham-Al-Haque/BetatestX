#!/bin/bash

# UHub Vercel Deployment Script
# This script helps prepare and deploy UHub to Vercel

echo "🚀 UHub Vercel Deployment Script"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the UHub project root directory."
    exit 1
fi

print_status "Starting deployment preparation..."

# Step 1: Check if required files exist
print_status "Checking required files..."

required_files=(
    "src/"
    "public/"
    "package.json"
    "tailwind.config.js"
    "postcss.config.js"
)

for file in "${required_files[@]}"; do
    if [ ! -e "$file" ]; then
        print_error "Required file/directory not found: $file"
        exit 1
    fi
done

print_success "All required files found"

# Step 2: Install dependencies
print_status "Installing dependencies..."
if npm ci; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Step 3: Run build test
print_status "Testing build process..."
if npm run build; then
    print_success "Build test successful"
else
    print_error "Build test failed. Please fix build errors before deploying."
    exit 1
fi

# Step 4: Check environment variables
print_status "Checking environment variables..."

if [ ! -f ".env.local" ]; then
    print_warning ".env.local not found. Creating from template..."
    if [ -f "env.production.template" ]; then
        cp env.production.template .env.local
        print_warning "Please update .env.local with your actual values before deploying"
    else
        print_error "env.production.template not found"
        exit 1
    fi
fi

# Check for required environment variables
required_vars=(
    "REACT_APP_SUPABASE_URL"
    "REACT_APP_SUPABASE_ANON_KEY"
)

for var in "${required_vars[@]}"; do
    if ! grep -q "^$var=" .env.local; then
        print_warning "Environment variable $var not found in .env.local"
    fi
done

# Step 5: Prepare Vercel configuration
print_status "Preparing Vercel configuration..."

if [ ! -f "vercel.json" ]; then
    if [ -f "vercel-production.json" ]; then
        cp vercel-production.json vercel.json
        print_success "Created vercel.json from template"
    else
        print_warning "vercel.json not found. You may need to create one manually."
    fi
fi

# Step 6: Create .gitignore if needed
if [ ! -f ".gitignore" ]; then
    if [ -f ".gitignore.vercel" ]; then
        cp .gitignore.vercel .gitignore
        print_success "Created .gitignore from template"
    fi
fi

# Step 7: Check for common issues
print_status "Running pre-deployment checks..."

# Check for console.log statements in production build
if grep -r "console\.log" build/ 2>/dev/null; then
    print_warning "Found console.log statements in build. Consider removing them for production."
fi

# Check build size
build_size=$(du -sh build/ | cut -f1)
print_status "Build size: $build_size"

if [ -d "build" ]; then
    print_success "Build directory created successfully"
else
    print_error "Build directory not found"
    exit 1
fi

# Step 8: Display next steps
echo ""
print_success "Deployment preparation completed!"
echo ""
echo "Next steps:"
echo "1. Create a new GitHub repository called 'Betatest2'"
echo "2. Copy all files to the new repository"
echo "3. Update .env.local with your actual Supabase credentials"
echo "4. Push to GitHub"
echo "5. Connect the repository to Vercel"
echo "6. Set environment variables in Vercel dashboard"
echo "7. Deploy!"
echo ""
echo "For detailed instructions, see README-VERCEL-DEPLOYMENT.md"
echo ""

# Step 9: Optional - Create deployment package
read -p "Do you want to create a deployment package? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Creating deployment package..."
    
    # Create a temporary directory for deployment
    DEPLOY_DIR="uhub-vercel-deployment"
    mkdir -p "$DEPLOY_DIR"
    
    # Copy necessary files
    cp -r src/ "$DEPLOY_DIR/"
    cp -r public/ "$DEPLOY_DIR/"
    cp package.json "$DEPLOY_DIR/"
    cp package-lock.json "$DEPLOY_DIR/"
    cp tailwind.config.js "$DEPLOY_DIR/"
    cp postcss.config.js "$DEPLOY_DIR/"
    cp vercel.json "$DEPLOY_DIR/"
    cp env.production.template "$DEPLOY_DIR/.env.local"
    cp .gitignore "$DEPLOY_DIR/"
    cp README-VERCEL-DEPLOYMENT.md "$DEPLOY_DIR/README.md"
    
    # Create a zip file
    zip -r "uhub-vercel-deployment.zip" "$DEPLOY_DIR/"
    
    # Clean up
    rm -rf "$DEPLOY_DIR"
    
    print_success "Deployment package created: uhub-vercel-deployment.zip"
    print_status "You can upload this zip file to your Betatest2 repository"
fi

print_success "Script completed successfully! 🎉"
