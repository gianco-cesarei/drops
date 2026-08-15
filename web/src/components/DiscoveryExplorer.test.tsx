import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { developmentDiscoveryItems } from '../data/discovery.fixture'
import { DiscoveryEnvironment, MapEnvironment, TimelineEnvironment } from './DiscoveryExplorer'

describe('ambienti archivio autonomi', () => {
  beforeEach(() => history.replaceState({}, '', '/'))

  it('Discovery possiede ricerca, porte categorie e raccolte', async () => {
    render(<DiscoveryEnvironment items={developmentDiscoveryItems} />)
    expect(await screen.findByRole('search')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Porte categorie Discovery' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Stories' })).toBeInTheDocument()
    await userEvent.type(screen.getByRole('textbox', { name: 'Ricerca' }), 'Berlin')
    await userEvent.click(screen.getByRole('button', { name: 'Cerca' }))
    expect(location.search).toBe('?q=Berlin')
  })

  it('Timeline non ha ricerca, filtra e cambia densità', async () => {
    history.replaceState({}, '', '/timeline?types=set')
    render(<TimelineEnvironment items={developmentDiscoveryItems} />)
    expect(screen.queryByRole('search')).not.toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Sets', pressed: true })).toBeInTheDocument()
    expect(screen.getByText('Mese')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Aumenta densità' }))
    expect(screen.getByText('Giorno')).toBeInTheDocument()
  })

  it('Map usa coordinate europee, zoom e selezione luogo senza ricerca', async () => {
    history.replaceState({}, '', '/map')
    render(<MapEnvironment items={developmentDiscoveryItems} />)
    expect(screen.queryByRole('search')).not.toBeInTheDocument()
    expect(await screen.findByText('Viewport iniziale Europa')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Zoom avanti' }))
    expect(screen.getByText(/Europa · zoom 5/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Berlin' }))
    expect(screen.getByRole('heading', { name: 'Berlin' })).toBeInTheDocument()
    expect(screen.queryByText(/Digital release/)).not.toBeInTheDocument()
  })

  it('ripristina filtri su popstate dentro ambiente corrente', async () => {
    render(<TimelineEnvironment items={developmentDiscoveryItems} />)
    history.replaceState({}, '', '/timeline?types=party')
    dispatchEvent(new PopStateEvent('popstate'))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Parties', pressed: true })).toBeInTheDocument())
  })
})
