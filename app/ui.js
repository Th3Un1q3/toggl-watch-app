import document from 'document';

const LOADER_STATE = Object.freeze({
  ENABLED: 'enabled',
  DISABLED: 'disabled',
});

const TIMER_SECTION_ACTIVE_CLASS = 'current-entry__time--active';

const _formatTimeSection = (value) => {
  return value > 9 ? `${value}` : `0${value}`;
};

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
   * Adds specified class to an element
   * @param {string} className
   */
  addClass(className) {
    this._el.class = [...this._classList, className].filter((c) => !!c).join(' ');
  }

  /**
   * Removes specified class from the element
   * @param {string} className
   */
  removeClass(className) {
    this._el.class = this._classList.filter((existingClassName) => existingClassName!==className).join(' ');
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

const enableLoader = () => {
  _el('loader').state = LOADER_STATE.ENABLED;
};

const disableLoader = () => {
  _el('loader').state = LOADER_STATE.DISABLED;
};

const showConfigurationRequired = () => {
  disableLoader();
  _el('auth_token_info').show();
  _el('current_entry').hide();
};

const hideConfigurationRequired = () => {
  _el('auth_token_info').hide();
};

const _assignActiveClass = (difference = new Date(0)) => {
  _el('current_entry_time_hours').removeClass(TIMER_SECTION_ACTIVE_CLASS);
  _el('current_entry_time_minutes').removeClass(TIMER_SECTION_ACTIVE_CLASS);
  _el('current_entry_time_seconds').removeClass(TIMER_SECTION_ACTIVE_CLASS);

  if (difference.getUTCHours()) {
    return _el('current_entry_time_hours').addClass(TIMER_SECTION_ACTIVE_CLASS);
  }

  if (difference.getUTCMinutes()) {
    return _el('current_entry_time_minutes').addClass(TIMER_SECTION_ACTIVE_CLASS);
  }

  _el('current_entry_time_seconds').addClass(TIMER_SECTION_ACTIVE_CLASS);
};

const showCurrentEntry = (entry = {}) => {
  disableLoader();
  _el('current_entry').show();
  _el('current_entry_project').style.fill = entry.color;
  _el('current_entry_project').text = entry.projectName;
  _el('current_entry_description').text = entry.desc;

  if (entry.stop) {
    _el('current_entry_time_hours').text = '--';
    _el('current_entry_time_minutes').text = '--';
    _el('current_entry_time_seconds').text = '--';
    _el('current_entry_time_seconds').addClass(TIMER_SECTION_ACTIVE_CLASS);
    _assignActiveClass();
    return;
  }

  const difference = new Date(Date.now() - entry.start);

  _assignActiveClass(difference);

  _el('current_entry_time_hours').text = _formatTimeSection(difference.getUTCHours());
  _el('current_entry_time_minutes').text = _formatTimeSection(difference.getUTCMinutes());
  _el('current_entry_time_seconds').text = _formatTimeSection(difference.getUTCSeconds());
};

export {showConfigurationRequired, hideConfigurationRequired, enableLoader, showCurrentEntry, LOADER_STATE};
