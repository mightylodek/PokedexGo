# Troubleshooting npm Install Issues

## Common Issues and Solutions

### Issue 1: Workspace Resolution Errors

If you see errors about workspace packages not being found, try:

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and lock files
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
rm -f package-lock.json

# Reinstall
npm install
```

### Issue 2: Peer Dependency Warnings

Some peer dependency warnings are normal and can be ignored. If they cause install failures:

```bash
# Install with legacy peer deps flag
npm install --legacy-peer-deps
```

### Issue 3: Turbo Not Found

If turbo commands fail:

```bash
# Install turbo globally as fallback
npm install -g turbo

# Or use npx
npx turbo run dev
```

### Issue 4: TypeScript Version Conflicts

If you see TypeScript version conflicts:

```bash
# Use npm's dedupe
npm dedupe

# Or force resolution in root package.json
```

### Issue 5: Prisma Client Generation Issues

```bash
# Generate Prisma client manually
cd apps/api
npx prisma generate
cd ../..
```

### Issue 6: Missing Dependencies in Workspaces

If workspace packages can't find each other:

1. Ensure all packages are listed in root `package.json` workspaces
2. Check that package names match (e.g., `@pokedex-go/shared`)
3. Try installing dependencies in each workspace individually:

```bash
cd packages/shared && npm install && cd ../..
cd packages/battle-engine && npm install && cd ../..
cd apps/api && npm install && cd ../..
cd apps/web && npm install && cd ../..
```

### Issue 7: Node Version Mismatch

Ensure you're using Node.js >= 18:

```bash
node --version  # Should be >= 18.0.0

# If not, use nvm to switch
nvm install 18
nvm use 18
```

### Issue 8: Permission Errors

```bash
# Fix npm permissions (macOS/Linux)
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Or use a node version manager (nvm, fnm, etc.)
```

## Step-by-Step Clean Install

If nothing works, try a complete clean install:

```bash
# 1. Remove all node_modules and lock files
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
find . -name "package-lock.json" -delete

# 2. Clear npm cache
npm cache clean --force

# 3. Verify Node version
node --version

# 4. Install from root
npm install

# 5. If that fails, install workspaces individually
cd packages/shared && npm install
cd ../battle-engine && npm install
cd ../../apps/api && npm install
cd ../web && npm install
```

## Alternative: Use Yarn or pnpm

If npm continues to have issues, try yarn:

```bash
# Install yarn
npm install -g yarn

# Install dependencies
yarn install
```

Or pnpm:

```bash
# Install pnpm
npm install -g pnpm

# Install dependencies
pnpm install
```

## Getting Help

If you're still having issues, please share:

1. **Node version**: `node --version`
2. **npm version**: `npm --version`
3. **Full error output**: Copy the complete error message
4. **Operating system**: macOS, Linux, or Windows
5. **Any proxy/VPN settings**: Are you behind a corporate firewall?

