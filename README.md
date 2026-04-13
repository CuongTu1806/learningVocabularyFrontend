# learningVocabularyFrontend

Frontend for the vocabulary learning platform, built with React + Vite.

## Requirements

- Node.js 18+ (recommended: latest LTS)
- npm 9+

## Clone And Run

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd learningVocabularyFrontend
npm install
npm run dev
```

After running, open the local URL shown in terminal (usually `http://localhost:5173`).

## Scripts

- `npm run dev`: start development server
- `npm run build`: build production files
- `npm run preview`: preview production build locally
- `npm run lint`: run ESLint

## Environment Variables

If your API endpoints or keys are environment-based, create `.env` in project root.

Example:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Important:

- Do not commit secrets.
- `.env` is ignored by Git in `.gitignore`.
