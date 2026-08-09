# Matchmaker

Matchmaker is a client-side, rule-based marriage-market self-assessment built with React and Vite. It turns answers about profile, habits, and partner expectations into a deterministic score and a structured report.

Try the live demo: [matchmaker1.vercel.app](https://matchmaker1.vercel.app)

## Privacy model

- Answers are processed only in the current browser tab.
- The app has no backend, AI API, analytics, account system, or database.
- Answers are not transmitted or written to browser storage by this codebase.
- **Clear data and start over** resets the assessment state; reloading or closing the page also discards it.

## How it works

1. Complete a personal profile.
2. Describe daily habits.
3. Set partner expectations.
4. Generate a local, rule-based assessment and action plan.

The scoring and report logic live in [`matchmaker-v13.tsx`](./matchmaker-v13.tsx). No generative AI model is used.

## Limitations and responsible use

This project is an experimental heuristic demo, not a scientifically validated model or professional relationship, psychological, legal, or financial advice. Its assumptions about gender, age, income, family background, and relationship history are subjective, culturally specific, and may encode bias. Do not use its output to make high-stakes decisions or to rank another person's worth.

## Run locally

```bash
npm ci
npm run dev
```

Create a production build with:

```bash
npm run build
```

## Technology

- React 19
- Vite 6
- Local deterministic scoring and report generation

## License

No open-source license has been granted. The repository is publicly viewable, but reuse, modification, and redistribution require permission from the copyright holder.
