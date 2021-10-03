type TrackAnalysis = any

const podcastRegexGenerator =
  (name: string, regex: RegExp) =>
  (title: string, analysis: TrackAnalysis): [string, TrackAnalysis] => {
    try {
      // @ts-ignore
      const [match, number] = title.match(regex)

      analysis.podcast = {
        name,
        number,
      }

      return [title.replace(match, ''), analysis]
    } catch (error) {
      console.error(error)
      throw Error(`Failed to extract "${name}" series on "${title}"`)
    }
  }

const podcastRegex: {
  [filter: string]: (
    title: string,
    analysis: TrackAnalysis,
  ) => [string, TrackAnalysis]
} = {
  Montagssorbet: (title, analysis) => {
    // @ts-ignore
    let number = parseInt(title.match(/#\d+/gi)[0].substring(1))
    title = title
      .replace(/Montagssorbet mit Laut & Luise/, '')
      .replace(new RegExp(`#${number}:?`), '')

    analysis.podcast = {
      name: 'Montagssorbet',
      number: number,
    }

    return [title, analysis]
  },
  'Das Haett Es Frueher Nicht Gegeben': podcastRegexGenerator(
    "'Das Haett Es Fruher Nicht Gegeben' Podcast",
    /Das Haett Es Frueher Nicht Gegeben #(\d+)/,
  ),
  Seasidetrip: podcastRegexGenerator('Seasidetrip', /Seasidetrip (\d+) by/i),
  'Jakarta Radio': podcastRegexGenerator(
    'Jakarta Radio',
    /Jakarta Radio (\d+):/i,
  ),
  'Radio Juicy Vol': podcastRegexGenerator(
    'Radio Juicy',
    /Radio Juicy Vol\. (\d+)/i,
  ),
  'Deep Afterhour Nr': podcastRegexGenerator(
    'Deep Afterhour',
    /Deep Afterhour Nr\. (\d+)/i,
  ),
  'beatverliebt. in': (title, analysis) => {
    // @ts-ignore
    let number = parseInt(title.match(/\| \d+/i)[0].substring(2))
    title = title.replace(/\| \d+/i, '').replace(/beatverliebt\. in/i, '')

    analysis.podcast = {
      name: 'beatverliebt',
      number: number,
    }

    return [title, analysis]
  },
  'RA.': podcastRegexGenerator('Resident Advisor', /RA\.(\d+)/i),
  'Flight Club': podcastRegexGenerator('Flight Club', /Flight Club №(\d+)/i),
  '333 Sessions': podcastRegexGenerator(
    'Flow Sessions',
    /333 Sessions 0?(\d+)/i,
  ),
  DIM: podcastRegexGenerator('Dimensions', /DIM(\d+)/),
  Kellersinfonie: podcastRegexGenerator(
    'Kellersinfonie',
    /Kellersinfonie °(\d+)/,
  ),
  IST: podcastRegexGenerator('IST', /IST (\d+)\\/),
  'ecos del mundo': podcastRegexGenerator(
    'ecos del mundo',
    /ecos del mundo (\d+)/,
  ),
  'Wuza Waves': podcastRegexGenerator('Wuza Waves', /Wuza Waves #(\d+)/),
}

export default podcastRegex
