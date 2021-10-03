const Venues = [
  {
    matcher: /(garbicz)|(garbitch)/i,
    name: 'Garbicz',
    id: 'garbicz',
  },
  {
    matcher: /3000(°|\s?Grad)/i,
    name: '3000°',
    id: '3000-grad',
  },
  {
    matcher: /(fusion)|(plan:? *et +c( +(alpha|beta|gamma))?)/gi,
    name: 'Fusion',
    id: 'fusion',
  },
  {
    matcher: /(:\/\/)?about\s?blank/i,
    name: '://about blank',
    id: 'aboutblank',
  },
  {
    matcher: /burning man/i,
    name: 'Burning Man',
    id: 'burning-man',
  },
  {
    matcher: /pl(ö|oe)tzlich am meer/i,
    name: 'Plötzlich',
    id: 'ploetzlich',
  },
  {
    matcher: /kater\s?blau/i,
    name: 'Kater Blau',
    id: 'kater',
  },
  {
    matcher: /feel\s?musik/i,
    name: 'Feel',
    id: 'feel',
  },
  {
    matcher: /dimensions ((festival)|\d{4})/i,
    name: 'Dimensions',
    id: 'dimensions',
  },
]

export default {
  analyse(title, analysis) {
    let venue = Venues.find(({ matcher }) => matcher.test(title))
    if (venue) {
      analysis.venue = venue.id
      title = title
        .replace(venue.matcher, '')
        .replace(/festival/i, '')
        .replace(/20[12]\d/, '')
    }

    return [title, analysis]
  },

  getName(venueId) {
    return Venues.find(({ id }) => venueId === id).name
  },
}
