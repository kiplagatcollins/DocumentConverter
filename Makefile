PORT ?= 3000

.DEFAULT_GOAL := dev

.PHONY: help run serve dev build start test typecheck check validate clean install

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-10s %s\n", $$1, $$2}'

install: ## Install dependencies with bun
	bun install

run: dev ## Alias for dev

serve: dev ## Alias for dev

dev: ## Start Next.js dev server (override: make dev PORT=3001)
	bun run dev -- --port $(PORT)

build: ## Production build
	bun run build

start: ## Serve production build (run `make build` first)
	bun run start -- --port $(PORT)

test: ## Run vitest suite
	bun run test

typecheck: ## Run tsc --noEmit
	bun run typecheck

check: validate test typecheck build ## Validate, test, typecheck, and build

validate: ## Verify required Next.js files and bun deps exist
	@test -f app/page.tsx || (echo "missing app/page.tsx" && exit 1)
	@test -f app/layout.tsx || (echo "missing app/layout.tsx" && exit 1)
	@test -f lib/convert.ts || (echo "missing lib/convert.ts" && exit 1)
	@test -f package.json || (echo "missing package.json" && exit 1)
	@test -d node_modules/mammoth || (echo "missing dep: mammoth (run bun install)" && exit 1)
	@test -d node_modules/turndown || (echo "missing dep: turndown (run bun install)" && exit 1)
	@test -d node_modules/next || (echo "missing dep: next (run bun install)" && exit 1)
	@ls *.docx >/dev/null 2>&1 || (echo "warning: no sample .docx found" && exit 1)
	@echo "OK: all required files present."

clean: ## Remove build artifacts and caches
	rm -rf .next out coverage node_modules/.cache
	rm -rf dist wordtomd.zip
