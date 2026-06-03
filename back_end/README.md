# Back End

FastAPI backend for the AI decision e-commerce project. It currently contains:

- AI comparison/session APIs in `api/routes/ai.py`
- Product catalog APIs in `api/routes/product.py`
- Product database/session/model setup in `db/product_database.py`
- Product business logic in `service/product/product_service.py`
- Product schemas in `schemas/product.py`

## Setup

Run these commands from the repository root:

```powershell
cd back_end
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

If PowerShell blocks virtualenv activation, run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

## Start the Backend

Start the API server from inside `back_end`:

```powershell
uvicorn main:app --reload --host 127.0.0.1 --port 8002
```

The backend will be available at:

```text
http://127.0.0.1:8002
```

Useful checks:

```text
GET http://127.0.0.1:8002/health
GET http://127.0.0.1:8002/products
GET http://127.0.0.1:8002/products/meta/categories
GET http://127.0.0.1:8002/products/meta/brands
```

The frontend `front_end/next.config.ts` rewrites `/api/:path*` to `http://127.0.0.1:8002/:path*`, so frontend calls like `/api/products` will reach backend route `/products`.

## Pre-fill Product Data

The product seed data lives in:

```text
service/product/seed.py
```

Run the seed command from inside `back_end`:

```powershell
python -m service.product.seed
```

This creates or updates the product SQLite database:

```text
ecommerce.db
```

The seed script is idempotent for existing product slugs, so running it again will not duplicate the default products.

## Database Files

When commands are run from inside `back_end`, local SQLite files are created there:

- `ecommerce.db` for product catalog data
- `data.db` for AI comparison sessions, messages, and logs

Both files are ignored by `.gitignore`.

## AI Module Note

The AI comparison module uses `langgraph`, `langchain-core`, `langchain-ollama`, and an Ollama model configured in `service/ai/llm.py`:

```text
qwen2.5:7b
```

Product catalog APIs do not require Ollama, but AI chat/compare APIs do.
