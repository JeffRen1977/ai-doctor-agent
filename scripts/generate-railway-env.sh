#!/bin/bash

# Generate Railway Environment Variables from backend/.env
# This script reads backend/.env and generates a reference file for Railway

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ENV_FILE="backend/.env"
OUTPUT_FILE="railway-env-vars.txt"

echo "🔧 Generating Railway Environment Variables Reference..."
echo "======================================================"
echo ""

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Error: $ENV_FILE not found${NC}"
    echo "   Please create backend/.env file first"
    exit 1
fi

echo -e "${GREEN}✅ Reading from: $ENV_FILE${NC}"
echo ""

# Generate Railway environment variables file
cat > "$OUTPUT_FILE" << EOF
# Railway Environment Variables Reference
# Generated from backend/.env on $(date)
# 
# Instructions:
# 1. Copy each variable to Railway: Project Settings → Variables
# 2. Replace placeholder values with actual values
# 3. For sensitive values (SECRET, KEY, PASSWORD, TOKEN), use your actual credentials
#
# ============================================================================

EOF

# Read .env file and format for Railway
VAR_COUNT=0
while IFS= read -r line || [ -n "$line" ]; do
    # Skip empty lines
    if [[ -z "$line" ]] || [[ "$line" =~ ^[[:space:]]*$ ]]; then
        echo "" >> "$OUTPUT_FILE"
        continue
    fi
    
    # Include comments
    if [[ "$line" =~ ^[[:space:]]*# ]]; then
        echo "$line" >> "$OUTPUT_FILE"
        continue
    fi
    
    # Extract variable name and value
    if [[ "$line" =~ ^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
        var_name="${BASH_REMATCH[1]}"
        var_value="${BASH_REMATCH[2]}"
        
        # Remove quotes if present
        var_value=$(echo "$var_value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
        
        # Check if it's a sensitive value
        if [[ "$var_name" =~ (SECRET|KEY|PASSWORD|TOKEN) ]]; then
            # For sensitive values, use placeholder
            echo "$var_name=your-$var_name-value-here" >> "$OUTPUT_FILE"
            echo -e "   ${YELLOW}⚠️  $var_name (sensitive - use actual value)${NC}"
        else
            # For non-sensitive values, use actual value
            echo "$var_name=$var_value" >> "$OUTPUT_FILE"
            echo -e "   ${GREEN}✅ $var_name${NC}"
        fi
        
        VAR_COUNT=$((VAR_COUNT + 1))
    fi
done < "$ENV_FILE"

echo ""
echo -e "${GREEN}✅ Generated $OUTPUT_FILE${NC}"
echo "   Found $VAR_COUNT environment variables"
echo ""
echo "📋 Next steps:"
echo "   1. Review $OUTPUT_FILE"
echo "   2. Copy variables to Railway: Project Settings → Variables"
echo "   3. Replace placeholder values with actual values"
echo ""
