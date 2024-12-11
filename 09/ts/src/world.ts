/* eslint-disable @typescript-eslint/no-unused-vars */
import fs from 'node:fs/promises';
import { logger } from './services/logger.js';
import { nextTick, sourceMapsEnabled } from 'node:process';
import { runInThisContext } from 'node:vm';

type Block = {
    fileid: number;
    size: number;
    moved: boolean;
    index: number;
};

export class World {
    dataFilename: string;
    constructor(dataFilename: string) {
        this.dataFilename = dataFilename;
    }

    diskmap: Array<Block> = [];
    fileMap: Array<Block> = [];

    diskmap2: Array<Block> = [];

    async readFile(): Promise<World> {
        try {
            const data = await fs.readFile(this.dataFilename, { encoding: 'utf8' });
            let isFile = true;
            let fileidCounter = 0;

            data.split('').forEach((l, y) => {
                let newBlock;
                const size = parseInt(l);
                if (isFile) {
                    newBlock = { fileid: fileidCounter, size, moved: false, index: -1 };

                    this.fileMap.push(newBlock);

                    fileidCounter++;
                } else {
                    newBlock = { fileid: -1, size, moved: false, index: -1 };
                }
                isFile = !isFile;

                for (let x = 0; x < size; x++) {
                    this.diskmap.push(newBlock);
                    this.diskmap2.push(newBlock);
                }
            });

            this.diskmap2 = this.diskmap2.map((x, index) => {
                x.index = index;
                return x;
            });
        } catch (err) {
            throw err;
        }

        return this;
    }

    public print(diskmap: Array<Block> = this.diskmap) {
        // logger.info('.123456789.123456789.123456789.123456789.123456789.123456789.123456789');
        logger.info(diskmap.map((x) => (x.fileid == -1 ? '.' : '' + x.fileid)).join(''));
    }

    getNextEmpty(index: number = -1) {
        if (index >= this.diskmap.length) {
            return -1;
        }
        index++;
        while (this.diskmap[index].fileid != -1) {
            index++;
            if (index >= this.diskmap.length) {
                return -1;
            }
        }
        return index;
    }

    getLastBlock(lastBlockIndex: number = this.diskmap.length - 1) {
        let index = lastBlockIndex;

        while (this.diskmap[index].fileid == -1) {
            index--;
        }

        return index;
    }

    copy(b: Block): Block {
        return { fileid: b.fileid, size: b.size, moved: false, index: -1 };
    }

    process_one(): number {
        logger.info('process one');
        let result = 0;

        let currentEmptySpace = this.getNextEmpty();
        let lastBlockIndex = this.getLastBlock();
        logger.info(currentEmptySpace + ' ' + lastBlockIndex);
        while (currentEmptySpace < lastBlockIndex) {
            this.diskmap[currentEmptySpace] = this.copy(this.diskmap[lastBlockIndex]);
            this.diskmap[lastBlockIndex] = { fileid: -1, size: -1, moved: false, index: -1 };
            lastBlockIndex = this.getLastBlock(lastBlockIndex);
            currentEmptySpace = this.getNextEmpty(currentEmptySpace);

            // this.print();
        }

        result = this.diskmap.reduce((sum: number, nextblock: Block, index: number) => {
            if (nextblock.fileid != -1) {
                return sum + nextblock.fileid * index;
            }
            return sum;
        }, 0);

        return result;
    }

    longEnoughFree(index: number, sizeNeeded: number) {
        // logger.info(index + ' looking for ' + sizeNeeded);
        let found = 0;
        for (let x = 0; x < this.diskmap2.length && x < index; x++) {
            // logger.info(x + ' ' + this.diskmap2[x].fileid);
            if (this.diskmap2[x].fileid == -1) {
                found++;

                if (found == sizeNeeded) {
                    // logger.info('found at ' + x + ' ' + found);
                    return x - sizeNeeded + 1;
                }
            } else {
                found = 0;
            }
        }
        return -1;
    }

    _findFileStartIndex(fileid: number) {
        return this.diskmap2.findIndex((x) => x.fileid == fileid);
    }

    process_two(): number {
        logger.info('process two');
        let result = 0;

        for (let fi = this.fileMap.length - 1; fi >= 0; fi--) {
            const fileMoving = this.fileMap[fi];
            const fileStartIndex = this._findFileStartIndex(fileMoving.fileid);
            const toMoveTo = this.longEnoughFree(fileStartIndex, fileMoving.size);
            // logger.info('moving.. ' + JSON.stringify(fileMoving) + ' to ' + toMoveTo + ' from ' + fileStartIndex);
            if (toMoveTo != -1) {
                for (let x = 0; x < fileMoving.size; x++) {
                    this.diskmap2[toMoveTo + x] = this.copy(this.diskmap2[fileStartIndex + x]);
                    // this.diskmap2[toMoveTo + x].moved = true;
                    this.diskmap2[fileStartIndex + x] = { fileid: -1, size: -1, moved: false, index: -1 };
                }
            }
            // this.print(this.diskmap2);
        }

        result = this.diskmap2.reduce((sum: number, nextblock: Block, index: number) => {
            if (nextblock.fileid != -1) {
                return sum + nextblock.fileid * index;
            }
            return sum;
        }, 0);

        return result;
    }
}
