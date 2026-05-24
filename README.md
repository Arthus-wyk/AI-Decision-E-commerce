# AI Decision E-commerce

Full-stack demo e-commerce app with:

- FastAPI backend
- SQLite database
- Next.js frontend
- cart, checkout, orders, favorites, account auth
- superadmin control panel
- AI shopping assistant

## Prerequisites

Install these before running the project:

- Python 3.11+ recommended
- Node.js 20+ or Bun 1.1+
- Git
- SQLite support, bundled with Python on most systems

For the AI assistant:

- An AI Gateway API key for the frontend `AI_GATEWAY_API_KEY`
- Optional: Ollama if using the older backend AI comparison module in `back_end/service/ai`

## Project Structure

```text
back_end/   FastAPI API, SQLite models, seed data
front_end/  Next.js app
```

Default local ports:

```text
Backend:  http://127.0.0.1:8002
Frontend: http://localhost:3003
```

## Backend Setup

From the repo root:

```bash
cd back_end
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

On Windows PowerShell:

```powershell
cd back_end
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create `back_end/.env`:

```env
FRONTEND_URL=http://localhost:3003
SUPERADMIN_EMAILS=admin@example.com
```

`SUPERADMIN_EMAILS` is comma-separated. Example:

```env
SUPERADMIN_EMAILS=admin@example.com,owner@example.com
```

Start the backend:

```bash
cd back_end
.venv/bin/uvicorn main:app --reload --host 127.0.0.1 --port 8002
```

Windows:

```powershell
cd back_end
.\.venv\Scripts\uvicorn.exe main:app --reload --host 127.0.0.1 --port 8002
```

Health check:

```text
http://127.0.0.1:8002/health
```

## Seed Products

Run this once after backend dependencies are installed:

```bash
cd back_end
.venv/bin/python -m service.product.seed
```

Windows:

```powershell
cd back_end
.\.venv\Scripts\python.exe -m service.product.seed
```

This creates/updates:

```text
back_end/ecommerce.db
```

The seed command is idempotent for existing product slugs.

## Frontend Setup

From the repo root:

```bash
cd front_end
bun install
```

If your team uses npm instead:

```bash
cd front_end
npm install
```

Create `front_end/.env`:

```env
PORT=3003
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8002
AI_GATEWAY_API_KEY=your_ai_gateway_key_here
AI_GATEWAY_MODEL=google/gemini-2.5-flash
```

If you do not set `AI_GATEWAY_API_KEY`, the AI assistant route will fail, but the normal catalog/cart/admin features can still run.

Start the frontend:

```bash
cd front_end
bun run dev
```

Open:

```text
http://localhost:3003
```

## Superadmin Login

1. Add your email to `back_end/.env`:

```env
SUPERADMIN_EMAILS=your-email@example.com
```

2. Restart the backend.
3. Sign up or log in with that email.
4. Open:

```text
http://localhost:3003/admin
```

The backend promotes matching emails at runtime and persists `is_superadmin` in SQLite.

## Common Commands

Backend compile check:

```bash
python3 -m py_compile back_end/main.py back_end/api/routes/*.py
```

Frontend start local dev:

```bash
cd front_end
bun run dev
```

Frontend lint:

```bash
cd front_end
bun run lint
```

Frontend production build:

```bash
cd front_end
bun run build
```

## Database Files

Generated locally and ignored by Git:

```text
back_end/ecommerce.db
back_end/data.db
```

If your local data becomes invalid during development, stop the backend, delete the DB files, seed products again, and restart the backend.

## Troubleshooting

Backend cannot connect from frontend:

- confirm backend is running on `127.0.0.1:8002`
- confirm `front_end/.env` has `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8002`
- restart the frontend after changing `.env`

Admin page redirects away:

- confirm the login email is in `SUPERADMIN_EMAILS`
- restart backend after changing `back_end/.env`
- log out and log in again

No products:

- run the seed command
- confirm `back_end/ecommerce.db` exists

AI assistant fails:

- confirm `front_end/.env` has `AI_GATEWAY_API_KEY`
- confirm `AI_GATEWAY_MODEL` is available for your key

Port already in use:

- stop the process using `8002` or `3003`
- or run backend/frontend on matching alternate ports and update `NEXT_PUBLIC_API_BASE_URL`
