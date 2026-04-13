# learningVocabularyFrontend

Frontend for the vocabulary learning platform, built with React + Vite.

## 1. Requirements

- Node.js 18+ (recommended: latest LTS)
- npm 9+
- Git

Check installed versions:

```bash
node -v
npm -v
git --version
```

## 2. Clone Repository

```bash
git clone https://github.com/CuongTu1806/learningVocabularyFrontend.git
cd learningVocabularyFrontend
```

## 3. Install Dependencies

```bash
npm install
```

## 4. Environment Configuration (`.env`)

This project uses Axios config:

- `VITE_API_BASE_URL` if provided
- fallback to `/api` if not provided

And Vite dev server is configured to proxy `/api` to `http://localhost:8080`.

### Case A: Backend runs locally at `http://localhost:8080`

No `.env` file is required. You can run immediately.

### Case B: Backend runs on another URL

Create `.env` at project root:

```env
VITE_API_BASE_URL=http://your-backend-host:your-port/api
```

Example:

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

Important:

- Do not commit secrets.
- `.env` is already ignored by `.gitignore`.

## 5. Run In Development

```bash
npm run dev
```

After running, open the local URL shown in terminal (usually `http://localhost:5173`).

## 6. Available Scripts

- `npm run dev`: start development server
- `npm run build`: build production files
- `npm run preview`: preview production build locally
- `npm run lint`: run ESLint

## 7. Build And Preview Production

```bash
npm run build
npm run preview
```

## 8. Quick Start (For Teammates)

If backend is already running on port `8080`, use only:

```bash
git clone https://github.com/CuongTu1806/learningVocabularyFrontend.git
cd learningVocabularyFrontend
npm install
npm run dev
```

## 9. Common Issues

### API calls fail or login does not work

- Ensure backend is running.
- Ensure backend URL is correct in `.env` (if used).
- If no `.env`, ensure backend is reachable at `http://localhost:8080`.

### Port `5173` is occupied

- Stop the process using that port, or run Vite on another port:

```bash
npm run dev -- --port 5174
```

### `npm install` fails

- Delete `node_modules` and `package-lock.json`, then reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

On Windows PowerShell:

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

## 10. Notes

- Commit source/config files only.
- Do not commit `.env`, `node_modules`, or build output (`dist`).
