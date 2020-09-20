import {peerSocket} from 'messaging';
import {debug} from './debug';

const SUSPENSION_BUFFER_BYTES = 64;

const COMPANION_QUEUE_SIZE = 20;

const DEVICE_QUEUE_SIZE = 6;

/**
 * Implements data transmission between companion app and device app
 */
class Transmitter {
  /**
   * Configures callbacks and initial statements
   */
  constructor({queueSize = DEVICE_QUEUE_SIZE} = {}) {
    this._queueSize = queueSize;
    this._messageQueue = [];

    peerSocket.onbufferedamountdecrease = () => {
      debug('buffer amount decreased', peerSocket.bufferedAmount);
      this._sendQueuedMessages();
    };

    peerSocket.onopen = () => {
      debug('connection opened');
      this._sendQueuedMessages();
    };

    peerSocket.onerror = ({code, message}) => {
      console.log(`Error in transmission: ${code}, ${message}`);
    };
  }

  /**
   * Defines if all the rules required for successful message transmission
   * were satisfied
   * @return {boolean}
   */
  get isTransmissionAllowed() {
    debug('buffer amount', peerSocket.bufferedAmount);
    return peerSocket.bufferedAmount < SUSPENSION_BUFFER_BYTES &&
      peerSocket.readyState === peerSocket.OPEN;
  }

  /**
   *
   * @return {*}
   */
  get messageHandler() {
    return this._messageHandler = this._messageHandler || this._initMessageHandler();
  }

  /**
   * Allows to subscribe on message
   * @param {string} messageType
   * @param {function} handler
   */
  onMessage(messageType, handler) {
    if (!(messageType && handler)) {
      throw new Error('Subscription requires message type and handler to be defined');
    }

    debug('subscribed on', messageType);

    this.messageHandler.set(messageType, [...this._handlersOfType(messageType), handler]);
  }

  /**
   * Sends a message to another party
   * @param {Object} message
   */
  sendMessage(message) {
    if (this.isTransmissionAllowed) {
      peerSocket.send(message);
      debug('message sent', message);
      debug('messages in queue', this._messageQueue);
    } else {
      this._addMessageToQueue(message);
      debug('message queued', message);
    }
  }

  /**
   * Queue a message for future send
   * @param {Object} message
   * @private
   */
  _addMessageToQueue(message) {
    if (this._messageQueue.length >= this._queueSize) {
      debug('queue overload item deleted', this._messageQueue.shift());
    }

    this._messageQueue.push(message);
  }

  /**
   * Takes handlers of provided message type
   * @param {string} type
   * @return {*|*[]}
   * @private
   */
  _handlersOfType(type) {
    return this.messageHandler.get(type) || [];
  }

  /**
   * Establishes default on message behavior, providing handlers to be set.
   * @return {Map<any, any>}
   * @private
   */
  _initMessageHandler() {
    const messageHandlers = {
      _s: {},
      set(type, handler) {
        this._s[type] = handler;
      },
      get(type) {
        return this._s[type];
      },
    };

    peerSocket.onmessage = ({data: message}) => {
      debug('message received', message);
      const {type, data} = message || {};

      if (type) {
        this._handlersOfType(type).forEach((handler) => handler(data));
      }
    };

    return messageHandlers;
  }

  /**
   * Send all queued messages
   * @private
   */
  _sendQueuedMessages() {
    if (this._messageQueue.length) {
      this.sendMessage(this._messageQueue.shift());
    }
  }
}

export {
  Transmitter,
  DEVICE_QUEUE_SIZE,
  SUSPENSION_BUFFER_BYTES,
  COMPANION_QUEUE_SIZE,
};
