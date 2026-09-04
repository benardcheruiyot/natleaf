#!/usr/bin/env bash
# Usage: export S3_BUCKET=your-bucket; export CLOUDFRONT_DISTRIBUTION_ID=XXX; ./scripts/deploy_s3_cloudfront.sh
set -euo pipefail
BUILD_DIR=frontend/dist
if [ ! -d "$BUILD_DIR" ]; then
  echo "Build directory not found: $BUILD_DIR"
  exit 1
fi
if [ -z "${S3_BUCKET:-}" ]; then
  echo "Set S3_BUCKET environment variable"
  exit 1
fi
aws s3 sync "$BUILD_DIR/" "s3://$S3_BUCKET/" --delete
if [ -n "${CLOUDFRONT_DISTRIBUTION_ID:-}" ]; then
  aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --paths "/*"
  echo "Invalidation requested for CloudFront distribution $CLOUDFRONT_DISTRIBUTION_ID"
else
  echo "No CLOUDFRONT_DISTRIBUTION_ID set; skipped invalidation"
fi

echo "Deployed to S3 bucket: $S3_BUCKET"