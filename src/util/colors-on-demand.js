// all .lighten-3 from http://materializecss.com/color.html

const COLORS = [
  '#ef9a9a',
  '#b39ddb',
  '#ffcc80',
  '#c5e1a5',
  '#90caf9',
  '#fff59d',
  '#80deea',
  '#f48fb1',
  '#a5d6a7',
  '#9fa8da',
  '#e6ee9c',
  '#81d4fa',
  '#ffe082',
  '#80cbc4',
  '#ce93d8',
  '#ffab91',
]

var index = 0
var map = {}

export default function GetColorFor(identifier) {
  if (!map[identifier]) {
    map[identifier] = COLORS[index % COLORS.length]
    index += 1
  }

  return map[identifier]
}
