import Utilities from './util'
import VenueAnalyser from './venue-analyser'

let specialPodcastTreatments = {
  'Montagssorbet': (title, analysis) => {
    let number = parseInt(title.match(/#\d+/gi)[0].substring(1));
    title = title.replace(/Montagssorbet mit Laut & Luise - #\d+:/, "");

    analysis.podcast = {
      name: "Montagssorbet",
      number: number
    };

    return [title, analysis];
  },
  'Das Haett Es Frueher Nicht Gegeben': (title, analysis) => {
    let number = parseInt(title.match(/#\d+/i)[0].substring(1));
    title = title.replace(/Das Haett Es Frueher Nicht Gegeben #\d+/, "");
    analysis.podcast = {
      name: "'Das Haett Es Fruher Nicht Gegeben' Podcast",
      number: number
    };

    return [title, analysis];
  },
  'Seasidetrip': (title, analysis) => {
    let number = parseInt(title.match(/Seasidetrip \d+/i)[0].substring(12));
    title = title.replace(/Seasidetrip \d+ by/i, "");
    analysis.podcast = {
      name: 'Seasidetrip',
      number: number
    };

    return [title, analysis];
  },
  'Jakarta Radio': (title, analysis) => {
    let number = parseInt(title.match(/Jakarta Radio \d+/i)[0].substring(14));
    title = title.replace(/Jakarta Radio \d+:/i, "");
    analysis.podcast = {
      name: 'Jakarta Radio',
      number: number
    };

    return [title, analysis];
  },
  'Radio Juicy Vol': (title, analysis) => {
    let number = parseInt(title.match(/Radio Juicy Vol\. \d+/i)[0].substring(17));
    title = title.replace(/Radio Juicy Vol\. \d+/i, "");
    analysis.podcast = {
      name: 'Radio Juicy',
      number: number
    };

    return [title, analysis];
  },
  'Deep Afterhour Nr': (title, analysis) => {
    let number = parseInt(title.match(/Deep Afterhour Nr\. \d+/i)[0].substring(19));
    title = title.replace(/- Deep Afterhour Nr\. \d+/i, "");

    analysis.podcast = {
      name: 'Deep Afterhour',
      number: number
    };

    return [title, analysis];
  },
  'beatverliebt. in': (title, analysis) => {
    let number = parseInt(title.match(/\| \d+/i)[0].substring(2));
    title = title.replace(/\| \d+/i, "").replace(/beatverliebt\. in/i, "");

    analysis.podcast = {
      name: 'beatverliebt',
      number: number
    };

    return [title, analysis];
  }
};

const DATE_REGEX = /(\d{1,2}(\.|\/|-)\d{1,2}(\.|\/|-)\d{2,4})|(\d{4}\s?-\s?\d{2}\s?-\s?\d{2})|(\d{5}\d*)/;
const PODCAST_REGEX = /((\-|\|)\s*)?[^(\-|\|)]+((cast)|(mix))\s?(#\s?)?\d{1,3}(\s*(-|(by)))?/gi; // todo: abstract redundant patterns

export default function AnalyseTrackTitle(track) {
  let title = track.title;
  let analysis = {};

  for (let query in specialPodcastTreatments) {
    if (title.includes(query)) {
      [title, analysis] = specialPodcastTreatments[query](title, analysis);
    }
  }

  title = title.replace(/free ((download)|(dl))/gi, '');
  title = title.replace(/download/gi, '');
  title = title.replace(/tracklist( available)?/gi, '');

  // remove the artist name, with some creativity
  let artist_name_regex = track.user.username
    .replace(/podcast/gi, '') // we'll treat the word "podcast" later
    .replace(/\*/gi, '')
    .replace(/[\s_-]/g, '[\\s_-]?');

  title = title.replace(new RegExp(artist_name_regex, 'gi'), '');

  // strip leading symbols caused by above reduction
  title = Utilities.Trim(title, ['-', ':'], 1);

  if (DATE_REGEX.test(title)) {
    let date = title.match(DATE_REGEX)[0];
    title = title.replace(date, '');
    analysis.date = date.replace(/\s/g, '');
  }

  [title, analysis] = VenueAnalyser.analyse(title, analysis);

  // anything after '@' should be the location (without the @ itself)
  if (title.includes('@')) {
    let atIndex = title.lastIndexOf('@');
    let location = title.substring(atIndex + 1, title.length);
    location = Utilities.Trim(location, ['-', ':', ',', '/', '|']);
    analysis.location = location;

    title = title.substring(0, atIndex);
  }

  let podcast = title.match(PODCAST_REGEX);
  if (podcast) {
    podcast = podcast[0];
    title = title.replace(podcast, '');

    let name = podcast.match(/[^(\-|\|)]+((cast)|(mix))/gi)[0].trim();
    if (name.toLowerCase() == 'podcast') {
      name = track.user.username + " Podcast";
    }

    let numberMatch = podcast.match(/#\d+/);
    if (numberMatch) { // if there is a number with a leading `#`, always take that
      numberMatch = numberMatch[0].replace('#', '');
    } else { // otherwise take the last number found
      let matches = podcast.match(/\d{1,3}/);
      numberMatch = matches[matches.length - 1];
    }
    let number = parseInt(numberMatch);

    analysis.podcast = {
      name: name,
      number: number
    };
  }

  // remove empty brackets, braces etc.
  title = title.replace(/(\(\s*\))|(\[\s*\])/g, '');
  // replace the unnecessary dash in "- (" combo
  title = title.replace(/-\s*\(/g, '(');
  // replace double-separators by single version
  title = title.replace(/\|\s*\|/, '|');
  title = title.replace(/-\s*-/, '-');
  // strip leading symbols caused by above reductions
  title = Utilities.Trim(title, ['-', ':', '|']);

  // if only the word 'live' remains, remove
  if (title.toLowerCase() === 'live' || title.toLowerCase() === 'liveset') {
    title = '';
    analysis.live = true;
  }

  analysis.name = title.length > 0 ? title : null;

  return analysis;
}