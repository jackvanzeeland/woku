#!/bin/bash
set -e

echo "Building..."
npm run build

echo "Syncing to S3..."
aws s3 sync dist/ s3://woku --delete

echo "Setting cache headers on index.html..."
aws s3 cp s3://woku/index.html s3://woku/index.html \
  --metadata-directive REPLACE \
  --cache-control "no-cache, no-store, must-revalidate" \
  --content-type "text/html"

echo "Deployed to http://woku.s3-website.us-east-2.amazonaws.com"
