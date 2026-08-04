"""
Redis キャッシュレイヤー (Phase 4)
Upstash Redis REST API を使用
"""
import os
import json
import urllib.request
import urllib.error
from typing import Optional, Any

# 環境変数から取得
REDIS_URL = os.environ.get("UPSTASH_REDIS_REST_URL", "")
REDIS_TOKEN = os.environ.get("UPSTASH_REDIS_REST_TOKEN", "")

# キャッシュの有効期限（秒）
CACHE_TTL = 300  # 5分


def _redis_request(args: list) -> Optional[Any]:
    """Upstash REST APIに直接リクエスト"""
    if not REDIS_URL or not REDIS_TOKEN:
        return None
    try:
        req_data = json.dumps(args).encode("utf-8")
        req = urllib.request.Request(
            REDIS_URL,
            data=req_data,
            headers={
                "Authorization": f"Bearer {REDIS_TOKEN}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data.get("result")
    except Exception as e:
        print(f"⚠️ Redis error: {e}")
    return None


def cache_get(key: str) -> Optional[Any]:
    """キャッシュからデータを取得"""
    result = _redis_request(["GET", key])
    if result:
        try:
            return json.loads(result)
        except:
            return None
    return None


def cache_set(key: str, value: Any, ttl: int = CACHE_TTL) -> bool:
    """キャッシュにデータを保存"""
    data = json.dumps(value, ensure_ascii=False)
    result = _redis_request(["SET", key, data, "EX", str(ttl)])
    return result is not None


def cache_delete(key: str) -> bool:
    """キャッシュを削除"""
    result = _redis_request(["DEL", key])
    return result is not None


def cache_health() -> bool:
    """Redisのヘルスチェック"""
    result = _redis_request(["PING"])
    return result == "PONG"
