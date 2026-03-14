#!/bin/bash

# Sync Main and Release Branches Script
# This script ensures main and release branches are in sync

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔄 Syncing Main and Release Branches${NC}"
echo "=========================================="
echo ""

# Check if we have uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  You have uncommitted changes${NC}"
    echo "   Please commit or stash them first"
    git status --short
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${BLUE}📋 Current branch: ${CURRENT_BRANCH}${NC}"
echo ""

# Step 1: Ensure main is up to date
echo -e "${BLUE}Step 1: Updating main branch...${NC}"
git checkout main
echo -e "${GREEN}✅ Switched to main${NC}"

# Check if main has uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Main has uncommitted changes, committing...${NC}"
    git add -A
    git commit -m "chore: Sync branches - commit uncommitted changes" || true
fi

# Step 2: Merge main into release
echo ""
echo -e "${BLUE}Step 2: Merging main into release...${NC}"
git checkout release
echo -e "${GREEN}✅ Switched to release${NC}"

# Check if release already has all main commits
MAIN_COMMITS=$(git log main --oneline | head -1)
RELEASE_HAS_MAIN=$(git log release --oneline | grep -c "$MAIN_COMMITS" || echo "0")

if [ "$RELEASE_HAS_MAIN" -eq "0" ]; then
    echo -e "${YELLOW}⚠️  Release doesn't have latest main commits, merging...${NC}"
    git merge main -m "Sync: Merge main into release to keep branches in sync" || {
        echo -e "${RED}❌ Merge conflict detected${NC}"
        echo "   Please resolve conflicts manually and run:"
        echo "   git add ."
        echo "   git commit"
        exit 1
    }
    echo -e "${GREEN}✅ Merged main into release${NC}"
else
    echo -e "${GREEN}✅ Release already has latest main commits${NC}"
fi

# Step 3: Show sync status
echo ""
echo -e "${BLUE}Step 3: Branch sync status${NC}"
echo "----------------------------------------"

# Count commits difference
MAIN_AHEAD=$(git log release..main --oneline | wc -l | tr -d ' ')
RELEASE_AHEAD=$(git log main..release --oneline | wc -l | tr -d ' ')

if [ "$MAIN_AHEAD" -eq "0" ] && [ "$RELEASE_AHEAD" -eq "0" ]; then
    echo -e "${GREEN}✅ Branches are in sync!${NC}"
elif [ "$MAIN_AHEAD" -gt "0" ]; then
    echo -e "${YELLOW}⚠️  Main is ${MAIN_AHEAD} commits ahead of release${NC}"
    echo "   Run this script again to sync"
elif [ "$RELEASE_AHEAD" -gt "0" ]; then
    echo -e "${BLUE}ℹ️  Release is ${RELEASE_AHEAD} commits ahead of main${NC}"
    echo "   This is normal if release has deployment-specific commits"
fi

# Step 4: Show what needs to be pushed
echo ""
echo -e "${BLUE}Step 4: Push status${NC}"
echo "----------------------------------------"

MAIN_PUSH=$(git log origin/main..main --oneline 2>/dev/null | wc -l | tr -d ' ' || echo "0")
RELEASE_PUSH=$(git log origin/release..release --oneline 2>/dev/null | wc -l | tr -d ' ' || echo "0")

if [ "$MAIN_PUSH" -gt "0" ]; then
    echo -e "${YELLOW}⚠️  Main has ${MAIN_PUSH} unpushed commits${NC}"
    echo "   Run: git push origin main"
fi

if [ "$RELEASE_PUSH" -gt "0" ]; then
    echo -e "${YELLOW}⚠️  Release has ${RELEASE_PUSH} unpushed commits${NC}"
    echo "   Run: git push origin release"
fi

if [ "$MAIN_PUSH" -eq "0" ] && [ "$RELEASE_PUSH" -eq "0" ]; then
    echo -e "${GREEN}✅ All commits are pushed${NC}"
fi

echo ""
echo -e "${BLUE}📋 Summary${NC}"
echo "=========================================="
echo "Current branch: $(git branch --show-current)"
echo ""
echo "To push branches:"
if [ "$MAIN_PUSH" -gt "0" ]; then
    echo "  git checkout main && git push origin main"
fi
if [ "$RELEASE_PUSH" -gt "0" ]; then
    echo "  git checkout release && git push origin release"
fi
echo ""
