/*
 * SPDX-License-Identifier: Apache-2.0
 */
import sourceMapSupport from 'source-map-support';
sourceMapSupport.install();

import chalk from 'chalk';
import fs from 'fs';
import { logger } from './services/logger.js';
import { World } from './world.js';

const pj = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
logger.info(`Running ${chalk.green.bold(pj.description)}`);

const DEBUG: boolean = false;

const w = new World(DEBUG ? 'data_subset.txt' : 'data.txt');

await w.readFile();
w.process();

w.similarity();
