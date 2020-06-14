import document from 'document';

/**
 * Element wrapper contains basic operations on elements
 */
class ElementWrapper {
  /**
   * Initializes a wrapper instance
   * @param {HTMLElement} element
   */
  constructor(element) {
    this._el = element;
  }

  /**
   * Redefines value of element text buffer
   * @param {string} newText
   */
  set text(newText) {
    this._el.text = newText;
  }

  /**
   * Defines activate handler for screen and physical button
   * @param {function} handler
   */
  set onactivate(handler) {
    this._el.onactivate = handler;
  }

  /**
   * Changes a state of element
   * @param {string} newState
   */
  set state(newState) {
    this._el.state = newState;
  }

  /**
   * Return style object
   * @return {CSSStyleDeclaration}
   */
  get style() {
    return this._el.style;
  }

  /**
   * Returns unwrapped element
   * @return {HTMLElement}
   */
  get native() {
    return this._el;
  }

  /**
   * Adds specified class to an element
   * @param {string} className
   */
  addClass(className) {
    this._el.class = [...this._classList, className].filter((c) => !!c)
        .join(' ');
  }

  /**
   * Removes specified class from the element
   * @param {string} className
   */
  removeClass(className) {
    this._el.class = this._classList.filter((existingClassName) => existingClassName !== className)
        .join(' ');
  }

  /**
   * Makes element visible
   */
  show() {
    this._el.style.display = 'inline';
  }

  /**
   * Hides wrapped element
   */
  hide() {
    this._el.style.display = 'none';
  }

  /**
   * Returns a list of classes element has
   * @return {string[]}
   * @private
   */
  get _classList() {
    return (this._el.class || '').split(' ');
  }

  /**
   * Returns wrapped element with id;
   * @param {string} id
   * @return {*|ElementWrapper}
   */
  static byId(id) {
    return new ElementWrapper(document.getElementById(id));
  }
}

const _el = (id) => {
  return ElementWrapper.byId(id);
};

export {
  ElementWrapper,
  _el,
};
