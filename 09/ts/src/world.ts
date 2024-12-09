/* eslint-disable @typescript-eslint/no-unused-vars */
import fs from 'node:fs/promises';
import { logger } from './services/logger.js';
import { AnyNaptrRecord } from 'node:dns';

type Antenna = {
    x: number;
    y: number;
    freq: string;
    antinodes_freq: string[];
};

const antenna_str = (a: Antenna) => {
    return '[' + a.freq + ':' + a.antinodes_freq.join('') + ']';
};

const antenna_same = (a: Antenna, b: Antenna) => {
    return a.x == b.x && a.y == b.y && a.freq == b.freq;
};

type Offset = {
    x: number;
    y: number;
};

const antenna_offset = (a: Antenna, b: Antenna) => {
    return {
        x: a.x - b.x,
        y: a.y - b.y,
    };
};

type Map = {
    antennas: Array<Array<Antenna>>;
    max_x: number;
    max_y: number;
};

export class World {
    dataFilename: string;

    antennaLookup: { [key: string]: Antenna[] } = {};

    constructor(dataFilename: string) {
        this.dataFilename = dataFilename;
    }

    originalMap: Map = { antennas: [], max_x: 0, max_y: 0 };

    async readFile(): Promise<World> {
        try {
            const data = await fs.readFile(this.dataFilename, { encoding: 'utf8' });
            const map: Map = { antennas: [], max_x: 0, max_y: 0 };
            const lines = data.split('\n');
            lines.forEach((l, y) => {
                const a_list = l.split('').map((a, x) => {
                    const tempA = { x: x, y: y, freq: a, antinodes_freq: [] } as Antenna;
                    if (/^[A-Za-z\d]+$/.test(a)) {
                        if (!this.antennaLookup[a]) {
                            this.antennaLookup[a] = [];
                        }
                        this.antennaLookup[a].push(tempA);
                    }
                    return tempA;
                });

                map.antennas.push(a_list);
            });

            map.max_y = lines.length;
            map.max_x = map.antennas.length;
            this.originalMap = map;
        } catch (err) {
            throw err;
        }

        return this;
    }

    public print(map: Map = this.originalMap) {
        map.antennas.forEach((y) => {
            logger.info(y.map((x) => antenna_str(x)).join('\t'));
        });
    }

    process_one(): number {
        logger.info('process one');
        let result = 0;

        for (const freq in this.antennaLookup) {
            const antennas = this.antennaLookup[freq];
            antennas.forEach((first) => {
                antennas.forEach((second) => {
                    if (!antenna_same(first, second)) {
                        const offset = antenna_offset(first, second);
                        let offMap = false;
                        let m = 0;
                        while (!offMap) {
                            const ax = first.x + offset.x * m;
                            const ay = first.y + offset.y * m;
                            if (ax >= 0 && ax < this.originalMap.max_x && ay >= 0 && ay < this.originalMap.max_y) {
                                logger.info(freq + ': ' + offset.x + ' ' + offset.y);
                                this.originalMap.antennas[ay][ax].antinodes_freq.push('#');
                            } else {
                                offMap = true;
                            }
                            m++;
                        }
                    }
                });
            });
        }

        this.print();
        result = this.originalMap.antennas.flatMap((x) => x).filter((x) => x.antinodes_freq.length > 0).length;

        return result;
    }
}
