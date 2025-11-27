# Cloudflare Pages Deployment Guide

## 🚀 Overview

This guide covers deploying the OmraFlow Pro Next.js frontend to Cloudflare Pages using pnpm.

## 📋 Prerequisites

- Cloudflare account
- GitHub repository connected to Cloudflare Pages
- Environment variables configured

## ⚙️ Build Configuration

### Cloudflare Pages Settings

Configure your Cloudflare Pages project with the following settings:

| Setting | Value |
|---------|-------|
| **Framework preset** | Next.js |
| **Build command** | `pnpm run build:web` |
| **Build output directory** | `apps/web/.next` |
| **Root directory** | `/` (monorepo root) |
| **Node version** | `18.20.0` |
| **Package manager** | `pnpm` |

### Environment Variables

Add the following environment variables in Cloudflare Pages dashboard:

#### Required
```bash
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
```

#### Optional (for production)
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app-domain.pages.dev
```

## 📦 Installation

The deployment process will automatically:

1. Detect `pnpm-workspace.yaml` and use pnpm
2. Install dependencies using `pnpm install`
3. Build the web app using `pnpm run build:web`
4. Deploy the `.next` output to Cloudflare Pages

## 🔧 Build Commands Explained

### Root package.json scripts:
```json
{
  "build": "turbo run build",           // Build all workspaces
  "build:web": "turbo run build --filter=@omraflow/web"  // Build only web app
}
```

### Why use `build:web`?
- **Faster builds**: Only builds the web app, not the API
- **Monorepo efficiency**: Turborepo handles workspace dependencies
- **Cloudflare compatibility**: Focuses on client-side code only

## 🌐 Deployment Steps

### Option 1: Automatic Deployment (Recommended)

1. **Connect GitHub Repository**
   - Go to Cloudflare Pages dashboard
   - Click "Create a project"
   - Select "Connect to Git"
   - Choose your GitHub repository
   - Select branch: `main` or `claude/build-omraflow-saas-01JSmbHRmtT1MT1sgdKpvySU`

2. **Configure Build Settings**
   ```
   Build command: pnpm run build:web
   Build output directory: apps/web/.next
   Root directory: (leave blank for monorepo root)
   Environment variables: Add NEXT_PUBLIC_API_URL
   ```

3. **Deploy**
   - Click "Save and Deploy"
   - Cloudflare will automatically build and deploy
   - Subsequent pushes trigger automatic deployments

### Option 2: Manual Deployment with Wrangler

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Build the project
pnpm run build:web

# Deploy to Cloudflare Pages
wrangler pages deploy apps/web/.next --project-name=omraflow-pro
```

## 🔄 CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8.15.0

      - uses: actions/setup-node@v4
        with:
          node-version: '18.20.0'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm run build:web

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: omraflow-pro
          directory: apps/web/.next
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

## 🐛 Troubleshooting

### Build Fails with "Module not found"

**Problem**: Turborepo can't find workspace packages

**Solution**: Ensure `pnpm-workspace.yaml` exists in root:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### Build Fails with "pnpm not found"

**Problem**: Cloudflare doesn't detect pnpm

**Solution**: Add `packageManager` field in root `package.json`:
```json
{
  "packageManager": "pnpm@8.15.0"
}
```

### API URL not working

**Problem**: Frontend can't connect to API

**Solution**: Check `NEXT_PUBLIC_API_URL` environment variable in Cloudflare Pages settings

### Build timeout

**Problem**: Build exceeds Cloudflare's time limit

**Solution**:
- Use `build:web` instead of `build` to avoid building API
- Remove unused dependencies
- Enable Turborepo cache

## 📊 Build Performance

### Typical Build Times
- **Full install**: ~40-60 seconds
- **Turborepo build**: ~20-30 seconds
- **Total deployment**: ~2-3 minutes

### Optimization Tips

1. **Use Turborepo caching**:
   ```json
   // turbo.json
   {
     "pipeline": {
       "build": {
         "outputs": [".next/**", "dist/**"]
       }
     }
   }
   ```

2. **Enable pnpm caching** in CI/CD:
   ```yaml
   - uses: actions/setup-node@v4
     with:
       cache: 'pnpm'
   ```

3. **Optimize dependencies**:
   - Remove unused packages
   - Use `pnpm prune` for production builds

## 🌍 Custom Domains

### Add Custom Domain

1. Go to Cloudflare Pages project
2. Click "Custom domains"
3. Add your domain: `app.yourdomain.com`
4. Update DNS settings (Cloudflare will provide CNAME)
5. Wait for SSL certificate provisioning (~5-10 minutes)

### Update Environment Variables

Update `NEXT_PUBLIC_APP_URL` with your custom domain:
```bash
NEXT_PUBLIC_APP_URL=https://app.yourdomain.com
```

## 📝 Deployment Checklist

- [ ] Repository connected to Cloudflare Pages
- [ ] Build command: `pnpm run build:web`
- [ ] Build output directory: `apps/web/.next`
- [ ] Node version: `18.20.0`
- [ ] Environment variable `NEXT_PUBLIC_API_URL` set
- [ ] API server deployed and accessible
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Test deployment successful

## 🔐 Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **API Keys**: Use Cloudflare environment variables
3. **CORS**: Configure API to allow Cloudflare Pages domain
4. **CSP Headers**: Add Content Security Policy headers
5. **Rate Limiting**: Use Cloudflare's built-in rate limiting

## 📖 Additional Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Next.js on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [Turborepo Docs](https://turbo.build/repo/docs)
- [pnpm Docs](https://pnpm.io/)

## 🆘 Support

If you encounter issues:

1. Check Cloudflare Pages build logs
2. Verify environment variables
3. Test build locally: `pnpm run build:web`
4. Check API connectivity
5. Review Cloudflare Pages status page

---

**Last Updated**: 2025-11-24
**Version**: 1.0.0
**Status**: ✅ Production Ready
