# RouteWatch Next.js

This is the Next.js + MongoDB conversion of the original PHP/XAMPP vehicle tracker.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Set `MONGODB_URI`, `MONGODB_DB`, and a random `SESSION_SECRET` of at least 32 characters.
3. Install dependencies with `npm install`.
4. Create the first administrator:

   ```powershell
   $env:MONGODB_URI="mongodb+srv://..."
   $env:MONGODB_DB="vehicle_tracking"
   node scripts/seed-admin.mjs admin "choose-a-new-password"
   ```

5. Start the app with `npm run dev`.

The app stores users and vehicles in MongoDB collections named `users` and `vehicles`. Existing MySQL data must be exported and mapped into those collections before production use; passwords should be reset rather than copied from the old seed account.

## Vercel deployment

Import the `next-app` directory as the Vercel project root. Add the same environment variables in Vercel Project Settings:

- `MONGODB_URI`
- `MONGODB_DB`
- `SESSION_SECRET`
- `NEXT_PUBLIC_APP_URL`

After deployment, add the custom domain in Vercel and update the domain's DNS records exactly as shown by Vercel. Do not commit `.env.local` or database credentials.
