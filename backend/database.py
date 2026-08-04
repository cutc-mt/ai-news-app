"""
データベース設定とモデル定義
Phase 3: TiDB Cloud Starter (MySQL互換)
"""
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.sql import func
import os

# 接続情報（環境変数から取得）
DB_HOST = os.environ.get("DB_HOST", "***REDACTED***")
DB_PORT = os.environ.get("DB_PORT", "4000")
DB_USER = os.environ.get("DB_USER", "***REDACTED***")
DB_PASS = os.environ.get("DB_PASS", "")
DB_NAME = os.environ.get("DB_NAME", "test")

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}?ssl_verify_cert=true"

engine = create_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=300,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPIのDependency Injection用"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- モデル ---

class NewsItemDB(Base):
    """ニュースアイテムのDBモデル"""
    __tablename__ = "news_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(500), nullable=False)
    summary = Column(Text, nullable=False)
    source = Column(String(100), nullable=False)
    date = Column(String(10), nullable=False)
    category = Column(String(50), nullable=False)
    url = Column(String(500), nullable=False)
    created_at = Column(DateTime, server_default=func.now())


def init_db():
    """テーブルを作成し、初期データを投入"""
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    # 既にデータがある場合はスキップ
    if db.query(NewsItemDB).count() > 0:
        db.close()
        return

    initial_news = [
        NewsItemDB(
            title="GPT-6 Astraが数学の未解決問題10個を解決",
            summary="OpenAIの次世代モデルAstraが、長年の数学難問を次々と解決。AGIへの道と言われる。",
            source="World of AI",
            date="2026-08-03",
            category="AI Model",
            url="https://www.youtube.com/watch?v=KbYio-N8_LU",
        ),
        NewsItemDB(
            title="MiniMax H3がオープンウエイトで公開",
            summary="最大15秒・2Kの音声付き動画を生成できるマルチモーダルモデル。Seedanceより低価格。",
            source="まさおAI",
            date="2026-08-03",
            category="Video AI",
            url="https://www.youtube.com/watch?v=echFvKbKWsk",
        ),
        NewsItemDB(
            title="Gemini Sparkが日本上陸",
            summary="160カ国以上に拡大。PCを閉じてもクラウド基盤で動き続けるAIエージェント。",
            source="ずんめたラボ",
            date="2026-08-03",
            category="AI Agent",
            url="https://www.youtube.com/watch?v=tpolizAdxg4",
        ),
        NewsItemDB(
            title="DeepSeek V4 Flash GA リリース",
            summary="TerminalBench 82.7、GLM 5.2を全ベンチマークで撃破。MITライセンスで公開。",
            source="World of AI",
            date="2026-08-02",
            category="AI Model",
            url="https://www.youtube.com/watch?v=wT42SgaOPK4",
        ),
        NewsItemDB(
            title="Kimi K3 オープンウェイト化",
            summary="ムーンショットAIのK3がFable 5やGPT 5.6に迫る性能。2.8兆パラメータ。",
            source="あきらパパ",
            date="2026-08-02",
            category="AI Model",
            url="https://www.youtube.com/watch?v=C-5l4iaHgKQ",
        ),
        NewsItemDB(
            title="Claude Opus 5が値上げなしで最強クラスに進化",
            summary="Fable 5に迫る性能を半額で。プラン変更不要で即利用可能。",
            source="2人注目ニュース",
            date="2026-08-02",
            category="AI Model",
            url="https://www.youtube.com/watch?v=PzH8ie0dcOU",
        ),
    ]

    db.add_all(initial_news)
    db.commit()
    db.close()
    print(f"✅ 初期データ {len(initial_news)} 件を投入しました")
