FROM python:3.12-slim

WORKDIR /app

# システムのCA証明書を更新（TiDB SSL接続用）
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

# 依存関係のインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコードのコピー
COPY . .

# ポート8080を公開（Cloud Runのデフォルト）
EXPOSE 8080

# uvicornで起動
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]
