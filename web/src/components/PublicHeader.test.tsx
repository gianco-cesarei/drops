import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import PublicHeader from './PublicHeader'

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

describe('PublicHeader', () => {
  it('mostra Login senza sessione e mantiene errori sessione silenziosi', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse({}, 401)))
    render(<PublicHeader />)
    await waitFor(() => expect(screen.getAllByRole('link', { name: 'Login' })[0]).toHaveAttribute('aria-busy', 'false'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('mantiene API offline silenziosa e mostra Login', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new TypeError('offline')))
    render(<PublicHeader />)
    await waitFor(() => expect(screen.getAllByRole('link', { name: 'Login' })[0]).toHaveAttribute('aria-busy', 'false'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('mostra Area privata verso download solo dopo sessione valida', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse({ user: { username: 'dj' } })))
    render(<PublicHeader />)
    expect(screen.queryByRole('link', { name: 'Area privata' })).not.toBeInTheDocument()
    const links = await screen.findAllByRole('link', { name: 'Area privata' })
    expect(links).toHaveLength(2)
    expect(links.every((link) => link.getAttribute('href') === '/app/download')).toBe(true)
  })

  it('espone menu pubblico richiesto nella pagina login', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse({}, 401)))
    render(<PublicHeader pathname="/app/login" />)
    await userEvent.click(screen.getByRole('button', { name: 'Menu' }))
    expect(screen.getAllByRole('link', { name: 'Discovery' })).toHaveLength(2)
    expect(screen.getAllByRole('link', { name: 'Suggests' })).toHaveLength(2)
    expect(screen.getAllByLabelText('Drops home')).toHaveLength(2)
    expect(screen.getAllByRole('link', { name: 'Download' })).toHaveLength(2)
  })

  it('centra i tre ambienti come navigazione distinta', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse({}, 401)))
    render(<PublicHeader pathname="/timeline" />)
    const environments = screen.getByRole('navigation', { name: 'Ambienti di esplorazione' })
    expect(environments).toHaveTextContent('GridTimelineMap')
    expect(screen.getByRole('link', { name: 'Timeline' })).toHaveClass('active')
  })
})
