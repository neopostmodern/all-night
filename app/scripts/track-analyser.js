import Utilities from './util'

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

const DATE_REGEX = /\d{1,2}\.\d{2}\.\d{2,4}/;

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
    analysis.date = title.match(DATE_REGEX)[0];
    title = title.replace(analysis.date, '');
  }

  // anything after '@' should be the location (without the @ itself)
  if (title.includes('@')) {
    let atIndex = title.indexOf('@');
    let location = title.substring(atIndex + 1, title.length);
    location = Utilities.Trim(location, ['-', ':']);
    analysis.location = location;

    title = title.substring(0, atIndex);
  }

  let podcast = title.match(/(-\s*)?[^-]+cast\s?#?\d+(\s*(-|(by)))?/gi);
  if (podcast) {
    podcast = podcast[0];
    title = title.replace(podcast, '');

    let name = podcast.match(/[^-]+cast/gi)[0].trim();
    if (name.toLowerCase() == 'podcast') {
      name = track.user.username + " Podcast";
    }

    let number = parseInt(podcast.match(/#?\d+/)[0].replace('#', ''));

    analysis.podcast = {
      name: name,
      number: number
    };
  }

  // remove empty brackets, braces etc.
  title = title.replace(/(\(\s*\))|(\[\s*\])/g, '');
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

  if (analysis.location) {
    analysis.location = Utilities.CropString(analysis.location, title.length > 30 ? 20 : 40);
  }

  title = Utilities.CropString(title, analysis.location ? 60 - analysis.location.length : 60);

  analysis.name = title.length > 0 ? title : null;

  return analysis;
}