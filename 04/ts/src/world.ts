import fs from 'node:fs/promises';

import { logger } from './services/logger.js';

const SEARCH = ['X', 'M', 'A', 'S'];

const SEARCH_X = ['M', 'A', 'S'];

class Coord {
    x: number;
    y: number;
    max_x: number;
    max_y: number;

    constructor(x: number, y: number, max_x: number, max_y: number) {
        this.x = x;
        this.y = y;
        this.max_x = max_x;
        this.max_y = max_y;
    }

    isOutside(): boolean {
        return this.x < 0 || this.x >= this.max_x || this.y < 0 || this.y >= this.max_y;
    }
}

type DirectionFunction = (start: Coord) => Coord;

const NORTH: DirectionFunction = (start: Coord) => {
    return new Coord(start.x, start.y - 1, start.max_x, start.max_y);
};

const SOUTH: DirectionFunction = (start: Coord) => {
    return new Coord(start.x, start.y + 1, start.max_x, start.max_y);
};

const EAST: DirectionFunction = (start: Coord) => {
    return new Coord(start.x + 1, start.y, start.max_x, start.max_y);
};

const WEST: DirectionFunction = (start: Coord) => {
    return new Coord(start.x - 1, start.y, start.max_x, start.max_y);
};

const NE: DirectionFunction = (start: Coord) => {
    return new Coord(start.x + 1, start.y - 1, start.max_x, start.max_y);
};

const NW: DirectionFunction = (start: Coord) => {
    return new Coord(start.x - 1, start.y - 1, start.max_x, start.max_y);
};

const SE: DirectionFunction = (start: Coord) => {
    return new Coord(start.x + 1, start.y + 1, start.max_x, start.max_y);
};

const SW: DirectionFunction = (start: Coord) => {
    return new Coord(start.x - 1, start.y + 1, start.max_x, start.max_y);
};

const Directions: DirectionFunction[] = [NORTH, SOUTH, EAST, WEST, NE, NW, SE, SW];
const Diag: DirectionFunction[] = [NE, NW, SE, SW];

class Letter {
    l: string;
    pos: Coord;

    public constructor(l: string, pos: Coord) {
        if (l == 'X' || l == 'M' || l == 'A' || l == 'S') {
            this.l = l;
        } else {
            this.l = '.';
        }

        this.pos = pos;
    }

    getLetterIndex(): number {
        if (this.l == 'X') return 0;
        if (this.l == 'M') return 1;
        if (this.l == 'A') return 2;
        if (this.l == 'S') return 3;
        return -1;
    }
}

export class World {
    grid: Letter[][] = [];
    dataFilename: string;
    MAX_X: number = 0;
    MAX_Y: number = 0;

    constructor(dataFilename: string) {
        this.dataFilename = dataFilename;
    }

    async readFile(): Promise<World> {
        try {
            const data = await fs.readFile(this.dataFilename, { encoding: 'utf8' });

            let x = 0;
            let y = 0;

            const lines = data.split('\n');

            this.MAX_Y = lines.length;
            this.MAX_X = lines[0].length;
            lines.forEach((l) => {
                this.grid[x] = [];
                const letters = l.split('');
                letters.forEach((le) => {
                    const c = new Coord(x, y, this.MAX_X, this.MAX_Y);

                    this.grid[x].push(new Letter(le, c));
                    y++;
                });
                y = 0;
                x++;
            });
        } catch (err) {
            throw err;
        }
        console.log('max x' + this.MAX_X);
        console.log('max y' + this.MAX_Y);
        console.log(this.grid[0][1].l);
        return this;
    }

    print() {
        // console.log(this.grid);
        for (let x = 0; x < this.MAX_X; x++) {
            for (let y = 0; y < this.MAX_Y; y++) {
                process.stdout.write(this.grid[x][y].l);
            }
            console.log();
        }
    }

    process_one(): number {
        logger.info('process one');
        let total = 0;
        for (let x = 0; x < this.MAX_X; x++) {
            for (let y = 0; y < this.MAX_Y; y++) {
                const current = this.grid[x][y];
                logger.info('Starting seach at ' + current.pos.x + ' ' + current.pos.y);
                Directions.forEach((dfn) => {
                    if (this._search_dir_for(current.pos, 0, dfn, SEARCH)) {
                        total++;
                    }
                });
            }
        }

        return total;
    }

    aLocations: { [key: string]: number } = {};

    process_two(): number {
        this.aLocations = {};
        logger.info('process two');
        // let total = 0;
        for (let x = 0; x < this.MAX_X; x++) {
            for (let y = 0; y < this.MAX_Y; y++) {
                const current = this.grid[x][y];
                logger.info('Starting seach at ' + current.pos.x + ' ' + current.pos.y);
                Diag.forEach((dfn) => {
                    if (this._search_dir_for(current.pos, 0, dfn, SEARCH_X)) {
                        // total++;
                    }
                });
            }
        }

        let total2 = 0;
        for (const k in this.aLocations) {
            if (this.aLocations[k] == 2) {
                total2++;
            }
        }
        return total2;
    }

    _search_dir_for(coord: Coord, letterindex: number, dir_fn: DirectionFunction, search: string[]): boolean {
        // logger.info(coord.x + ',' + coord.y + '  ' + letterindex + this.grid[coord.x][coord.y]);
        if (this.grid[coord.x][coord.y].l == search[letterindex]) {
            if (letterindex == search.length - 1) {
                return true;
            } else {
                const newCoord = dir_fn(coord);

                if (newCoord.isOutside()) {
                    return false;
                }

                const rt = this._search_dir_for(newCoord, letterindex + 1, dir_fn, search);
                if (rt && search[letterindex] == 'A') {
                    const k = `${coord.x}_${coord.y}`;
                    if (!this.aLocations[k]) {
                        this.aLocations[k] = 1;
                    } else {
                        this.aLocations[k] += 1;
                    }
                }
                return rt;
            }
        } else {
            return false;
        }
    }
}
