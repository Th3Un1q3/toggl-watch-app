export const setComboButtonIcons = (el, {press, normal}) => {
  el.getElementById('combo-button-icon').href = normal;
  el.getElementById('combo-button-icon-press').href = press;
};
