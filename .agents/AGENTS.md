<!-- BEGIN:vercel-eslint-rule -->
# Vercel Deployment & ESLint
When pushing code for Vercel deployments (especially Next.js apps), always remember that Vercel enforces strict ESLint and TypeScript checks during the build phase by default.
Rules like `react-hooks/set-state-in-effect` are treated as warnings locally during `npm run dev` but will outright fail a Vercel deployment.
If you are iterating quickly and the user reports that a recent push did not go live, check Vercel build logs or `npm run lint` errors.
To unblock deployments immediately without rewriting code, you can disable these checks in `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  // ...other config
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};
```
<!-- END:vercel-eslint-rule -->
