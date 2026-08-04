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
]

describe('Phase 5a: キーワード検索', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/api/categories')) {
        return { ok: true, json: async () => ['すべて', 'AI Model'] }
      }
      if (url.includes('/api/tags')) {
        return { ok: true, json: async () => [] }
      }
      if (url.includes('/api/dates')) {
        return { ok: true, json: async () => ({ from: '2026-08-04', to: '2026-08-04' }) }
      }
      return { ok: true, json: async () => mockNews }
    })
  })

  it('検索ボックスが表示される', async () => {
    render(<Home />)

    await waitFor(() => {
      expect(screen.getByText('GPT-6 Astraリリース')).toBeInTheDocument()
    })

    expect(screen.getByPlaceholderText(/検索/)).toBeInTheDocument()
  })

  it('検索ボックスに入力すると q= パラメータ付きでAPIが呼ばれる', async () => {
    render(<Home />)

    await waitFor(() => {
      expect(screen.getByText('GPT-6 Astraリリース')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText(/検索/)
    fireEvent.change(input, { target: { value: 'GPT' } })

    // デバウンス後にAPIが呼ばれる
    await waitFor(() => {
      const newsCalls = mockFetch.mock.calls.filter(
        ([url]) => typeof url === 'string' && url.includes('/api/news')
      )
      const lastCall = newsCalls[newsCalls.length - 1]
      expect(lastCall[0]).toContain('q=GPT')
    })
  })
})
