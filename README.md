# Swipy

Swipy is a Tinder-style game/movie picker for solo play or with friends: swipe through a deck, collect matches, and decide what to play together.

**Live:** [https://swipy-chi.vercel.app](https://swipy-chi.vercel.app)

## Features

- Solo and infinite swipe modes with local swipe history
- Friend sessions: create/join by code, shared lobby link, realtime swiping
- Match rules (all / majority / half) and a shared matches view
- Game library and custom decks backed by the IGDB catalog
- Google OAuth sign-in via Supabase Auth, with guest sessions supported without an account

## Stack

- [Next.js](https://nextjs.org) 16 (App Router), React 19, TypeScript
- Tailwind CSS 4
- Supabase (Auth, Postgres, Realtime)
- IGDB API for the game catalog

## Getting Started

Copy `.env.example` to `.env.local` and fill in the required values, then run the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Scripts

```bash
npm run dev     # start the dev server
npm run build   # production build
npm run lint    # lint the project
```

## Deploy

Deployed on [Vercel](https://vercel.com); production tracks the `main` branch.
