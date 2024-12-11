/* eslint-disable @typescript-eslint/no-unused-vars */
import fs from 'node:fs/promises';
import { logger } from './services/logger.js';
import { serialize } from 'node:v8';

type Stone = {
    value: number;
};

export class World {
    dataFilename: string;

    constructor(dataFilename: string) {
        this.dataFilename = dataFilename;
    }

    originalStones: Array<Stone> = [];

    async readFile(): Promise<World> {
        try {
            const data = await fs.readFile(this.dataFilename, { encoding: 'utf8' });

            const lines = data.split('\n');
            lines.forEach((l, y) => {
                const a_list: Array<Stone> = l.split(' ').map((a, x) => {
                    return { value: parseInt(a) };
                });
                this.originalStones = this.originalStones.concat(a_list);
            });
        } catch (err) {
            throw err;
        }

        return this;
    }

    public print(map: Array<Stone> = this.originalStones) {
        logger.info(map.map((x) => x.value).join(' '));
    }

    process_one(): number {
        logger.info('process one');
        const result = 0;

        let stones = this.originalStones.slice();
        logger.info(stones);

        for (let blink = 0; blink < 25; blink++) {
            logger.info('Blink::' + (blink + 1));
            const newStones: Array<Stone> = [];
            for (let i = 0; i < stones.length; i++) {
                if (stones[i].value == 0) {
                    newStones.push({ value: 1 });
                } else {
                    const sValue = stones[i].value.toString();
                    if (sValue.length % 2 == 0) {
                        //even
                        const left = sValue.substring(0, sValue.length / 2);
                        const right = sValue.substring(sValue.length / 2);

                        newStones.push({ value: parseInt(left) });
                        newStones.push({ value: parseInt(right) });
                    } else {
                        newStones.push({ value: stones[i].value * 2024 });
                    }
                }
            }
            stones = newStones;
            // this.print(stones);
        }

        return result + stones.length;
    }

    process_two(): number {
        let result = 0;
        const stones = this.originalStones.slice();

        stones.forEach((s) => {
            // logger.info(s.value);
            const run: number = this._run_to_conclusion(s, 0);

            result += run;
        });

        logger.info('Number keys ::' + Object.keys(this.lookup).length);
        logger.info('Cache hits  ::' + this.cacheHit);

        return result;
    }

    lookup: { [key: string]: number } = {};
    cacheHit = 0;

    _run_to_conclusion(x: Stone, i: number): number {
        // logger.info(x.value + ' ' + i);
        if (i == 75) {
            return 1;
        }

        if (this.lookup[x.value + '_' + i]) {
            // logger.info(x.value + ' seen before ' + this.lookup[x.value + '_' + i]);
            this.cacheHit++;
            return this.lookup[x.value + '_' + i];
        }

        if (x.value == 0) {
            const size = this._run_to_conclusion({ value: 1 }, i + 1);
            this.lookup[x.value + '_' + i] = size;
            return size;
        } else {
            const sValue = x.value.toString();
            if (sValue.length % 2 == 0) {
                //even
                const left = { value: parseInt(sValue.substring(0, sValue.length / 2)) };
                const right = { value: parseInt(sValue.substring(sValue.length / 2)) };
                let size = 0;
                size += this._run_to_conclusion(left, i + 1);
                size += this._run_to_conclusion(right, i + 1);
                // logger.info('for ' + x.value + ' returning ' + size);
                this.lookup[x.value + '_' + i] = size;
                return size;
            } else {
                const size = this._run_to_conclusion({ value: x.value * 2024 }, i + 1);
                // logger.info('for ' + x.value + ' returning ' + size);
                this.lookup[x.value + '_' + i] = size;
                return size;
            }
        }
    }
}
