import _ from 'lodash';

/**
 * This module is a mock for https://dev.fitbit.com/build/reference/device-api/fs/
 */

import path from 'path';

/**
 * Directory files iterator
 * @typedef {Object} DirectoryIterator
 * @property {function} next - returns next file in directory if not done.
 */

/**
 * File-System api mock.
 */
class FSMock {
  /**
   * instantiate file-system
   */
  constructor() {
    this._resetFS();
  }

  /**
   * Removes all files
   * @private
   */
  _resetFS() {
    this._files = {};
  }

  /**
   * Writes a file to private directory
   * @param {string} fileName
   * @param {*} content
   * @param {string} encoding
   */
  writeFileSync(fileName, content, encoding) {
    const filePath = path.resolve('.', fileName);
    _.set(this._files, [filePath, encoding], content);
  }

  /**
   * Reads a file from file system
   * @param {string} fileName
   * @param {string} encoding
   * @return {*}
   */
  readFileSync(fileName, encoding) {
    const filePath = path.resolve('.', fileName);
    if (!_.has(this._files, [filePath])) {
      throw new Error('File not found');
    }
    return _.get(this._files, [filePath, encoding]);
  }

  /**
   * Deletes a file from private directory
   * @param {string} fileName
   */
  unlinkSync(fileName) {
    this._files = _.omit(this._files, path.resolve('.', fileName));
  }

  /**
   * Returns an iterator for files in defined dir
   * @param {string} dirName
   * @return {DirectoryIterator}
   */
  listDirSync(dirName) {
    const directoryPath = path.resolve('.', path.dirname(dirName));
    const filesInDir = _.keys(this._files)
        .filter((f) => path.dirname(f) === directoryPath)
        .map((f) => path.basename(f));
    return {
      _files: filesInDir,
      next() {
        const file = this._files.shift();
        return {
          value: file,
          done: !file,
        };
      },
    };
  }
}

export default new FSMock();
