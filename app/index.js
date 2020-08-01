import './polyfills';

import {App} from './app';
// import {ElementWrapper} from './ui/document-helper';
// import document from 'document';


// // TODO: replace experiment below when it's complete
// const VTList = document.getElementById('time-entries-list-container');
// //
// // const NUM_ELEMS = 30;
// //
// VTList.delegate = {
//   getTileInfo(index) {
//     console.log('getTileInfo', index);
//     return {
//       type: 'time-entry',
//       value: 'Menu item',
//     };
//   },
//   configureTile(tile, info) {
//     if (info.type === 'time-entry') {
//       const wrapper = new ElementWrapper(tile.getElementById('wrapper'));
//       const background = new ElementWrapper(tile.getElementById('background'));
//       wrapper.removeClass('item-wrapper--hidden');
//
//       if (!info.index) {
//         return wrapper.addClass('item-wrapper--hidden');
//       }
//
//       tile.onmousedown = () => background.addClass('item__background--active');
//       tile.onmouseout = () => background.removeClass('item__background--active');
//       tile.onmousemove = () => background.removeClass('item__background--active');
//
//
//       tile.getElementById('description').text = 'getting info long logndsfas';
//       tile.getElementById('project').text = 'Project name masdfasdfasdfasdf';
//       setTimeout(() => {
//         tile.getElementById('description').text = `${info.value} ${info.index}`;
//       }, 2000);
//     }
//   },
// };
//
// VTList.length = NUM_ELEMS;

App.instance.ui; // TODO: add a test for start
