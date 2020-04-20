/**
 * PeerSocket statuses
 * @type {ReadyState}
 */
const STATE = Object.freeze({
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
});

/**
 * This is mock for Messaging module of
 * FitBit SDK https://dev.fitbit.com/build/reference/device-api/messaging/
 */
class PeerSocket {
  /**
   * PeerSocket constructor
   */
  constructor() {
    this._onmessageHandler = null;
    this._onopenHandler = null;
    this._onerrorHandler = null;
    Object.assign(this, STATE);
    this._readyState = STATE.CLOSED;
    this.send = jest.fn();
  }

  /**
   * Attach on message callback
   * @param {function} callback
   */
  set onmessage(callback) {
    this._onmessageHandler = callback;
  }

  /**
   * Attach on error callback
   * @param {function} callback
   */
  set onerror(callback) {
    this._onerrorHandler = callback;
  }

  /**
   * Attach on connection open callback
   * @param {function} callback
   */
  set onopen(callback) {
    this._onopenHandler = callback;
  }

  /**
   * Return current connection ready state
   */
  get readyState() {
    return this._readyState;
  }
}

let peerSocket = new PeerSocket();

const _resetPeerSocket = () => {
  peerSocket = new PeerSocket();
};

export {
  peerSocket,
  _resetPeerSocket,
};
