import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import Home from '../app/page'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('Phase 5e: インフォグラフィックリンク', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/api/categories')) {
        return { ok: true, json: async () => ['すべて', 'AI Model'] }
      }
      if (url.includes('/api/tags')) {
        return { ok: true, json: async () => [] }
      }
      if (url.includes('/api/news')) {
        return {
          ok: true,
          json: async () => [{
            id: 1,
            title: 'GPT-6リリース',
            summary: 'OpenAIの新モデル',
            source: 'World of AI',
            date: '2026-08-04',
            category: 'AI Model',
            url: 'https://youtube.com/watch?v=test1',
            infographic_url: 'https://example.com/infographic.html',
          }]
        }
      }
      return { ok: true, json: async () => [] }
    })
  })

  it('インフォグラフィックURLがある場合、リンクが表示される', async () => {
    render(<Home />)
    await waitFor(() => {
      expect(screen.getByText('GPT-6リリース')).toBeInTheDocument()
    })
    expect(screen.getByText(/インフォグラフィック/)).toBeInTheDocument()
  })

  it('インフォグラフィックリンクが正しいURLを指す', async () => {
    render(<Home />)
    await waitFor(() => {
      expect(screen.getByText('GPT-6リリース')).toBeInTheDocument()
    })
    const link = screen.getByText(/インフォグラフィック/)
    expect(link.getAttribute('href')).toBe('https://example.com/infographic.html')
  })
})
