#!/bin/bash
# Create a new draft notebook from template

set -e

if [ $# -eq 0 ]; then
    echo "Usage: $0 <draft-name>"
    echo "Example: $0 credit-analysis"
    exit 1
fi

DRAFT_NAME="$1"
DRAFT_FILE="drafts/${DRAFT_NAME}.qmd"

if [ -f "$DRAFT_FILE" ]; then
    echo "Error: $DRAFT_FILE already exists"
    exit 1
fi

# Copy from template
cp drafts/sample-analysis.qmd "$DRAFT_FILE"

# Update the title
sed -i '' "s/title: \"Draft: Exploring Credit Patterns\"/title: \"Draft: ${DRAFT_NAME^}\"/" "$DRAFT_FILE"

echo "✅ Created new draft: $DRAFT_FILE"
echo "🚀 Open in VS Code: code $DRAFT_FILE"
echo "📊 Start preview: quarto preview $DRAFT_FILE"