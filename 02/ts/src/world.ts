import fs from 'node:fs/promises';

import { logger } from './services/logger.js';

type Report = {
    levels: number[];
};

export class World {
    allReports: Report[] = [];
    dataFilename: string;

    constructor(dataFilename: string) {
        this.dataFilename = dataFilename;
    }

    async readFile(): Promise<World> {
        try {
            const regex = /(?:(\d+)\s*)/g;

            const data = await fs.readFile(this.dataFilename, { encoding: 'utf8' });
            data.split('\n').forEach((l) => {
                let m;

                const report: Report = { levels: [] };
                while ((m = regex.exec(l)) !== null) {
                    // This is necessary to avoid infinite loops with zero-width matches
                    if (m.index === regex.lastIndex) {
                        regex.lastIndex++;
                    }
                    report.levels.push(parseInt(m[1]));
                }

                this.allReports.push(report);
            });
        } catch (err) {
            throw err;
        }

        return this;
    }

    _is_safe(r: Report): boolean {
        // set starting condiition
        let isIncreasing: boolean;

        if (r.levels[0] > r.levels[1]) {
            isIncreasing = true;
        } else if (r.levels[0] < r.levels[1]) {
            isIncreasing = false;
        } else {
            return false;
        }

        for (let x = 1; x < r.levels.length; x++) {
            const previous = r.levels[x - 1];
            const current = r.levels[x];
            if (previous > current && !isIncreasing) {
                return false;
            } else if (previous < current && isIncreasing) {
                return false;
            }

            const delta = Math.abs(previous - current);
            if (delta < 1 || delta > 3) {
                return false;
            }
        }
        return true;
    }

    process_one(): number {
        logger.info('process one');
        let safe = 0;

        this.allReports.forEach((r) => {
            if (this._is_safe(r)) {
                safe++;
            }
        });
        return safe;
    }

    process_two(): number {
        logger.info('process two');
        let safe = 0;

        this.allReports.forEach((r) => {
            logger.info(r.levels.join(':'));
            if (this._is_safe(r)) {
                safe++;
                logger.info('safe');
            } else {
                logger.info('not safe ' + r.levels.length);
                for (let y = 0; y < r.levels.length; y++) {
                    const newLevel = r.levels.slice();
                    newLevel.splice(y, 1);
                    if (this._is_safe({ levels: newLevel })) {
                        safe++;
                        break;
                    }
                }
            }
        });
        return safe;
    }
}
