FRONTEND_PORT ?= 3003
BACKEND_HOST ?= 127.0.0.1
BACKEND_PORT ?= 8002
FRONTEND_CMD ?= npm run dev
BACKEND_PYTHON ?= .venv/bin/python
BACKEND_RELOAD ?=

.PHONY: dev frontend backend

dev:
	$(MAKE) -j2 backend frontend

frontend:
	cd front_end && PORT=$(FRONTEND_PORT) $(FRONTEND_CMD)

backend:
	cd back_end && PORT=$(BACKEND_PORT) $(BACKEND_PYTHON) -m uvicorn main:app $(BACKEND_RELOAD) --host $(BACKEND_HOST) --port $(BACKEND_PORT)
