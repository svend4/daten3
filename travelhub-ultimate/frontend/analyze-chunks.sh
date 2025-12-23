#!/bin/bash

# Script to analyze chunk sizes after build
# Usage: ./analyze-chunks.sh

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║              📦 Chunk Size Analysis                           ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if dist folder exists
if [ ! -d "dist/assets" ]; then
    echo "❌ dist/assets folder not found!"
    echo "   Run 'npm run build' first"
    exit 1
fi

echo "📊 JavaScript Chunks:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Find all JS files and show sizes
total_size=0
large_chunks=0
threshold=512000  # 500KB in bytes

while IFS= read -r file; do
    size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
    size_kb=$((size / 1024))
    filename=$(basename "$file")

    # Color code based on size
    if [ $size -gt $threshold ]; then
        echo "  🔴 $filename - ${size_kb}KB (>500KB)"
        large_chunks=$((large_chunks + 1))
    elif [ $size -gt 307200 ]; then  # 300KB
        echo "  🟡 $filename - ${size_kb}KB"
    else
        echo "  🟢 $filename - ${size_kb}KB"
    fi

    total_size=$((total_size + size))
done < <(find dist/assets -name "*.js" -type f | sort)

echo ""
echo "📊 CSS Files:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

while IFS= read -r file; do
    size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
    size_kb=$((size / 1024))
    filename=$(basename "$file")
    echo "  📄 $filename - ${size_kb}KB"
    total_size=$((total_size + size))
done < <(find dist/assets -name "*.css" -type f | sort)

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

total_mb=$(echo "scale=2; $total_size / 1048576" | bc)
echo "  Total size: ${total_mb}MB"

if [ $large_chunks -gt 0 ]; then
    echo "  ⚠️  Large chunks (>500KB): $large_chunks"
    echo ""
    echo "  Recommendation: Consider splitting large chunks"
    echo "  See vite.config.optimized.ts for optimized configuration"
else
    echo "  ✅ No chunks exceed 500KB"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Show gzipped sizes
echo "📦 Gzipped Sizes (estimated):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

while IFS= read -r file; do
    if command -v gzip &> /dev/null; then
        gzip_size=$(gzip -c "$file" | wc -c)
        gzip_kb=$((gzip_size / 1024))
        filename=$(basename "$file")
        echo "  📦 $filename - ${gzip_kb}KB (gzipped)"
    fi
done < <(find dist/assets -name "*.js" -type f | head -3)

echo ""
echo "✨ Analysis complete!"
echo ""
