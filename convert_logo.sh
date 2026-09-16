#!/bin/bash
# Read the base64 encoded image
BASE64=$(base64 -w 0 "frontend/public/mwu-logo.png")

# Create SVG with embedded image
cat > "frontend/public/mwu-logo.svg" << SVGEof
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1131" height="1131" viewBox="0 0 1131 1131">
  <image width="1131" height="1131" xlink:href="data:image/jpeg;base64,${BASE64}"/>
</svg>
SVGEof

# Copy to backend
cp "frontend/public/mwu-logo.svg" "backend/public/mwu-logo.svg"

echo "SVG created successfully"
