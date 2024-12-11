/* eslint-disable @typescript-eslint/no-unused-vars */
import fs from 'node:fs/promises';
import { logger } from './services/logger.js';

type Position = {
    offset: Offset;
    height: number;
};

type Offset = {
    x: number;
    y: number;
};

type Map = {
    positions: Array<Array<Position>>;
    max_x: number;
    max_y: number;
};

type DirectionFunction = (start: Offset) => Offset;
const NORTH: DirectionFunction = (start: Offset) => {
    return { x: start.x, y: start.y - 1 };
};

const SOUTH: DirectionFunction = (start: Offset) => {
    return { x: start.x, y: start.y + 1 };
};

const EAST: DirectionFunction = (start: Offset) => {
    return { x: start.x + 1, y: start.y };
};

const WEST: DirectionFunction = (start: Offset) => {
    return { x: start.x - 1, y: start.y };
};

const isOutside = (a: Offset, m: Map): boolean => {
    return a.x < 0 || a.x >= m.max_x || a.y < 0 || a.y >= m.max_y;
};

const DIRECTION_ORDER: DirectionFunction[] = [NORTH, EAST, SOUTH, WEST];

export class World {
    dataFilename: string;

    constructor(dataFilename: string) {
        this.dataFilename = dataFilename;
    }

    originalMap: Map = { positions: [], max_x: 0, max_y: 0 };

    async readFile(): Promise<World> {
        try {
            const data = await fs.readFile(this.dataFilename, { encoding: 'utf8' });

            const lines = data.split('\n');
            lines.forEach((l, y) => {
                const a_list = l.split('').map((a, x) => {
                    return { offset: { x, y }, height: a == '.' ? -1 : parseInt(a) };
                });

                this.originalMap.positions.push(a_list);
            });

            this.originalMap.max_y = lines.length;
            this.originalMap.max_x = this.originalMap.positions.length;
        } catch (err) {
            throw err;
        }

        return this;
    }

    public print(map: Map = this.originalMap) {
        map.positions.forEach((y) => {
            logger.info(y.map((x) => (x.height == -1 ? '.' : x.height)).join(''));
        });
    }

    _find_trails_from(x: number, y: number): number {
        const map = JSON.parse(JSON.stringify(this.originalMap));
        return this._follow_path(x, y, map);
    }

    _follow_path(current_x: number, current_y: number, map: Map): number {
        const h = map.positions[current_y][current_x].height;
        let foundCount = 0;

        const found: Offset[] = [];
        DIRECTION_ORDER.forEach((d) => {
            const newPosition = d({ x: current_x, y: current_y });
            if (!isOutside(newPosition, map)) {
                // not outside, is height ok
                const newheight = map.positions[newPosition.y][newPosition.x].height;
                if (newheight >= 0 && newheight == h + 1) {
                    // good... is this nine?
                    if (newheight == 9) {
                        found.push({ x: newPosition.x, y: newPosition.y });
                        foundCount++;
                        // uyncomment for part 1
                        // map.positions[newPosition.y][newPosition.x].height = -1;
                        return;
                    }

                    // can continue the search from here
                    foundCount += this._follow_path(newPosition.x, newPosition.y, map);
                }
            }
        });
        if (found.length > 0) {
            logger.info(
                'found end positions:: rating=' +
                    found.length +
                    '  ' +
                    found.map((o) => '{' + o.x + ',' + o.y + '}').join(' '),
            );
        }
        return foundCount;
    }

    process_one(): number {
        logger.info('process one');
        let result = 0;
        for (let y = 0; y < this.originalMap.max_y; y++) {
            for (let x = 0; x < this.originalMap.max_x; x++) {
                if (this.originalMap.positions[y][x].height == 0) {
                    // starting point
                    result += this._find_trails_from(x, y);
                }
            }
        }

        return result;
    }
}
