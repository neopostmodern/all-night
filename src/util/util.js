export default {
  CropString: function (string, maximumLength) {
    if (string.length > maximumLength) {
      return string.substring(0, maximumLength - 3) + '...'
    }

    return string
  },

  Trim: function (string, characters, type = 0, trimBeforeAndAfter = true) {
    if (trimBeforeAndAfter) {
      string = string.trim()
    }

    characters.forEach((character) => {
      if (string.startsWith(character) && type != 2) {
        string = string.substring(1)
      }
      if (string.endsWith(character) && type != 1) {
        string = string.substring(0, string.length - 1)
      }
    })

    if (trimBeforeAndAfter) {
      string = string.trim()
    }

    return string
  },
}
