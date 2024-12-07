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
logger.info('Running with debug :: ' + DEBUG);

try {
    const w = new World(DEBUG ? 'data_subset.txt' : 'data.txt');

    await w.readFile();

    logger.info(`All the visited spaces :: ${w.process_one()}`);
    logger.info(`Routes that cycle :: ${w.process_two()}`);
} catch (e) {
    logger.error(e);
}
