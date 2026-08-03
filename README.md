# AI News App

Full-stack AI News Aggregator application.

## Architecture

| Phase | Component | Tech |
|-------|-----------|------|
| Phase 1 ✅ | Frontend | Next.js 16 (Static Export) → Cloudflare Pages |
| Phase 2 🚧 | Backend | Python FastAPI → Cloud Run |
| Phase 3 📋 | Database | TiDB Cloud Starter (MySQL) |
| Phase 4 📋 | Cache | Upstash Redis |

## Project Structure

```
ai-news-app/
├── src/app/          # Next.js frontend
├── backend/          # FastAPI backend
│   ├── main.py       # API server
│   ├── Dockerfile    # Cloud Run用
│   └── requirements.txt
├── next.config.ts    # 静的書き出し設定
└── .env.local        # ローカル環境変数
```

## Development

### Frontend (ローカル)
```bash
npm run dev
# → http://localhost:3000
```

### Backend (ローカル)
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# → http://localhost:8000
# API docs: http://localhost:8000/docs
```

## URLs

- **Frontend**: https://***REDACTED***/
- **Backend API** (Phase 2): coming soon...
