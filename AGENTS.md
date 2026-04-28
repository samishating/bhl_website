<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# Performance & Lazy Loading
- ALWAYS use lazy loading for images (`loading="lazy"` or `next/image`).
- Use dynamic imports (`next/dynamic`) for heavy client-side components to improve initial TTI.
- Prioritize ISR/SSR over client-side fetching for critical data.
# UI/UX Standards (STRICT)
- **NO BROWSER ALERTS**: Never use `alert()`, `confirm()`, or `prompt()`. Always implement custom UI modals or inline feedback.
- **Toast Icons**: Ensure only ONE icon per toast. Do not double-up on emojis if the provider already adds one.
- **Form Interaction**: Forms must feel like forms. Avoid hover effects that make inputs or form containers look like interactive `div` cards.
- **Rich Aesthetics**: Maintain the "Premium" feel (glassmorphism, Rajdhani font, vibrant gradients) across all new components.

# Security & Admin
- **Username Modification**: Only `superadmin` users are allowed to change usernames. Disable this for all other roles in both UI and API.

# Infrastructure
- **Email Service**: Use Nodemailer with Gmail SMTP for transactional emails to avoid domain verification delays for the user.
<!-- END:nextjs-agent-rules -->

