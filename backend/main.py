"""
AI News Aggregator - Backend API (Phase 5b)

Phase 5b: DB拡張対応・フィルタ機能追加
- 日付範囲フィルタ（date_from, date_to）
- タグ検索（tags）
- キーワード検索（q）
- 重複チェック（video_id）
"""
from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_, func as sa_func
from typing import Optional
import os
import json
from database import get_db, NewsItemDB, init_db
from cache import cache_get, cache_set, cache_delete, cache_health

app = FastAPI(
    title="AI News Aggregator API",
    description="AIニュースを集約するAPIサーバー",
    version="0.5.0",
)

# CORS設定（環境変数から取得）
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
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
    tags: Optional[str] = ""
    video_id: Optional[str] = ""
    channel_id: Optional[str] = ""
    infographic_url: Optional[str] = ""

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
    tags: Optional[str] = ""
    video_id: Optional[str] = ""
    channel_id: Optional[str] = ""
    infographic_url: Optional[str] = ""


class NewsUpdate(BaseModel):
    """ニュース更新用（全フィールドオプション）"""
    title: Optional[str] = None
    summary: Optional[str] = None
    source: Optional[str] = None
    date: Optional[str] = None
    category: Optional[str] = None
    url: Optional[str] = None
    tags: Optional[str] = None
    video_id: Optional[str] = None
    channel_id: Optional[str] = None
    infographic_url: Optional[str] = None


# --- 起動時 ---

@app.on_event("startup")
async def startup_event():
    if os.environ.get("SKIP_DB_INIT"):
        return
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
        version="0.5.0",
        redis=cache_health(),
    )


@app.get("/api/news", response_model=list[NewsItem])
async def get_news(
    category: Optional[str] = None,
    date_from: Optional[str] = Query(None, description="開始日 (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="終了日 (YYYY-MM-DD)"),
    tag: Optional[str] = Query(None, description="タグ検索"),
    q: Optional[str] = Query(None, description="キーワード検索（タイトル・概要）"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """
    ニュース一覧を取得（複数フィルタ対応）
    - category: カテゴリで絞り込み
    - date_from / date_to: 日付範囲
    - tag: タグ検索（部分一致）
    - q: キーワード検索（タイトル・概要の部分一致）
    - limit / offset: ページネーション
    """
    query = db.query(NewsItemDB)

    # カテゴリフィルタ
    if category and category != "すべて":
        query = query.filter(NewsItemDB.category == category)

    # 日付範囲フィルタ
    if date_from:
        query = query.filter(NewsItemDB.date >= date_from)
    if date_to:
        query = query.filter(NewsItemDB.date <= date_to)

    # タグ検索
    if tag:
        query = query.filter(NewsItemDB.tags.like(f"%{tag}%"))

    # キーワード検索
    if q:
        query = query.filter(
            or_(
                NewsItemDB.title.like(f"%{q}%"),
                NewsItemDB.summary.like(f"%{q}%"),
            )
        )

    items = query.order_by(
        NewsItemDB.date.desc(),
        NewsItemDB.id.desc()
    ).offset(offset).limit(limit).all()

    return items


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
    return item


@app.put("/api/news/{news_id}", response_model=NewsItem)
async def update_news(news_id: int, update: NewsUpdate, db: Session = Depends(get_db)):
    """ニュースを更新（インフォグラフィックURL、タイトル等）"""
    item = db.query(NewsItemDB).filter(NewsItemDB.id == news_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="News not found")

    # Noneでないフィールドのみ更新
    update_data = update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)

    # キャッシュをクリア
    cache_delete(f"news:id:{news_id}")
    cache_delete("news:all")

    return item


@app.post("/api/news", response_model=NewsItem)
async def create_news(news: NewsCreate, db: Session = Depends(get_db)):
    """ニュースを新規作成（video_id重複チェック付き）"""
    # video_idの重複チェック
    if news.video_id:
        existing = db.query(NewsItemDB).filter(
            NewsItemDB.video_id == news.video_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=409,
                detail=f"News with video_id '{news.video_id}' already exists"
            )

    db_news = NewsItemDB(**news.model_dump())
    db.add(db_news)
    db.commit()
    db.refresh(db_news)

    # 関連キャッシュを全て削除
    cache_delete("news:all")
    cache_delete("categories")
    cache_delete("tags")

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


@app.get("/api/tags")
async def get_tags(db: Session = Depends(get_db)):
    """全タグ一覧を取得（キャッシュ付き）"""
    cached = cache_get("tags")
    if cached is not None:
        return cached

    # 全レコードのtagsカラムからタグを抽出
    all_tags_raw = db.query(NewsItemDB.tags).filter(
        NewsItemDB.tags.isnot(None),
        NewsItemDB.tags != ""
    ).all()

    tag_set = set()
    for row in all_tags_raw:
        for tag in row[0].split(","):
            tag = tag.strip()
            if tag:
                tag_set.add(tag)

    tag_list = sorted(tag_list) if (tag_list := list(tag_set)) else []

    cache_set("tags", tag_list)
    return tag_list


@app.get("/api/stats")
async def get_stats(db: Session = Depends(get_db)):
    """統計情報を取得"""
    total = db.query(NewsItemDB).count()
    by_category = db.query(
        NewsItemDB.category,
        sa_func.count(NewsItemDB.id)
    ).group_by(NewsItemDB.category).all()

    return {
        "total": total,
        "by_category": {cat: count for cat, count in by_category},
    }


@app.get("/api/dates")
async def get_date_range(db: Session = Depends(get_db)):
    """ニュースの日付範囲を取得"""
    min_date = db.query(sa_func.min(NewsItemDB.date)).scalar()
    max_date = db.query(sa_func.max(NewsItemDB.date)).scalar()
    return {"from": min_date, "to": max_date}
