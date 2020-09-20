import {EID} from '../selectors';
import {EntriesLogTile} from '../entries-log-tile.element';
import {VIEW} from './index';
import {$do, $} from '../lib/ui-action';
import {changeView} from '../actions/change-view';

const LIST_TILE = Object.freeze({
  TimeEntry: 'time-entry',
});

class EntriesLog {
  constructor({entriesRepo, ui}) {
    this.ui = ui;
    this.entriesRepo = entriesRepo;
    this._openCurrentEntry = () => {
      if ($(EID.ViewSwitch).value === VIEW.CurrentEntry) {
        this.ui.navigate(VIEW.CurrentEntry);
      }
    };
  }

  mounted() {
    this.attachEntriesLogBehavior();
    $do(EID.ViewSwitch, changeView, VIEW.EntriesLog);
    $(EID.ViewSwitch).addEventListener('select', this._openCurrentEntry);
    this.initiateEntriesLog();
    this._subscribeOnLogChange();
  }

  destroyed() {
    this._tileEntryMap = [];
    $(EID.ViewSwitch).removeEventListener('select', this._openCurrentEntry);
    this._unsubscribeEntryInfoUpdate();
    this._unsubscribeEntriesLogChange();
  }

  /**
   * Defines how entries list should behave
   * Attaches render processors.
   */
  attachEntriesLogBehavior() {
    $(EID.LogContainer).delegate = {
      getTileInfo: (position) => {
        const positionInEntriesLog = position - 1;
        const entryId = position ? {id: this.entriesRepo.entriesLogContents[positionInEntriesLog]} : {};
        return Object.assign(
            {
              type: LIST_TILE.TimeEntry,
              isPlaceholder: !position,
            },
            entryId,
        );
      },
      configureTile: (tileElement, {isPlaceholder, id}) => {
        const tile = new EntriesLogTile(tileElement);

        this.addToDisplayedDetails({tileId: tileElement.id, id});

        if (isPlaceholder) {
          return tile.enablePlaceholderMode();
        }

        const entry = this.entriesRepo.find({id});

        tile
            .onClick(() => {
              this.entriesRepo.start({
                id,
                start: Date.now(),
              });
              $do(EID.ViewSwitch, changeView, VIEW.CurrentEntry);
            })
            .displayTimeEntryInfo(entry); // TODO: SHOW loading and render in debounce;
      },
    };

    this._subscribeOnEntryInfoUpdate();
  }

  addToDisplayedDetails({tileId, id}) {
    this._tileEntryMap = this._tileEntryMap
        .filter(({tileId: existingTileId}) => tileId !== existingTileId);
    if (id) {
      this._tileEntryMap = this._tileEntryMap.concat({entryId: id, tileId});
    }
  }

  /**
   * Commands entries list to refresh
   * @private
   */
  initiateEntriesLog() {
    this._tileEntryMap = [];
    $(EID.LogContainer).length = this.entriesRepo.entriesLogContents.length + 1;
  }

  _subscribeOnEntryInfoUpdate() {
    this._unsubscribeEntryInfoUpdate();

    this._entryInfoUpdateSubscription = this.entriesRepo.entryInfoUpdated.subscribe((updatedEntryId) => {
      const entryToBeDisplayed = this._tileEntryMap.find(({entryId}) => entryId === updatedEntryId);
      if (entryToBeDisplayed) {
        new EntriesLogTile($(entryToBeDisplayed.tileId))
            .displayTimeEntryInfo(this.entriesRepo.find({id: entryToBeDisplayed.entryId}));
      }
    });
  }

  /**
   * Start track entries log update
   * @private
   */
  _subscribeOnLogChange() {
    this._unsubscribeEntriesLogChange();
    this._entriesLogChangeSubscription = this.entriesRepo.entriesLogContentsUpdate.subscribe(() => {
      this.initiateEntriesLog();
    });
  }

  _unsubscribeEntryInfoUpdate() {
    if (this._entryInfoUpdateSubscription) {
      this._entryInfoUpdateSubscription.unsubscribe();
      delete this._entryInfoUpdateSubscription;
    }
  }

  /**
   * Stop track entries log
   * @private
   */
  _unsubscribeEntriesLogChange() {
    if (this._entriesLogChangeSubscription) {
      this._entriesLogChangeSubscription.unsubscribe();
      delete this._entriesLogChangeSubscription;
    }
  }
}

export {
  EntriesLog,
  LIST_TILE,
};
