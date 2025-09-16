# Clerk Authentication Setup Instructions

## 1. Create Clerk Account
1. Go to [clerk.com](https://clerk.com) and create a free account
2. Create a new application for your ATS system

## 2. Get Your API Keys
1. In the Clerk Dashboard, go to **API Keys**
2. Copy your **Publishable Key** (starts with `pk_test_` or `pk_live_`)
3. Copy your **Secret Key** (starts with `sk_test_` or `sk_live_`)

## 3. Update Environment Variables
Update your `.env.local` file with your actual Clerk keys:

```bash
# Replace these placeholder values with your actual Clerk keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_actual_secret_key_here

# Update this with your actual Clerk domain
CLERK_JWT_ISSUER_DOMAIN=https://your-app-name.clerk.accounts.dev
```

## 4. Create JWT Template (CRITICAL STEP)
1. In the Clerk Dashboard, go to **JWT Templates**
2. Click **New template**
3. Select **Convex** from the template list
4. **IMPORTANT**: Do NOT rename the template - it must be called `convex`
5. Copy the **Issuer** URL from the template
6. Update your `CLERK_JWT_ISSUER_DOMAIN` in `.env.local` with this Issuer URL

## 5. Restart Development Server
After updating your environment variables:
```bash
# Stop the current dev server (Ctrl+C)
# Then restart
pnpm dev
```

## 6. Test Authentication
1. Visit `http://localhost:3000`
2. You should see the authentication working
3. Sign up/sign in should redirect you to the main ATS interface

## Troubleshooting
- If you see "Missing publishableKey" error, check your `.env.local` file
- If authentication doesn't work, verify the JWT template is named exactly `convex`
- Ensure your Clerk domain URL is correct in the environment variables

## Current Status
✅ Clerk configuration files created
✅ Environment variables template added
✅ Middleware and providers configured
⏳ **YOU NEED TO**: Create Clerk account and update API keys
⏳ **YOU NEED TO**: Create JWT template named "convex"