export default class History {
  constructor(identifier) {
    this._identifier = identifier;
    this._load();
  }

  _load() {
    let history = JSON.parse(localStorage.getItem(this._identifier));
    if (!history) {
      history = {};
    }

    this._history = history;
  }

  _save() {
    localStorage.setItem(this._identifier, JSON.stringify(this._history));
  }

  getItem(key) {
    return this._history[key];
  }

  setItem(key, value) {
    console.log("Setting", key, value);
    this._history[key] = value;
    this._save();
  }

  /**
   * Similar to setItem, but only for numeric values.
   * Value will only be written if current value is less or null
   * @param {string} key The key in the storage
   * @param {number} value The value to write, if applicable
   */
  upgradeItem(key, value) {
    console.log("Updated proposed", key, value);
    if (isNaN(value)) {
      console.warn("Calling History.upgradeItem with non-numeric value: ", value);
    }

    let currentValue = this.getItem(key);
    // generously override equal values, so 0 replaces null etc.
    // as numbers can't be equal without identity, there should be no risk
    if (isNaN(currentValue) ||  value >= currentValue) {
      console.log("Updated accepted", key, value);
      this.setItem(key, value);
    }
  }
}