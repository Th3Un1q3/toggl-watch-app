import {gettext} from 'i18n';
import {ElementWrapper} from './document-helper';
import {lazyDecorator} from '../../common/utils/lazy-decorator';
import {formatTimeSection} from './date-utils';

const TIME_ENTRY_HIDDEN_TILE_CLASS = 'item-wrapper--hidden';
const TIME_ENTRY_BILLABLE_CLASS = 'item__billing--billable';
const BACKGROUND_HIGHLIGHT_CLASS = 'item__background--active';
const REGULAR_TEXT_COLOR = 'fb-white';

/**
 * Allows to interact with a time entries log tile.
 */
class EntriesLogTile {
  /**
   * Defines a tile element
   * @param {HTMLElement|Document} tile
   */
  constructor(tile) {
    this._tileElement = tile;
    this.tile = new ElementWrapper(this._tileElement);
    lazyDecorator(this, 'background', () => this._childrenWithId('background'));
    lazyDecorator(this, 'wrapper', () => this._childrenWithId('wrapper'));
    lazyDecorator(this, 'billing', () => this._childrenWithId('billable'));
    lazyDecorator(this, 'project', () => this._childrenWithId('project'));
    lazyDecorator(this, 'duration', () => this._childrenWithId('duration'));
    lazyDecorator(this, 'description', () => this._childrenWithId('description'));
    this._assignHighlighting();
  }

  /**
   * Turns the tile into placeholder mode.
   * The mode is used for the first tile which is not time entry.
   */
  enablePlaceholderMode() {
    this._tileElement.onclick = () => {
    };
    this.wrapper.addClass(TIME_ENTRY_HIDDEN_TILE_CLASS);
  }

  /**
   * Turns the tile into loading mode, to make its loading smoother
   */
  displayLoading() {
    this.description.text = gettext('log_description_loading');
    this.project.text = gettext('log_project_loading');
    this.project.fill = REGULAR_TEXT_COLOR;
    this.duration.text = '--:--';
    this.billing.removeClass(TIME_ENTRY_BILLABLE_CLASS);
    this.wrapper.removeClass(TIME_ENTRY_HIDDEN_TILE_CLASS);
  }

  /**
   * Configures tile to display time entry
   * @param {Object} timeEntry
   */
  displayTimeEntryInfo(timeEntry) {
    this.project.text = timeEntry.projectName;
    this.project.fill = timeEntry.color;
    this.description.text = timeEntry.desc;

    const duration = new Date(timeEntry.stop - timeEntry.start);

    this.duration.text = [
      formatTimeSection(duration.getUTCHours()),
      formatTimeSection(duration.getUTCMinutes()),
      formatTimeSection(duration.getUTCSeconds()),
    ].join(':');

    if (timeEntry.bil) {
      this.billing.addClass(TIME_ENTRY_BILLABLE_CLASS);
    } else {
      this.billing.removeClass(TIME_ENTRY_BILLABLE_CLASS);
    }
  }

  /**
   * Assigns on click action to the tile
   * @param {function} callback
   * @return {EntriesLogTile}
   */
  onClick(callback) {
    this._tileElement.onclick = callback;
    return this;
  }


  /**
   * Helps to get an element with id
   * @param {string} childrenId
   * @return {ElementWrapper}
   * @private
   */
  _childrenWithId(childrenId) {
    return new ElementWrapper(this._tileElement.getElementById(childrenId));
  }

  /**
   * Assigns highlighting on element
   * @private
   */
  _assignHighlighting() {
    const tile = this._tileElement;

    if (tile.onmousedown) {
      return;
    }

    let highlightingTimeOut;

    tile.onmouseup = () => this.background.removeClass(BACKGROUND_HIGHLIGHT_CLASS);

    tile.onmousedown = () => {
      if (highlightingTimeOut) {
        clearTimeout(highlightingTimeOut);
      }
      this.background.addClass(BACKGROUND_HIGHLIGHT_CLASS);
      highlightingTimeOut = setTimeout(() => {
        this.background.removeClass(BACKGROUND_HIGHLIGHT_CLASS);
      }, 300);
    };
  }
}

export {
  TIME_ENTRY_BILLABLE_CLASS,
  BACKGROUND_HIGHLIGHT_CLASS,
  TIME_ENTRY_HIDDEN_TILE_CLASS,
  EntriesLogTile,
  REGULAR_TEXT_COLOR,
};
