import * as rhwp from './rhwp/rhwp.js';

globalThis.__officekitRhwp = rhwp;
globalThis.dispatchEvent(new Event('officekit:rhwp-ready'));
