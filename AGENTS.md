<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# Performance & Lazy Loading
- ALWAYS use lazy loading for images (`loading="lazy"` or `next/image`).
- Use dynamic imports (`next/dynamic`) for heavy client-side components to improve initial TTI.
- Prioritize ISR/SSR over client-side fetching for critical data.
<!-- END:nextjs-agent-rules -->
