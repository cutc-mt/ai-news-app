import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Home from '../app/page'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

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

describe('Phase 5a: タグフィルター', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/api/categories')) {
        return { ok: true, json: async () => ['すべて', 'AI Model', 'Video AI'] }
      }
      if (url.includes('/api/tags')) {
        return { ok: true, json: async () => ['GPT-6', 'MiniMax', 'OpenAI', '動画生成'] }
      }
      if (url.includes('/api/dates')) {
        return { ok: true, json: async () => ({ from: '2026-08-01', to: '2026-08-04' }) }
      }
      return { ok: true, json: async () => mockNews }
    })
  })

  it('タグ一覧が表示される', async () => {
    render(<Home />)

    await waitFor(() => {
      expect(screen.getByText('GPT-6 Astraリリース')).toBeInTheDocument()
    })

    // タグボタンが表示される
    expect(screen.getByRole('button', { name: /GPT-6/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /OpenAI/ })).toBeInTheDocument()
  })

  it('タグをクリックすると tag= パラメータ付きでAPIが呼ばれる', async () => {
    render(<Home />)

    await waitFor(() => {
      expect(screen.getByText('GPT-6 Astraリリース')).toBeInTheDocument()
    })

    // OpenAIタグをクリック
    fireEvent.click(screen.getByRole('button', { name: /OpenAI/ }))

    await waitFor(() => {
      const newsCalls = mockFetch.mock.calls.filter(
        ([url]) => typeof url === 'string' && url.includes('/api/news')
      )
      const lastCall = newsCalls[newsCalls.length - 1]
      expect(lastCall[0]).toContain('tag=OpenAI')
    })
  })

  it('選択中のタグを再度クリックすると解除される', async () => {
    render(<Home />)

    await waitFor(() => {
      expect(screen.getByText('GPT-6 Astraリリース')).toBeInTheDocument()
    })

    // タグをクリック
    const tagBtn = screen.getByRole('button', { name: /OpenAI/ })
    fireEvent.click(tagBtn)

    // 再度クリックで解除
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /OpenAI/ })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /OpenAI/ }))

    // tag= パラメータが消える
    await waitFor(() => {
      const newsCalls = mockFetch.mock.calls.filter(
        ([url]) => typeof url === 'string' && url.includes('/api/news')
      )
      const lastCall = newsCalls[newsCalls.length - 1]
      expect(lastCall[0]).not.toContain('tag=OpenAI')
    })
  })
})
