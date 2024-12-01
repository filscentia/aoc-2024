import fs from 'node:fs/promises';

import { logger } from './services/logger.js';

export class World {
    listTwo: number[];
    listOne: number[];
    dataFilename: string;

    constructor(dataFilename: string) {
        this.listOne = [];
        this.listTwo = [];
        this.dataFilename = dataFilename;
    }

    async readFile(): Promise<World> {
        try {
            const regex = /(\d+)\s+(\d+)/;

            const l1: number[] = [];
            const l2: number[] = [];

            const data = await fs.readFile(this.dataFilename, { encoding: 'utf8' });
            data.split('\n').forEach((l) => {
                const parts = regex.exec(l);

                if (parts != null && parts.length == 3) {
                    l1.push(parseInt(parts[1]));
                    l2.push(parseInt(parts[2]));
                } else {
                    throw new Error('Input not consisting of two numbers ' + l);
                }
            });

            this.listOne = l1.sort();
            this.listTwo = l2.sort();

            if (this.listOne.length != this.listTwo.length) {
                throw new Error('Lists are unequal length');
            }
        } catch (err) {
            throw err;
        }

        return this;
    }

    process(): void {
        let distance = 0;

        for (let x = 0; x < this.listOne.length; x++) {
            const d = Math.abs(this.listOne[x] - this.listTwo[x]);
            distance += d;
        }
        logger.info(distance);
    }

    similarity() {
        let s = 0;
        this.listOne.forEach((l1) => {
            const o = this._occurances(l1);
            s += l1 * o;
        });
        logger.info(s);
    }

    _occurances(x: number) {
        const occurances = this.listTwo.reduce(
            (accumulator, currentValue) => (currentValue == x ? accumulator + 1 : accumulator),
            0,
        );
        return occurances;
    }
}
