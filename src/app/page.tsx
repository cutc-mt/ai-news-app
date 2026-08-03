"use client";

import { useState } from "react";

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  source: string;
  date: string;
  category: string;
  url: string;
}

// Phase 1: モックデータ（Phase 2でBackend APIに置き換え）
const MOCK_NEWS: NewsItem[] = [
  {
    id: 1,
    title: "GPT-6 Astraが数学の未解決問題10個を解決",
    summary: "OpenAIの次世代モデルAstraが、長年の数学難問を次々と解決。AGIへの道と言われる。",
    source: "World of AI",
    date: "2026-08-03",
    category: "AI Model",
    url: "https://www.youtube.com/watch?v=KbYio-N8_LU",
  },
  {
    id: 2,
    title: "MiniMax H3がオープンウエイトで公開",
    summary: "最大15秒・2Kの音声付き動画を生成できるマルチモーダルモデル。Seedanceより低価格。",
    source: "まさおAI",
    date: "2026-08-03",
    category: "Video AI",
    url: "https://www.youtube.com/watch?v=echFvKbKWsk",
  },
  {
    id: 3,
    title: "Gemini Sparkが日本上陸",
    summary: "160カ国以上に拡大。PCを閉じてもクラウド基盤で動き続けるAIエージェント。",
    source: "ずんめたラボ",
    date: "2026-08-03",
    category: "AI Agent",
    url: "https://www.youtube.com/watch?v=tpolizAdxg4",
  },
  {
    id: 4,
    title: "DeepSeek V4 Flash GA リリース",
    summary: "TerminalBench 82.7、GLM 5.2を全ベンチマークで撃破。MITライセンスで公開。",
    source: "World of AI",
    date: "2026-08-02",
    category: "AI Model",
    url: "https://www.youtube.com/watch?v=wT42SgaOPK4",
  },
  {
    id: 5,
    title: "Kimi K3 オープンウェイト化",
    summary: "ムーンショットAIのK3がFable 5やGPT 5.6に迫る性能。2.8兆パラメータ。",
    source: "あきらパパ",
    date: "2026-08-02",
    category: "AI Model",
    url: "https://www.youtube.com/watch?v=C-5l4iaHgKQ",
  },
  {
    id: 6,
    title: "Claude Opus 5が値上げなしで最強クラスに進化",
    summary: "Fable 5に迫る性能を半額で。プラン変更不要で即利用可能。",
    source: "2人注目ニュース",
    date: "2026-08-02",
    category: "AI Model",
    url: "https://www.youtube.com/watch?v=PzH8ie0dcOU",
  },
];

const CATEGORIES = ["すべて", "AI Model", "AI Agent", "Video AI"];

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("すべて");

  const filteredNews =
    selectedCategory === "すべて"
      ? MOCK_NEWS
      : MOCK_NEWS.filter((n) => n.category === selectedCategory);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold tracking-tight">
            🤖 AI News Aggregator
          </h1>
          <p className="mt-2 text-indigo-100 text-lg">
            最新のAIニュースを一箇所に - Phase 1 (Static)
          </p>
        </div>
      </header>

      {/* カテゴリーフィルター */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
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

      {/* ニュース一覧 */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid gap-4">
          {filteredNews.map((news) => (
            <article
              key={news.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                    {news.category}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-slate-800 leading-snug">
                    {news.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                    {news.summary}
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                    <span className="font-medium text-slate-500">
                      📺 {news.source}
                    </span>
                    <span>📅 {news.date}</span>
                    <a
                      href={news.url}
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
          <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 text-sm font-medium px-4 py-2 rounded-full border border-amber-200">
            🔧 Phase 1: Static Frontend
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Phase 2: Backend API（Cloud Run） / Phase 3: DB（TiDB） / Phase 4:
            Redis（Upstash）
          </p>
        </div>
      </div>
    </main>
  );
}
