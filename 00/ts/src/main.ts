/*
 * SPDX-License-Identifier: Apache-2.0
 */
import sourceMapSupport from 'source-map-support';
sourceMapSupport.install();

import chalk from 'chalk';
import fs from 'fs';
import { World } from './world.js';
import { logger } from './services/logger.js';

const w = new World();
const pj = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

console.log(`Running ${chalk.green.bold(pj.description)}`);
console.log(`Hello ${chalk.blue(w.getText())}`);

logger.info('Hello');
