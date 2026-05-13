# Contributing to Solum AI 🧠

Thank you for your interest in contributing! Solum AI is open source and welcomes contributions of all kinds — bug fixes, new features, documentation improvements, and eval dataset additions.

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- An [OpenRouter](https://openrouter.ai) API key (free)

### Local Setup

**Backend**
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Add your OPENROUTER_API_KEY to .env

uvicorn main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000

npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## How to Contribute

### 1. Fork the repo
Click **Fork** on the GitHub repo page.

### 2. Create a branch
```bash
git checkout -b feat/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 3. Make your changes
Follow the code style guidelines below.

### 4. Test your changes
- Run the backend locally and test with a few prompts
- Make sure the pipeline completes without errors
- Check the `/metrics` endpoint still works

### 5. Commit with a clear message
```bash
git commit -m "feat: add support for GraphQL API schema generation"
```

### 6. Push and open a Pull Request
```bash
git push origin feat/your-feature-name
```

Then open a PR on GitHub with a clear description of what you changed and why.

---

## Commit Message Format

We follow a simple convention:

| Prefix | When to use |
|--------|-------------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `chore:` | Config, deps, tooling |
| `refactor:` | Code restructure, no behavior change |
| `test:` | Adding or fixing tests |

---

## Code Style

### Python (Backend)
- Follow PEP 8
- Use type hints on all functions
- Use Pydantic models for all data contracts — no raw dicts between pipeline stages
- Keep each pipeline stage in its own file
- Log at `INFO` level for stage start/complete, `WARNING` for retries

### TypeScript (Frontend)
- Use TypeScript strict mode
- Keep components in `frontend/components/`
- Keep API calls in `frontend/lib/api.ts`
- No inline styles longer than 5 properties — extract to a variable

---

## Areas Where Contributions Are Welcome

- 🧩 **New schema layers** — e.g. Docker Compose, GitHub Actions CI/CD
- 🔧 **Better repair prompts** — improve the surgical repair engine
- 📊 **Eval dataset** — add more real-world or edge case prompts to `backend/eval/dataset.json`
- 🌐 **Runtime targets** — add Django, Rails, or other framework code generators
- 🎨 **Frontend improvements** — better schema visualization
- 📝 **Documentation** — improve README, add examples

---

## Questions?

Open a [GitHub Issue](https://github.com/krtechie/solum-ai/issues) and tag it with `question`.
