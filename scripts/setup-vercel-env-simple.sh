#!/bin/bash

# Eenvoudig script om environment variables naar Vercel te pushen
# Gebruik: bash scripts/setup-vercel-env-simple.sh

echo "🔍 Controleren of .env.local bestaat..."

if [ ! -f .env.local ]; then
    echo "❌ .env.local niet gevonden!"
    echo "Maak eerst .env.local aan met alle environment variables."
    exit 1
fi

echo "✅ .env.local gevonden"
echo ""
echo "📦 Environment variables die naar Vercel worden gepusht:"
echo ""

# Use npx to run vercel CLI (no global install needed)
VERCEL_CMD="npx vercel"

# Read .env.local and push to Vercel
while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip comments and empty lines
    [[ "$key" =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue
    
    # Remove quotes from value
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    
    # Skip if value is empty or placeholder
    if [[ -z "$value" ]] || [[ "$value" == *"vul_"* ]] || [[ "$value" == *"jouw_"* ]]; then
        continue
    fi
    
    echo "📤 $key"
    
    # Push to each environment separately
    SUCCESS_COUNT=0
    for env in production preview development; do
        OUTPUT=$(echo "$value" | $VERCEL_CMD env add "$key" "$env" 2>&1)
        EXIT_CODE=$?
        
        if [ $EXIT_CODE -eq 0 ]; then
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        elif echo "$OUTPUT" | grep -qi "already exists\|already added"; then
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        fi
    done
    
    if [ $SUCCESS_COUNT -eq 3 ]; then
        echo "   ✅ Toegevoegd aan alle environments"
    elif [ $SUCCESS_COUNT -gt 0 ]; then
        echo "   ⚠️  Gedeeltelijk toegevoegd ($SUCCESS_COUNT/3)"
    else
        echo "   ❌ Fout bij toevoegen"
    fi
    echo ""
done < .env.local

echo "✨ Klaar!"
echo ""
echo "🔄 Redeploy je project in Vercel om de nieuwe variabelen te gebruiken."
echo "   Of push een nieuwe commit naar GitHub."
