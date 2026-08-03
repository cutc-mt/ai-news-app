"""
AI News Aggregator - Backend API (Phase 2)

Phase 2: モックデータを返すAPI
Phase 3以降: TiDB Cloud + Upstash Redis連携
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import date

app = FastAPI(
    title="AI News Aggregator API",
    description="AIニュースを集約するAPIサーバー",
    version="0.1.0",
)

# CORS設定（Cloudflare Pagesからのアクセスを許可）
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://***REDACTED***",  # 本番Frontend
        "http://localhost:3000",               # ローカル開発用
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- データモデル ---

class NewsItem(BaseModel):
    id: int
    title: str
    summary: str
    source: str
    date: str
    category: str
    url: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


# --- モックデータ（Phase 3でTiDBに移行）---

MOCK_NEWS: list[NewsItem] = [
    NewsItem(
        id=1,
        title="GPT-6 Astraが数学の未解決問題10個を解決",
        summary="OpenAIの次世代モデルAstraが、長年の数学難問を次々と解決。AGIへの道と言われる。",
        source="World of AI",
        date="2026-08-03",
        category="AI Model",
        url="https://www.youtube.com/watch?v=KbYio-N8_LU",
    ),
    NewsItem(
        id=2,
        title="MiniMax H3がオープンウエイトで公開",
        summary="最大15秒・2Kの音声付き動画を生成できるマルチモーダルモデル。Seedanceより低価格。",
        source="まさおAI",
        date="2026-08-03",
        category="Video AI",
        url="https://www.youtube.com/watch?v=echFvKbKWsk",
    ),
    NewsItem(
        id=3,
        title="Gemini Sparkが日本上陸",
        summary="160カ国以上に拡大。PCを閉じてもクラウド基盤で動き続けるAIエージェント。",
        source="ずんめたラボ",
        date="2026-08-03",
        category="AI Agent",
        url="https://www.youtube.com/watch?v=tpolizAdxg4",
    ),
    NewsItem(
        id=4,
        title="DeepSeek V4 Flash GA リリース",
        summary="TerminalBench 82.7、GLM 5.2を全ベンチマークで撃破。MITライセンスで公開。",
        source="World of AI",
        date="2026-08-02",
        category="AI Model",
        url="https://www.youtube.com/watch?v=wT42SgaOPK4",
    ),
    NewsItem(
        id=5,
        title="Kimi K3 オープンウェイト化",
        summary="ムーンショットAIのK3がFable 5やGPT 5.6に迫る性能。2.8兆パラメータ。",
        source="あきらパパ",
        date="2026-08-02",
        category="AI Model",
        url="https://www.youtube.com/watch?v=C-5l4iaHgKQ",
    ),
    NewsItem(
        id=6,
        title="Claude Opus 5が値上げなしで最強クラスに進化",
        summary="Fable 5に迫る性能を半額で。プラン変更不要で即利用可能。",
        source="2人注目ニュース",
        date="2026-08-02",
        category="AI Model",
        url="https://www.youtube.com/watch?v=PzH8ie0dcOU",
    ),
]


# --- APIエンドポイント ---

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """ヘルスチェック"""
    return HealthResponse(
        status="ok",
        service="ai-news-api",
        version="0.1.0",
    )


@app.get("/api/news", response_model=list[NewsItem])
async def get_news(category: Optional[str] = None):
    """ニュース一覧を取得（カテゴリフィルタ付き）"""
    if category and category != "すべて":
        return [n for n in MOCK_NEWS if n.category == category]
    return MOCK_NEWS


@app.get("/api/news/{news_id}", response_model=NewsItem)
async def get_news_by_id(news_id: int):
    """個別ニュースを取得"""
    for item in MOCK_NEWS:
        if item.id == news_id:
            return item
    raise HTTPException(status_code=404, detail="News not found")


@app.get("/api/categories")
async def get_categories():
    """カテゴリ一覧を取得"""
    categories = list(set(n.category for n in MOCK_NEWS))
    return ["すべて"] + sorted(categories)
