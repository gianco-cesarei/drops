export type BrainNodeType = 'Artist' | 'Label' | 'City' | 'Release' | 'Set' | 'Playlist' | 'Party' | 'Story' | 'Signal'
export type BrainCluster = 'rom' | 'house' | 'soul' | 'mania' | 'city'

export type BrainNodeFixture = {
  id: string
  type: BrainNodeType
  cluster: BrainCluster
  city?: string
  meta: string
}

export type BrainLinkFixture = {
  source: string
  target: string
  relation: string
  momentum?: boolean
}

const seedNodes: BrainNodeFixture[] = [
  { id: 'GNMR', type: 'Artist', cluster: 'rom', city: 'Cattolica', meta: 'Producer IT · alias Ashade · in forte crescita (suonato da Jane Fitz a Houghton)' },
  { id: 'Jane Fitz', type: 'Artist', cluster: 'rom', city: 'Londra', meta: 'DJ UK · hypnotic/deep · co-fondatrice Night Moves' },
  { id: 'Francesco Del Garda', type: 'Artist', cluster: 'rom', city: 'Manfredonia', meta: 'DJ/producer IT (1978) · fondatore Timeless' },
  { id: 'DJ Koolt', type: 'Artist', cluster: 'rom', city: 'Buenos Aires', meta: 'Selector vinyl-only AR · orbita Nicolas Lutz' },
  { id: 'DJ Masda', type: 'Artist', cluster: 'rom', city: 'Berlino', meta: 'JP → Berlino · co-fondatore Cabaret Recordings' },
  { id: 'Nicolas Lutz', type: 'Artist', cluster: 'rom', city: 'Bristol', meta: 'Connettore chiave · fondatore My Own Jupiter · Houghton 2025' },
  { id: 'Jade Seatle', type: 'Artist', cluster: 'rom', city: 'Londra', meta: 'Co-fondatrice Night Moves con Jane Fitz' },
  { id: 'Rhadoo', type: 'Artist', cluster: 'rom', city: 'Bucarest', meta: 'rpr soundsystem · co-fondatore [a:rpia:r]' },
  { id: 'Raresh', type: 'Artist', cluster: 'rom', city: 'Bucarest', meta: 'rpr soundsystem · [a:rpia:r] · fondatore Melliflow' },
  { id: 'Petre Inspirescu', type: 'Artist', cluster: 'rom', city: 'Bucarest', meta: 'rpr soundsystem · co-fondatore [a:rpia:r]' },
  { id: 'Dan Ghenacia', type: 'Artist', cluster: 'house', city: 'Parigi', meta: 'Paris house · Freak n\' Chic · Apollonia (trio) · AWEED · nuova SMAPS (2026) · playlist YT = contenuto Playlist' },
  { id: 'Dyed Soundorom', type: 'Artist', cluster: 'house', city: 'Parigi', meta: 'Apollonia trio' },
  { id: 'Shonky', type: 'Artist', cluster: 'house', city: 'Parigi', meta: 'Apollonia trio' },
  { id: 'Anthea', type: 'Artist', cluster: 'house', city: 'Berlino', meta: 'DJ italiana a Berlino · fondatrice Marmo Music · invitata da Mania+WOS' },
  { id: 'Move D', type: 'Artist', cluster: 'soul', city: 'Heidelberg', meta: 'Ponte soulful/deep' },
  { id: 'Francesco Maria', type: 'Artist', cluster: 'mania', city: 'Roma', meta: 'Mania (Roma) · scoperta da seguire' },
  { id: 'Andrea Saba', type: 'Artist', cluster: 'mania', city: 'Roma', meta: 'Mania (Roma) · profilo RA · scoperta da seguire' },
  { id: 'Alessandro Addi', type: 'Artist', cluster: 'mania', city: 'Roma', meta: 'Mania (Roma) · scoperta da seguire' },
  { id: 'Nic Siena', type: 'Artist', cluster: 'mania', city: 'Roma', meta: 'Mania (Roma) · scoperta da seguire' },
  { id: 'Oliviero', type: 'Artist', cluster: 'mania', city: 'Berlino', meta: 'WOS Sound System (Berlino) · profilo RA' },
  { id: 'Timeless', type: 'Label', cluster: 'rom', city: 'Manfredonia', meta: 'Francesco Del Garda' },
  { id: 'Cabaret Recordings', type: 'Label', cluster: 'rom', city: 'Tokyo', meta: 'Co-fondata da DJ Masda' },
  { id: 'Night Moves', type: 'Label', cluster: 'rom', city: 'Londra', meta: 'Jane Fitz & Jade Seatle · anche party · imprint For Those That Knoe' },
  { id: 'My Own Jupiter', type: 'Label', cluster: 'rom', city: 'Bristol', meta: 'Nicolas Lutz' },
  { id: '[a:rpia:r]', type: 'Label', cluster: 'rom', city: 'Bucarest', meta: 'rpr soundsystem — spina dorsale rominimal · anche party' },
  { id: 'Melliflow', type: 'Label', cluster: 'rom', city: 'Bucarest', meta: 'Etichetta di Raresh' },
  { id: 'Yoyaku', type: 'Label', cluster: 'rom', city: 'Parigi', meta: 'Store + label + distribuzione · hub' },
  { id: 'Apollonia', type: 'Label', cluster: 'house', city: 'Parigi', meta: 'Trio Ghenacia · Dyed Soundorom · Shonky (dal 2012)' },
  { id: "Freak n' Chic", type: 'Label', cluster: 'house', city: 'Parigi', meta: 'Storica di Dan Ghenacia (2002–2009)' },
  { id: 'AWEED', type: 'Label', cluster: 'house', city: 'Parigi', meta: 'Dan Ghenacia (2022)' },
  { id: 'SMAPS', type: 'Label', cluster: 'house', city: 'Parigi', meta: 'Nuova etichetta/party di Dan Ghenacia (2026) — da mappare' },
  { id: 'Marmo Music', type: 'Label', cluster: 'house', city: 'Berlino', meta: 'Etichetta di Anthea · house/minimal' },
  { id: 'Perlon', type: 'Label', cluster: 'soul', city: 'Berlino', meta: 'Berlino · ponte verso Soulful Minimal' },
  { id: 'Houghton', type: 'Party', cluster: 'rom', city: 'Norfolk', meta: 'Festival-ancora della scena · ha ospitato Jane Fitz, Masda, Nicolas Lutz…' },
  { id: 'Mania', type: 'Party', cluster: 'mania', city: 'Roma', meta: 'Collettivo/party Roma · house & minimal · debutto a Berlino (Marmorbar, feb 2025)' },
  { id: 'WOS Sound System', type: 'Party', cluster: 'mania', city: 'Berlino', meta: 'Collettivo/party Berlino · Oliviero · asse Roma↔Berlino con Mania' },
]

