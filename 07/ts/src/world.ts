/* eslint-disable @typescript-eslint/no-unused-vars */
import fs from 'node:fs/promises';
import { logger } from './services/logger.js';

type Sum = {
    value: number;
    nums: number[];
};

export class World {
    dataFilename: string;
    allSums: Sum[] = [];

    constructor(dataFilename: string) {
        this.dataFilename = dataFilename;
    }

    async readFile(): Promise<World> {
        try {
            const data = await fs.readFile(this.dataFilename, { encoding: 'utf8' });

            data.split('\n').forEach((l) => {
                const index_1 = l.indexOf(':');
                const value = parseInt(l.substring(0, index_1));
                const nums = l
                    .substring(index_1 + 2)
                    .split(' ')
                    .map((x) => parseInt(x));
                this.allSums.push({ value, nums } as Sum);
            });
        } catch (err) {
            throw err;
        }

        return this;
    }

    public print(allSums: Array<Sum> = this.allSums) {
        allSums.forEach((y) => {
            logger.info(y.value + ' ' + y.nums.join(':'));
        });
    }

    process_one(): number {
        logger.info('process one');
        let result = 0;
        this.allSums.forEach((sum) => {
            const numOperatorsNeeded = sum.nums.length - 1;
            let checkspace: Array<Array<string>> | undefined = [];
            checkspace = this._fillspace(numOperatorsNeeded);

            const singleLineValid = checkspace?.some((operators) => this._valid(sum.nums, sum.value, operators));
            if (singleLineValid) {
                result += sum.value;
            }
        });

        return result;
    }

    _valid(nums: number[], targetValue: number, operators: string[]): boolean {
        let currentValue = nums[0];
        for (let z = 1; z < nums.length; z++) {
            if (operators[z - 1] == '|') {
                currentValue = parseInt(currentValue + '' + nums[z]);
            } else {
                if (operators[z - 1] == '+') {
                    currentValue = currentValue + nums[z];
                } else {
                    currentValue = currentValue * nums[z];
                }
            }
            if (currentValue > targetValue) {
                return false;
            }
        }

        return currentValue == targetValue;
    }

    _fillspace(numNeeded: number): Array<Array<string>> {
        const OP1_label: string[] = ['+', '*', '|'];
        // const OP1_label: string[] = ['+', '*'];

        if (numNeeded > 1) {
            const retVal: string[][] = [];
            this._fillspace(numNeeded - 1).forEach((l) => {
                OP1_label.forEach((newlabel) => {
                    const temp = l.slice() as string[];
                    temp.push(newlabel);
                    retVal.push(temp);
                });
            });

            return retVal;
        }

        // end case only 1 needed
        const retval = [];
        for (let x = 0; x < OP1_label.length; x++) {
            retval.push([OP1_label[x]]);
        }
        return retval;
    }

    process_two(): number {
        logger.info('process two');

        return 0;
    }
}
