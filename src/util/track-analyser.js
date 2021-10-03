import Utilities from './util'
import VenueAnalyser from './venue-analyser'
import PodcastRegex from './podcast-regex'

const DATE_REGEX =
  /(\d{1,2}([.\/\-])\d{1,2}([.\/\-])\d{2,4})|(\d{4}\s?-\s?\d{2}\s?-\s?\d{2})|(\d{5}\d*)/
const PODCAST_REGEX =
  /((([-|])\s*)?[^(\-|\|)]+)?(cast|mix|sessions)(\s-)?\s?((#\s?)|nr\.?)?\d{1,3}(\s*(-|by|I))?/gi // todo: abstract redundant patterns

export default function AnalyseTrackTitle(track) {
  let title = track.title
  let analysis = {}

  ;[title, analysis] = VenueAnalyser.analyse(title, analysis)

  for (let query in PodcastRegex) {
    if (title.includes(query)) {
      ;[title, analysis] = PodcastRegex[query](title, analysis)
    }
  }

  title = title.replace(/free ((download)|(dl))/gi, '')
  title = title.replace(/download/gi, '')
  title = title.replace(/tracklist( available)?/gi, '')

  // remove the artist name, with some creativity
  let artist_name_regex = track.user.username
    .replace(/podcast/gi, '') // we'll treat the word "podcast" later
    .replace(/\*/gi, '')
    .replace(/[\s_-]/g, '[\\s_-]?')

  title = title.replace(new RegExp(artist_name_regex, 'gi'), '')

  // strip leading symbols caused by above reduction
  title = Utilities.Trim(title, ['-', ':'], 1)

  if (DATE_REGEX.test(title)) {
    let date = title.match(DATE_REGEX)[0]
    title = title.replace(date, '')
    analysis.date = date.replace(/\s/g, '')
  }

  // anything after '@' should be the location (without the @ itself)
  if (title.includes('@')) {
    let atIndex = title.lastIndexOf('@')
    let location = title.substring(atIndex + 1, title.length)
    location = Utilities.Trim(location, ['-', ':', ',', '/', '|'])
    analysis.location = location

    title = title.substring(0, atIndex)
  }

  ;['Seebühne', 'Dubstation', 'Luftschloss'].forEach((location) => {
    const locationRegex = new RegExp(location, 'i')
    if (locationRegex.test(title)) {
      analysis.location =
        (analysis.location ? analysis.location + ', ' : '') + location
      title = title.replace(locationRegex, '')
    }
  })

  let podcast = title.match(PODCAST_REGEX)
  if (podcast) {
    podcast = podcast[0]
    title = title.replace(podcast, '')

    let name = podcast.match(/[^(\-|)]*(cast|mix|sessions)/gi)[0].trim()
    if (name.toLowerCase() === 'podcast') {
      name = track.user.username + ' Podcast'
    }

    let numberMatch = podcast.match(/#\d+/)
    if (numberMatch) {
      // if there is a number with a leading `#`, always take that
      numberMatch = numberMatch[0].replace('#', '')
    } else {
      // otherwise take the last number found
      let matches = podcast.match(/\d{1,3}/)
      numberMatch = matches[matches.length - 1]
    }
    let number = parseInt(numberMatch)

    analysis.podcast = {
      name: name,
      number: number,
    }
  }

  // remove empty brackets, braces etc.
  title = title.replace(/(\(\s*\))|(\[\s*])/g, '')
  // replace the unnecessary dash in "- (" combo
  title = title.replace(/-\s*\(/g, '(')
  // replace double-separators by single version
  title = title.replace(/\|\s*\|/, '|')
  title = title.replace(/-\s*-/, '-')
  title = title.replace(/www\./, '')
  title = title.replace(/\.de|\.com/, '')
  // strip leading symbols caused by above reductions
  title = Utilities.Trim(title, ['—', '-', ':', '|'])

  // if only the word 'live' remains, remove
  if (title.toLowerCase() === 'live' || title.toLowerCase() === 'liveset') {
    title = ''
    analysis.live = true
  }

  if (title === 'in') {
    title = ''
  }

  analysis.name = title.length > 0 ? title : null

  return analysis
}