const seedLinks: BrainLinkFixture[] = [
  ['Francesco Del Garda', 'Timeless', 'fondatore'], ['DJ Masda', 'Cabaret Recordings', 'co-fondatore'],
  ['Jane Fitz', 'Night Moves', 'co-fondatrice'], ['Jade Seatle', 'Night Moves', 'co-fondatrice'],
  ['Nicolas Lutz', 'My Own Jupiter', 'fondatore'], ['Rhadoo', '[a:rpia:r]', 'fondatore'],
  ['Raresh', '[a:rpia:r]', 'fondatore'], ['Petre Inspirescu', '[a:rpia:r]', 'fondatore'],
  ['Raresh', 'Melliflow', 'fondatore'], ['DJ Koolt', 'Nicolas Lutz', 'suona con'],
  ['Rhadoo', 'Raresh', 'rpr soundsystem'], ['Raresh', 'Petre Inspirescu', 'rpr soundsystem'],
  ['Rhadoo', 'Petre Inspirescu', 'rpr soundsystem'], ['Jane Fitz', 'Jade Seatle', 'Night Moves'],
  ['Yoyaku', 'My Own Jupiter', 'distribuisce'], ['Yoyaku', 'Melliflow', 'distribuisce'],
  ['Yoyaku', 'Night Moves', 'distribuisce'], ['Dan Ghenacia', "Freak n' Chic", 'fondatore'],
  ['Dan Ghenacia', 'Apollonia', 'co-fondatore'], ['Dyed Soundorom', 'Apollonia', 'co-fondatore'],
  ['Shonky', 'Apollonia', 'co-fondatore'], ['Dan Ghenacia', 'AWEED', 'fondatore'],
  ['Dan Ghenacia', 'SMAPS', 'fondatore'], ['Dan Ghenacia', 'Dyed Soundorom', 'Apollonia b2b2b'],
  ['Dyed Soundorom', 'Shonky', 'Apollonia b2b2b'], ['Dan Ghenacia', 'Shonky', 'Apollonia b2b2b'],
  ['Anthea', 'Marmo Music', 'fondatrice'], ['[a:rpia:r]', 'Perlon', 'affinità scena'],
  ['Perlon', 'Move D', 'affinità soulful'], ['DJ Masda', 'Perlon', 'Berlino'],
  ['Apollonia', 'Yoyaku', 'distribuzione/Parigi'], ['Apollonia', 'Perlon', 'affinità house/tech'],
  ['Anthea', 'Perlon', 'Berlino/house'], ['Houghton', 'Jane Fitz', 'ha ospitato'],
  ['Houghton', 'DJ Masda', 'ha ospitato'], ['Houghton', 'Nicolas Lutz', 'ha ospitato'],
  ['Francesco Maria', 'Mania', 'membro'], ['Andrea Saba', 'Mania', 'membro'],
  ['Alessandro Addi', 'Mania', 'membro'], ['Nic Siena', 'Mania', 'membro'],
  ['Oliviero', 'WOS Sound System', 'membro'], ['Mania', 'WOS Sound System', 'party Roma↔Berlino · Marmorbar 2025'],
  ['Mania', 'Anthea', 'ha invitato (2025)'], ['WOS Sound System', 'Anthea', 'ha invitato (2025)'],
  ['WOS Sound System', 'Perlon', 'asse Berlino'],
].map(([source, target, relation]) => ({ source, target, relation }))

seedLinks.push({ source: 'Jane Fitz', target: 'GNMR', relation: 'suona GNMR a Houghton 2025 · video virale (momentum)', momentum: true })

const cities = [...new Set(seedNodes.flatMap((node) => node.city ? [node.city] : []))]
const cityNodes: BrainNodeFixture[] = cities.map((city) => ({ id: `📍${city}`, type: 'City', cluster: 'city', meta: `Città: ${city}` }))
const cityLinks: BrainLinkFixture[] = seedNodes.flatMap((node) => node.city ? [{ source: node.id, target: `📍${node.city}`, relation: 'ha sede' }] : [])

export const brainGraphNodes = [...seedNodes, ...cityNodes]
export const brainGraphLinks = [...seedLinks, ...cityLinks]
