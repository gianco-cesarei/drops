import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { developmentDiscoveryItems } from '../data/discovery.fixture'
import { DiscoveryEnvironment, MapEnvironment, TimelineEnvironment } from './DiscoveryExplorer'

describe('ambienti archivio autonomi', () => {
  beforeEach(() => history.replaceState({}, '', '/'))

  it('Discovery possiede ricerca, porte categorie e raccolte', async () => {
    render(<DiscoveryEnvironment items={developmentDiscoveryItems} />)
    expect(await screen.findByRole('search')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Categorie Grid' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Guide/ })).toBeInTheDocument()
    await userEvent.type(screen.getByRole('textbox', { name: 'Ricerca' }), 'Berlin')
    await userEvent.click(screen.getByRole('button', { name: 'Cerca' }))
    expect(location.search).toBe('?q=Berlin')
  })

  it('Timeline non ha ricerca, ordina cronologicamente e filtra categorie', async () => {
    history.replaceState({}, '', '/timeline')
    render(<TimelineEnvironment items={developmentDiscoveryItems} />)
    expect(screen.queryByRole('search')).not.toBeInTheDocument()
    expect(await screen.findByRole('link', { name: '2026' })).toBeInTheDocument()
    expect(screen.getByLabelText('Timeline Cronologica')).toBeInTheDocument()
  })

  it('Map usa coordinate europee e selezione interattiva per città', async () => {
    history.replaceState({}, '', '/map')
    render(<MapEnvironment items={developmentDiscoveryItems} />)
    expect(screen.queryByRole('search')).not.toBeInTheDocument()
    expect(await screen.findByLabelText('Mappa Europea dei Club e delle Scene')).toBeInTheDocument()
    expect(screen.getByText('🇪🇺 Europa')).toBeInTheDocument()
    expect(screen.getByText('🌎 Americhe')).toBeInTheDocument()
    expect(document.getElementById('europe-leaflet-map')).toBeInTheDocument()
  })

  it('ripristina filtri su popstate dentro ambiente corrente', async () => {
    render(<TimelineEnvironment items={developmentDiscoveryItems} />)
    history.replaceState({}, '', '/timeline?types=party')
    dispatchEvent(new PopStateEvent('popstate'))
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(2))
  })
})
