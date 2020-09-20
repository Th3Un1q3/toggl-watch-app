import document from 'document';

/**
 * Element wrapper contains basic operations on elements
 */
class ElementWrapper { // TODO: make it flyweight
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
    if (this._el.text === newText) {
      return;
    }
    this._el.text = newText;
  }

  /**
   * Changes value property of the wrapped element
   * @param {*} newValue
   */
  set value(newValue) {
    if (this._el.value === newValue) {
      return;
    }
    this._el.value = newValue;
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
   * Sets element fill
   * @param {string} color
   */
  set fill(color) {
    if (this._el.style.fill === color) {
      return;
    }

    this._el.style.fill = color;
  }

  /**
   * Adds specified class to an element
   * @param {string} className
   */
  addClass(className) {
    [1, 2, 3].includes(2);

    if (this._classList.includes(className)) {
      return;
    }
    this._el.class = this._classList.concat([className]).filter((c) => !!c)
        .join(' ');
  }

  /**
   * Removes specified class from the element
   * @param {string} className
   */
  removeClass(className) {
    const newClassList = this._classList.filter((existingClassName) => existingClassName !== className)
        .join(' ');
    if (newClassList !== this._el.class) {
      this._el.class = newClassList;
    }
  }

  /**
   * Makes element visible
   */
  show() {
    const displayed = 'inline';
    if (this._el.style.display === displayed) {
      return;
    }
    this._el.style.display = displayed;
  }

  /**
   * Hides wrapped element
   */
  hide() {
    const hidden = 'none';
    if (this._el.style.display === hidden) {
      return;
    }
    this._el.style.display = hidden;
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
   * @param {Document} parent
   * @return {*|ElementWrapper}
   */
  static byId(id, parent = document) {
    return new ElementWrapper(parent.getElementById(id));
  }
}

const _el = (id) => {
  return ElementWrapper.byId(id);
};

export {
  ElementWrapper,
  _el,
};
