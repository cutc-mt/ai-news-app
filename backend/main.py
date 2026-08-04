"""
AI News Aggregator - Backend API (Phase 4)

Phase 4: Upstash Redis キャッシュ追加
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db, NewsItemDB, init_db
from cache import cache_get, cache_set, cache_delete, cache_health

app = FastAPI(
    title="AI News Aggregator API",
    description="AIニュースを集約するAPIサーバー",
    version="0.4.0",
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://***REDACTED***",
        "http://localhost:3000",
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

    class Config:
        from_attributes = True


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    redis: bool


class NewsCreate(BaseModel):
    title: str
    summary: str
    source: str
    date: str
    category: str
    url: str


# --- 起動時 ---

@app.on_event("startup")
async def startup_event():
    try:
        init_db()
    except Exception as e:
        print(f"⚠️ DB初期化エラー: {e}")


# --- APIエンドポイント ---

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """ヘルスチェック（Redis状態付き）"""
    return HealthResponse(
        status="ok",
        service="ai-news-api",
        version="0.4.0",
        redis=cache_health(),
    )


@app.get("/api/news", response_model=list[NewsItem])
async def get_news(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """ニュース一覧を取得（Redisキャッシュ付き）"""
    # キャッシュキー生成
    cache_key = f"news:{category or 'all'}"

    # 1. キャッシュ確認
    cached = cache_get(cache_key)
    if cached is not None:
        print(f"✅ Cache HIT: {cache_key}")
        return cached

    # 2. DBから取得
    print(f"❌ Cache MISS: {cache_key}")
    query = db.query(NewsItemDB)
    if category and category != "すべて":
        query = query.filter(NewsItemDB.category == category)
    items = query.order_by(NewsItemDB.date.desc(), NewsItemDB.id.desc()).all()

    # Pydanticモデルに変換
    result = [NewsItem.model_validate(item).model_dump() for item in items]

    # 3. キャッシュに保存
    cache_set(cache_key, result)

    return result


@app.get("/api/news/{news_id}", response_model=NewsItem)
async def get_news_by_id(news_id: int, db: Session = Depends(get_db)):
    """個別ニュースを取得"""
    cache_key = f"news:id:{news_id}"
    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    item = db.query(NewsItemDB).filter(NewsItemDB.id == news_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="News not found")

    result = NewsItem.model_validate(item).model_dump()
    cache_set(cache_key, result)
    return result


@app.post("/api/news", response_model=NewsItem)
async def create_news(news: NewsCreate, db: Session = Depends(get_db)):
    """ニュースを新規作成（キャッシュを無効化）"""
    db_news = NewsItemDB(**news.model_dump())
    db.add(db_news)
    db.commit()
    db.refresh(db_news)

    # 関連キャッシュを全て削除
    cache_delete("news:all")
    cache_delete("news:None")
    # カテゴリ別キャッシュも削除
    for cat in ["AI Model", "AI Agent", "Video AI"]:
        cache_delete(f"news:{cat}")

    return db_news


@app.get("/api/categories")
async def get_categories(db: Session = Depends(get_db)):
    """カテゴリ一覧を取得（キャッシュ付き）"""
    cached = cache_get("categories")
    if cached is not None:
        return cached

    categories = db.query(NewsItemDB.category).distinct().all()
    cat_list = ["すべて"] + sorted([c[0] for c in categories])

    cache_set("categories", cat_list)
    return cat_list
