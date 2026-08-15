import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { developmentDiscoveryItems } from '../data/discovery.fixture'
import DiscoveryExplorer from './DiscoveryExplorer'

describe('DiscoveryExplorer URL state', () => {
  beforeEach(() => window.history.replaceState({}, '', '/'))

  it('carica query URL, usa pushState e ripristina tutto su popstate', async () => {
    window.history.replaceState({}, '', '/?view=timeline&types=set&q=berlin')
    render(<DiscoveryExplorer items={developmentDiscoveryItems} />)

    expect(await screen.findByRole('button', { name: 'Timeline', pressed: true })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sets', pressed: true })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Ricerca' })).toHaveValue('berlin')

    await userEvent.click(screen.getByRole('button', { name: 'Map' }))
    expect(window.location.search).toBe('?view=map&q=berlin&types=set')

    window.history.replaceState({}, '', '/?view=discovery&types=party&q=bucarest')
    window.dispatchEvent(new PopStateEvent('popstate'))

    await waitFor(() => expect(screen.getByRole('button', { name: 'Discovery', pressed: true })).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Parties', pressed: true })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Ricerca' })).toHaveValue('bucarest')
  })

  it('mostra All attivo e resetta filtri', async () => {
    render(<DiscoveryExplorer items={developmentDiscoveryItems} />)
    expect(await screen.findByRole('button', { name: 'All', pressed: true })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Sets' }))
    expect(screen.getByRole('button', { name: 'All', pressed: false })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'All' }))
    expect(screen.getByRole('button', { name: 'All', pressed: true })).toBeInTheDocument()
  })

  it('Map consuma solo luoghi geografici idonei con coordinate', async () => {
    window.history.replaceState({}, '', '/?view=map')
    render(<DiscoveryExplorer items={developmentDiscoveryItems} />)
    expect(await screen.findByText(/Berlin · \[Development\] Listening notes/)).toBeInTheDocument()
    expect(screen.getByText(/Lisbon · \[Development\] Lisbon set/)).toBeInTheDocument()
    expect(screen.queryByText(/Digital release/)).not.toBeInTheDocument()
  })
})
