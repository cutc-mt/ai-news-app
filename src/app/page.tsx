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
  tags?: string;
  video_id?: string;
  channel_id?: string;
  infographic_url?: string;
}

// APIのベースURL
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// 日付フィルターの選択肢
type DateFilter = "all" | "today" | "week" | "month";

const DATE_LABELS: Record<DateFilter, string> = {
  all: "全期間",
  today: "今日",
  week: "週間",
  month: "月間",
};

// 今日の日付をYYYY-MM-DDで取得
function getTodayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// dateFromを計算
function getDateFrom(filter: DateFilter): string | null {
  const today = new Date();
  if (filter === "today") return getTodayStr();
  if (filter === "week") {
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return weekAgo.toISOString().slice(0, 10);
  }
  if (filter === "month") {
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return monthAgo.toISOString().slice(0, 10);
  }
  return null;
}

export default function Home() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["すべて"]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("すべて");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // カテゴリ一覧を取得
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/categories`)
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch(() => {});
  }, []);

  // タグ一覧を取得
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/tags`)
      .then((res) => res.json())
      .then((data) => setTags(data))
      .catch(() => {});
  }, []);

  // ニュース一覧を取得（カテゴリ + 日付 + タグフィルタ）
  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (selectedCategory !== "すべて") {
      params.set("category", selectedCategory);
    }
    const dateFrom = getDateFrom(dateFilter);
    if (dateFrom) {
      params.set("date_from", dateFrom);
    }
    if (selectedTag) {
      params.set("tag", selectedTag);
    }
    if (searchQuery.trim()) {
      params.set("q", searchQuery.trim());
    }
    const queryStr = params.toString();
    const url = `${API_BASE_URL}/api/news${queryStr ? "?" + queryStr : ""}`;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("API Error");
        return res.json();
      })
      .then((data) => {
        setNews(data);
        setLoading(false);
      })
      .catch(() => {
        setError("ニュースの取得に失敗しました。");
        setLoading(false);
      });
  }, [selectedCategory, dateFilter, selectedTag, searchQuery]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold tracking-tight">
            🤖 AI News Aggregator
          </h1>
          <p className="mt-2 text-indigo-100 text-lg">
            最新のAIニュースを一箇所に
          </p>
        </div>
      </header>

      {/* フィルターエリア */}
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-3">
        {/* 検索ボックス */}
        <input
          type="text"
          placeholder="🔍 キーワード検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />

        {/* カテゴリーフィルター */}
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

        {/* 日付フィルター */}
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-sm text-slate-500 font-medium">📅 期間:</span>
          {(Object.keys(DATE_LABELS) as DateFilter[]).map((key) => (
            <button
              key={key}
              onClick={() => setDateFilter(key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                dateFilter === key
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-white text-slate-600 hover:bg-slate-200"
              }`}
            >
              {DATE_LABELS[key]}
            </button>
          ))}
        </div>

        {/* タグフィルター */}
        {tags.length > 0 && (
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-sm text-slate-500 font-medium">🏷️ タグ:</span>
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  selectedTag === tag
                    ? "bg-teal-600 text-white shadow-md"
                    : "bg-white text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
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
                        元動画を見る →
                      </a>
                      {item.infographic_url && (
                        <a
                          href={item.infographic_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-500 hover:text-purple-600 font-medium"
                        >
                          📊 インフォグラフィックを見る →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
