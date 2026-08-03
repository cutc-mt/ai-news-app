"use client";

import { useState, useEffect } from "react";

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  source: string;
  date: string;
  category: string;
  url: string;
}

// APIのベースURL（ローカル開発時と本番で切り替え）
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Home() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["すべて"]);
  const [selectedCategory, setSelectedCategory] = useState("すべて");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // カテゴリ一覧を取得
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/categories`)
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch(() => {
        // APIが動いてない時はデフォルトのまま
      });
  }, []);

  // ニュース一覧を取得
  useEffect(() => {
    setLoading(true);
    setError(null);
    const params =
      selectedCategory !== "すべて"
        ? `?category=${encodeURIComponent(selectedCategory)}`
        : "";
    fetch(`${API_BASE_URL}/api/news${params}`)
      .then((res) => {
        if (!res.ok) throw new Error("API Error");
        return res.json();
      })
      .then((data) => {
        setNews(data);
        setLoading(false);
      })
      .catch((err) => {
        setError("ニュースの取得に失敗しました。APIサーバーが起動しているか確認してください。");
        setLoading(false);
      });
  }, [selectedCategory]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold tracking-tight">
            🤖 AI News Aggregator
          </h1>
          <p className="mt-2 text-indigo-100 text-lg">
            最新のAIニュースを一箇所に - Phase 2 (Frontend + Backend)
          </p>
        </div>
      </header>

      {/* カテゴリーフィルター */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-white text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="max-w-5xl mx-auto px-4 pb-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            ⚠️ {error}
          </div>
        </div>
      )}

      {/* ローディング */}
      {loading && (
        <div className="max-w-5xl mx-auto px-4 pb-16 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-slate-400 text-sm">読み込み中...</p>
        </div>
      )}

      {/* ニュース一覧 */}
      {!loading && (
        <div className="max-w-5xl mx-auto px-4 pb-16">
          <div className="grid gap-4">
            {news.map((item) => (
              <article
                key={item.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                      {item.category}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-slate-800 leading-snug">
                      {item.title}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                      {item.summary}
                    </p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                      <span className="font-medium text-slate-500">
                        📺 {item.source}
                      </span>
                      <span>📅 {item.date}</span>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-500 hover:text-indigo-600 font-medium"
                      >
                        元記事を見る →
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Phase表示 */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-sm font-medium px-4 py-2 rounded-full border border-green-200">
              ✅ Phase 2: Frontend + Backend API
            </div>
            <p className="mt-3 text-xs text-slate-400">
              API: {API_BASE_URL} / Phase 3: DB（TiDB） / Phase 4: Redis（Upstash）
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
