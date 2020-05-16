import {peerSocket} from 'messaging';
import {debug} from './debug';

const SUSPENSION_BUFFER_BYTES = 5 * 1024;

const COMPANION_QUEUE_SIZE = 10;

const DEVICE_QUEUE_SIZE = 3;

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
      this._sendQueuedMessages();
    };

    peerSocket.onopen = () => {
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
      this._messageQueue.shift();
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
    const messageHandlers = new Map();

    peerSocket.onmessage = ({data: message}) => {
      debug('received', {message});
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
    const message = this._messageQueue.shift();

    if (!!message) {
      this.sendMessage(message);
    }
  }
}

export {
  Transmitter,
  DEVICE_QUEUE_SIZE,
  COMPANION_QUEUE_SIZE,
};
