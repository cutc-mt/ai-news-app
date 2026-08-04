"""
AI News Aggregator - Backend API (Phase 3)

Phase 3: TiDB Cloud からデータを取得
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db, NewsItemDB, init_db

app = FastAPI(
    title="AI News Aggregator API",
    description="AIニュースを集約するAPIサーバー",
    version="0.3.0",
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


# --- データモデル（Pydantic）---

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


class NewsCreate(BaseModel):
    """ニュース新規作成用"""
    title: str
    summary: str
    source: str
    date: str
    category: str
    url: str


# --- 起動時にDBを初期化 ---

@app.on_event("startup")
async def startup_event():
    """サーバー起動時にDBテーブルと初期データを投入"""
    try:
        init_db()
    except Exception as e:
        print(f"⚠️ DB初期化エラー: {e}")


# --- APIエンドポイント ---

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """ヘルスチェック"""
    return HealthResponse(
        status="ok",
        service="ai-news-api",
        version="0.3.0",
    )


@app.get("/api/news", response_model=list[NewsItem])
async def get_news(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """ニュース一覧を取得（カテゴリフィルタ付き）"""
    query = db.query(NewsItemDB)
    if category and category != "すべて":
        query = query.filter(NewsItemDB.category == category)
    return query.order_by(NewsItemDB.date.desc(), NewsItemDB.id.desc()).all()


@app.get("/api/news/{news_id}", response_model=NewsItem)
async def get_news_by_id(news_id: int, db: Session = Depends(get_db)):
    """個別ニュースを取得"""
    item = db.query(NewsItemDB).filter(NewsItemDB.id == news_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="News not found")
    return item


@app.post("/api/news", response_model=NewsItem)
async def create_news(news: NewsCreate, db: Session = Depends(get_db)):
    """ニュースを新規作成"""
    db_news = NewsItemDB(**news.model_dump())
    db.add(db_news)
    db.commit()
    db.refresh(db_news)
    return db_news


@app.get("/api/categories")
async def get_categories(db: Session = Depends(get_db)):
    """カテゴリ一覧を取得"""
    categories = db.query(NewsItemDB.category).distinct().all()
    cat_list = [c[0] for c in categories]
    return ["すべて"] + sorted(cat_list)
