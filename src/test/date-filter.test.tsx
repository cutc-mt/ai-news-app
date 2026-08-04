import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Home from '../app/page'

// fetchをモック
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// モックデータ
const mockNews = [
  {
    id: 1,
    title: "GPT-6 Astraリリース",
    summary: "OpenAIの次世代モデル",
    source: "World of AI",
    date: "2026-08-04",
    category: "AI Model",
    url: "https://youtube.com/watch?v=test1",
    tags: "GPT-6,OpenAI",
    video_id: "test1",
    channel_id: "@WorldofAI",
    infographic_url: "",
  },
  {
    id: 2,
    title: "MiniMax H3公開",
    summary: "動画生成AIの新モデル",
    source: "まさおAI",
    date: "2026-08-01",
    category: "Video AI",
    url: "https://youtube.com/watch?v=test2",
    tags: "MiniMax,動画生成",
    video_id: "test2",
    channel_id: "@ai_masaou",
    infographic_url: "",
  },
]

describe('Phase 5a: 日付フィルター', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    // デフォルト: 全件返す
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/api/categories')) {
        return {
          ok: true,
          json: async () => ['すべて', 'AI Model', 'Video AI'],
        }
      }
      if (url.includes('/api/tags')) {
        return {
          ok: true,
          json: async () => ['GPT-6', 'MiniMax', 'OpenAI', '動画生成'],
        }
      }
      if (url.includes('/api/dates')) {
        return {
          ok: true,
          json: async () => ({ from: '2026-08-01', to: '2026-08-04' }),
        }
      }
      // デフォルト: news
      return {
        ok: true,
        json: async () => mockNews,
      }
    })
  })

  it('日付フィルターのボタンが表示される', async () => {
    render(<Home />)

    await waitFor(() => {
      expect(screen.getByText('すべて')).toBeInTheDocument()
    })

    // 日付フィルターのボタンが表示される
    expect(screen.getByRole('button', { name: /今日/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /全期間/ })).toBeInTheDocument()
  })

  it('「今日」を選ぶと今日の日付でフィルタAPIが呼ばれる', async () => {
    render(<Home />)

    await waitFor(() => {
      expect(screen.getByText('GPT-6 Astraリリース')).toBeInTheDocument()
    })

    // 「今日」ボタンをクリック
    const todayButton = screen.getByRole('button', { name: /今日/ })
    fireEvent.click(todayButton)

    // APIが date_from パラメータ付きで呼ばれる
    await waitFor(() => {
      const newsCalls = mockFetch.mock.calls.filter(
        ([url]) => typeof url === 'string' && url.includes('/api/news')
      )
      const lastCall = newsCalls[newsCalls.length - 1]
      expect(lastCall[0]).toContain('date_from=')
    })
  })

  it('「全期間」を選ぶと日付フィルタなしでAPIが呼ばれる', async () => {
    render(<Home />)

    await waitFor(() => {
      expect(screen.getByText('GPT-6 Astraリリース')).toBeInTheDocument()
    })

    // まず「今日」をクリック
    fireEvent.click(screen.getByRole('button', { name: /今日/ }))

    // その後「全期間」をクリック
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /全期間/ })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /全期間/ }))

    // 最後のAPIコールに date_from が含まれない
    await waitFor(() => {
      const newsCalls = mockFetch.mock.calls.filter(
        ([url]) => typeof url === 'string' && url.includes('/api/news')
      )
      const lastCall = newsCalls[newsCalls.length - 1]
      expect(lastCall[0]).not.toContain('date_from=')
    })
  })
})
