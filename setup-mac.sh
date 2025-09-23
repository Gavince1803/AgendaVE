#!/bin/bash

# 🎨 AgendaVE - Premium Booking App Setup Script for Mac
# This script sets up your development environment on macOS (especially M1 Macs)

echo "🎨 Setting up AgendaVE - Premium Booking App"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}❌ This script is designed for macOS only${NC}"
    exit 1
fi

# Check for M1/Apple Silicon
if [[ $(uname -m) == "arm64" ]]; then
    echo -e "${GREEN}✅ Detected Apple Silicon (M1/M2) - Optimal performance expected!${NC}"
    ARCH="Apple Silicon"
else
    echo -e "${BLUE}ℹ️  Detected Intel Mac${NC}"
    ARCH="Intel"
fi

echo ""
echo "🚀 Starting setup process..."
echo ""

# 1. Check for Homebrew
echo "1️⃣ Checking for Homebrew..."
if ! command -v brew &> /dev/null; then
    echo -e "${YELLOW}⚠️  Homebrew not found. Installing Homebrew...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH for Apple Silicon
    if [[ $(uname -m) == "arm64" ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
else
    echo -e "${GREEN}✅ Homebrew already installed${NC}"
fi

# 2. Check for Node.js
echo ""
echo "2️⃣ Checking for Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js not found. Installing Node.js LTS...${NC}"
    brew install node
else
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js already installed: ${NODE_VERSION}${NC}"
fi

# 3. Check for Watchman (recommended for React Native)
echo ""
echo "3️⃣ Checking for Watchman..."
if ! command -v watchman &> /dev/null; then
    echo -e "${YELLOW}⚠️  Watchman not found. Installing for better file watching...${NC}"
    brew install watchman
else
    echo -e "${GREEN}✅ Watchman already installed${NC}"
fi

# 4. Check for Xcode Command Line Tools
echo ""
echo "4️⃣ Checking for Xcode Command Line Tools..."
if ! xcode-select -p &> /dev/null; then
    echo -e "${YELLOW}⚠️  Xcode Command Line Tools not found. Installing...${NC}"
    xcode-select --install
    echo -e "${BLUE}ℹ️  Please complete the Xcode Command Line Tools installation and run this script again${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Xcode Command Line Tools already installed${NC}"
fi

# 5. Install npm dependencies
echo ""
echo "5️⃣ Installing project dependencies..."
echo -e "${BLUE}ℹ️  This will install all dependencies from package-lock.json for exact version matching${NC}"

if npm ci; then
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

# 6. Check Expo CLI
echo ""
echo "6️⃣ Checking Expo setup..."
if ! npx expo --version &> /dev/null; then
    echo -e "${RED}❌ Unable to run Expo CLI${NC}"
    exit 1
else
    EXPO_VERSION=$(npx expo --version)
    echo -e "${GREEN}✅ Expo CLI working: ${EXPO_VERSION}${NC}"
fi

echo ""
echo "🎉 Setup complete! Your premium AgendaVE booking app is ready!"
echo "============================================="
echo ""
echo -e "${GREEN}🚀 NEXT STEPS:${NC}"
echo ""
echo -e "${BLUE}To start development:${NC}"
echo "  npx expo start"
echo ""
echo -e "${BLUE}To run on iOS Simulator (recommended for ${ARCH}):${NC}"
echo "  npx expo start --ios"
echo ""
echo -e "${BLUE}To run on Android Emulator:${NC}"
echo "  npx expo start --android"
echo ""
echo -e "${YELLOW}📱 PREMIUM UI TESTING:${NC}"
echo "• Your world-class color system will look amazing on iOS Simulator"
echo "• Test with iPhone 15 Pro Max for best premium experience"
echo "• Loading states and animations will be butter smooth on M1"
echo ""
echo -e "${GREEN}✨ Ready to experience your premium booking app! ✨${NC}"