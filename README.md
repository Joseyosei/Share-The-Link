# Share The Link

Your all-in-one link-in-bio platform. Create a beautiful profile page, sell products, go live, and grow your audience.

## Tech Stack

- **Framework**: React + Vite + TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage)
- **Payments**: Stripe (Checkout, Customer Portal, Webhooks)
- **Hosting**: Vercel

## Getting Started

```sh
# Clone the repository
git clone https://github.com/Joseyosei/Share-The-Link.git

# Navigate to the project directory
cd Share-The-Link

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

## Environment Variables

The following environment variables are required:

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `STRIPE_SECRET_KEY` - Stripe secret key (live)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (live)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret

## Features

- Link-in-bio profile pages
- AI Page Builder
- Live Streaming with tips
- My Shop (product listings)
- Auto-Share (scheduled link sharing)
- Media Hub
- Analytics dashboard
- Custom themes and appearance
- Stripe-powered subscriptions (Free, Pro, Business, Enterprise)

## Deployment

Deploy to Vercel or any Node.js-compatible hosting platform.
