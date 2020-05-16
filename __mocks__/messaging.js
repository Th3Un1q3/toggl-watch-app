/**
 * PeerSocket statuses
 * @type {ReadyState}
 */
const STATE = Object.freeze({
  OPEN: 'open',
  CLOSED: 'closed',
  ENDED: 'ended',
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
    this._onbufferedamountdecreaseHandler = null;
    this._bufferedAmount = 0;
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
   * Set a buffer decreasing tracking
   * @param {function} callback
   */
  set onbufferedamountdecrease(callback) {
    this._onbufferedamountdecreaseHandler = callback;
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

  /**
   * Returns already occupied buffer amount in bytes
   * @return {number}
   */
  get bufferedAmount() {
    return this._bufferedAmount;
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
