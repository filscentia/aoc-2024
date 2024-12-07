import fs from 'node:fs/promises';
import { logger } from './services/logger.js';

enum State {
    CURRENT = '^',
    BLOCK = '#',
    VISITED = 'X',
    UNVISITED = '.',
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

const DIRECTION_ORDER: DirectionFunction[] = [NORTH, EAST, SOUTH, WEST];

export class World {
    originalmap: Array<Array<State>> = [];
    visited: Array<Coord> = [];
    dataFilename: string;

    startingGuardPosition: Coord = new Coord(0, 0, 0, 0);

    MAX_X: number = 0;
    MAX_Y: number = 0;

    constructor(dataFilename: string) {
        this.dataFilename = dataFilename;
    }

    async readFile(): Promise<World> {
        try {
            const data = await fs.readFile(this.dataFilename, { encoding: 'utf8' });

            const lines = data.split('\n');
            let startX = 0;
            let startY = 0;
            lines.forEach((l, y) => {
                const parts = l.split('').map((i, x) => {
                    switch (i) {
                        case '#':
                            return State.BLOCK;
                        case '.':
                            return State.UNVISITED;
                        case '^':
                            startX = x;
                            startY = y;

                            return State.CURRENT;
                        default:
                            throw new Error("Sholdn't have " + i + ' in ' + l);
                    }
                });

                this.originalmap.push(parts);
            });

            this.MAX_Y = lines.length;
            this.MAX_X = this.originalmap[0].length;
            this.startingGuardPosition = new Coord(startX, startY, this.MAX_X, this.MAX_Y);
        } catch (err) {
            throw err;
        }

        return this;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public print(map: Array<Array<any>>) {
        map.forEach((y) => {
            logger.info(y.join(''));
        });
    }

    process_one(): number {
        logger.info('process one');
        let result: number = 0;
        let moveDirectionIndex = 0;
        let guardPosition = this.startingGuardPosition;
        const map: Array<Array<State>> = JSON.parse(JSON.stringify(this.originalmap));

        while (!guardPosition.isOutside()) {
            const move = DIRECTION_ORDER[moveDirectionIndex];
            const possibleNewPosition = move(guardPosition);
            if (possibleNewPosition.isOutside()) {
                map[guardPosition.y][guardPosition.x] = State.VISITED;
                this.visited.push(new Coord(guardPosition.x, guardPosition.y));
                break;
            } else {
                const newPositionState = map[possibleNewPosition.y][possibleNewPosition.x];
                if (newPositionState == State.BLOCK) {
                    moveDirectionIndex = (moveDirectionIndex + 1) % 4;
                } else {
                    if (map[guardPosition.y][guardPosition.x] != State.VISITED) {
                        this.visited.push(new Coord(guardPosition.x, guardPosition.y));
                        map[guardPosition.y][guardPosition.x] = State.VISITED;
                    }
                    guardPosition = possibleNewPosition;
                }
            }
            // this.print();
        }
        this.print(map);

        result = map.reduce((ry: number, y) => {
            return (
                ry +
                y.reduce((rx, position) => {
                    if (position == State.VISITED) {
                        return rx + 1;
                    } else {
                        return rx;
                    }
                }, 0)
            );
        }, 0);

        return result;
    }

    process_two(): number {
        logger.info('process two');

        let result = 0;

        // for (let y = 0; y < this.MAX_Y; y++) {
        //     for (let x = 0; x < this.MAX_X; x++) {
        this.visited.forEach((v) => {
            // clone map
            const newMap = JSON.parse(JSON.stringify(this.originalmap));
            newMap[v.y][v.x] = State.BLOCK;

            const r = this._walk_cycle(newMap);
            // logger.info(r);
            if (r) {
                result++;
            }
        });
        //     }
        // }

        return result++;
    }

    _walk_cycle(map: Array<Array<State>>) {
        let moveDirectionIndex = 0;
        let guardPosition = new Coord(
            this.startingGuardPosition.x,
            this.startingGuardPosition.y,
            this.MAX_X,
            this.MAX_Y,
        );
        const mapdir: Array<Array<number>> = new Array(this.MAX_Y).fill(8).map(() => new Array(this.MAX_X).fill(8));

        while (true) {
            const move = DIRECTION_ORDER[moveDirectionIndex];
            const possibleNewPosition = move(guardPosition);

            // If otside then already done./
            if (possibleNewPosition.isOutside()) {
                map[guardPosition.y][guardPosition.x] = State.VISITED;
                // definately not looping
                return false;
            }

            // what would the new position be?
            const newPositionState = map[possibleNewPosition.y][possibleNewPosition.x];
            if (newPositionState == State.BLOCK) {
                moveDirectionIndex = (moveDirectionIndex + 1) % 4;
                continue;
            }

            if (
                newPositionState == State.VISITED &&
                mapdir[possibleNewPosition.y][possibleNewPosition.x] == moveDirectionIndex
            ) {
                return true;
            }

            map[guardPosition.y][guardPosition.x] = State.VISITED;
            mapdir[possibleNewPosition.y][possibleNewPosition.x] = moveDirectionIndex;
            guardPosition = possibleNewPosition;
        }
    }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class Coord {
    x: number;
    y: number;
    max_x: number;
    max_y: number;

    constructor(x: number, y: number, max_x: number = 0, max_y: number = 0) {
        this.x = x;
        this.y = y;
        this.max_x = max_x;
        this.max_y = max_y;
    }

    toString(): string {
        return this.x + ':' + this.y;
    }

    isOutside(): boolean {
        return this.x < 0 || this.x >= this.max_x || this.y < 0 || this.y >= this.max_y;
    }

    equals(other: Coord) {
        return this.x === other.x && this.y === other.y;
    }
}
