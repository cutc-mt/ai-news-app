"""
API更新エンドポイントのテスト（TDD）
Phase 5e: PUT /api/news/{id}
"""
import pytest
import os
os.environ['SKIP_DB_INIT'] = '1'

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from main import app
from database import get_db, NewsItemDB, Base
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# テスト用インメモリSQLite
test_engine = create_engine('sqlite:///:memory:', connect_args={'check_same_thread': False})
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

Base.metadata.create_all(bind=test_engine)


def override_get_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

# テストデータ投入
db = TestSession()
db.add(NewsItemDB(
    id=1, title='Test', summary='Test summary', source='TestSource',
    date='2026-08-04', category='AI Model', url='https://example.com',
    tags='', video_id='test1', channel_id='@test', infographic_url=''
))
db.commit()
db.close()

client = TestClient(app, raise_server_exceptions=False)


class TestUpdateNews:
    """PUT /api/news/{id} のテスト"""

    def test_update_infographic_url(self):
        """インフォグラフィックURLを更新できる"""
        # まず1件取得してから更新
        response = client.put(
            '/api/news/1',
            json={'infographic_url': 'https://example.com/infographic.html'}
        )
        assert response.status_code == 200
        data = response.json()
        assert data['infographic_url'] == 'https://example.com/infographic.html'

    def test_update_news_not_found(self):
        """存在しないIDは404"""
        response = client.put(
            '/api/news/99999',
            json={'infographic_url': 'https://example.com/test.html'}
        )
        assert response.status_code == 404

    def test_update_title_and_summary(self):
        """タイトルと概要も更新できる"""
        response = client.put(
            '/api/news/1',
            json={
                'title': '日本語タイトル',
                'summary': '日本語の概要文です',
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data['title'] == '日本語タイトル'
        assert data['summary'] == '日本語の概要文です'
