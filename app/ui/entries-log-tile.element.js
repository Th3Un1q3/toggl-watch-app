import {gettext} from 'i18n';
import {lazyDecorator} from '../../common/utils/lazy-decorator';
import {formatTimeSection} from './date-utils';
import {EID} from './selectors';
import {$do} from './lib/ui-action';
import {addClass} from './actions/add-class';
import {setText} from './actions/set-text';
import {setFill} from './actions/set-fill';
import {removeClass} from './actions/remove-class';

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
    lazyDecorator(this, 'background', () => this._childrenWithId(EID.LogTileBackground));
    lazyDecorator(this, 'wrapper', () => this._childrenWithId(EID.LogTileWrapper));
    lazyDecorator(this, 'billing', () => this._childrenWithId(EID.LogTileBillableMark));
    lazyDecorator(this, 'project', () => this._childrenWithId(EID.LogTileProjectName));
    lazyDecorator(this, 'duration', () => this._childrenWithId(EID.LogTileDuration));
    lazyDecorator(this, 'description', () => this._childrenWithId(EID.LogTileEntryDescription));
    this._assignHighlighting();
  }

  /**
   * Turns the tile into placeholder mode.
   * The mode is used for the first tile which is not time entry.
   */
  enablePlaceholderMode() {
    this._tileElement.onclick = () => {};
    $do(this.wrapper, addClass, TIME_ENTRY_HIDDEN_TILE_CLASS);
  }

  /**
   * Turns the tile into loading mode, to make its loading smoother
   */
  displayLoading() {
    $do(this.description, setText, gettext('log_description_loading'));
    $do(this.project, setText, gettext('log_project_loading'));
    $do(this.project, setFill, REGULAR_TEXT_COLOR);
    $do(this.duration, setText, '--:--:--');
    $do(this.billing, removeClass, TIME_ENTRY_BILLABLE_CLASS);
    $do(this.wrapper, removeClass, TIME_ENTRY_HIDDEN_TILE_CLASS);
    this.teardown();
  }

  teardown() {
    this._clearLazyProperties();
  }

  /**
   * Configures tile to display time entry
   * @param {Object} timeEntry
   */
  displayTimeEntryInfo(timeEntry) {
    if (!timeEntry) {
      this.displayLoading();
      return;
    }
    $do(this.project, setText, timeEntry.projectName);
    $do(this.project, setFill, timeEntry.color);
    $do(this.description, setText, timeEntry.desc);
    const duration = new Date(timeEntry.stop - timeEntry.start);

    const formattedDuration = [
      formatTimeSection(duration.getUTCHours()),
      formatTimeSection(duration.getUTCMinutes()),
      formatTimeSection(duration.getUTCSeconds()),
    ].join(':');

    $do(this.duration, setText, formattedDuration);

    if (timeEntry.bil) {
      $do(this.billing, addClass, TIME_ENTRY_BILLABLE_CLASS);
    } else {
      $do(this.billing, removeClass, TIME_ENTRY_BILLABLE_CLASS);
    }
    this.teardown();
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
   * @return {HTMLElement}
   * @private
   */
  _childrenWithId(childrenId) {
    return this._tileElement.getElementById(childrenId);
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

    tile.onmouseup = () => $do(this.background, removeClass, BACKGROUND_HIGHLIGHT_CLASS);

    tile.onmousedown = () => {
      if (highlightingTimeOut) {
        clearTimeout(highlightingTimeOut);
      }

      $do(this.background, addClass, BACKGROUND_HIGHLIGHT_CLASS);
      highlightingTimeOut = setTimeout(() => {
        $do(this.background, removeClass, BACKGROUND_HIGHLIGHT_CLASS);
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
