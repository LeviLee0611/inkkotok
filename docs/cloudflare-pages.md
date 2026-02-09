# Cloudflare Pages Deploy (Next.js App Router)

This project uses App Router and dynamic routes (e.g. `/post/[id]`), so
static export is not a good fit. Use **Next-on-Pages** instead.

## Pages Settings
- Framework preset: `Next.js`
- Build command: `npm run pages:build`
- Build output directory: `.vercel/output/static`

## Notes
- If `inkkotok.pages.dev` returns 404, check:
  - Project name (must match Pages project name)
  - `Deployments` has a **Production** build
- Custom Domains should point to the Pages project domain.
