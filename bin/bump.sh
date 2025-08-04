#!/usr/bin/env sh

set -e

VERSION="$1"

if [ -z "$VERSION" ]
then
  echo "error: version not set"
  exit 1
fi

echo "setting to $VERSION"

npm version --no-git-tag-version --allow-same-version -C cli $VERSION
npm version --no-git-tag-version --allow-same-version -C website $VERSION

npm version --no-git-tag-version --allow-same-version $VERSION
git add website/package*.json cli/package*.json package*.json

git commit -m "$VERSION"
git tag "v$VERSION" -m "$VERSION"
