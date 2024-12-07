import fs from 'node:fs/promises';

import { logger } from './services/logger.js';

class Rule {
    first: number;
    second: number;
    constructor(first: number, second: number) {
        this.first = first;
        this.second = second;
    }

    public getFirst(): number {
        return this.first;
    }

    public getSecond(): number {
        return this.second;
    }

    public toString(): string {
        return this.first + '|' + this.second;
    }
}

class Pages {
    pages: number[];

    constructor(pages: number[]) {
        this.pages = pages.slice();
    }

    getPages() {
        return this.pages;
    }
}

export class World {
    // allCommands: Command[] = [];
    allRulesA: { [key: number]: Rule[] } = {};
    allRulesB: { [key: number]: Rule[] } = {};
    allPages: Pages[] = [];

    // is  [x][y]  if  x before y = -1 else 1
    orderingMatrix: { [key: number]: { [k2: number]: number } } = {};

    allIncorrent: Pages[] = [];

    dataFilename: string;

    constructor(dataFilename: string) {
        this.dataFilename = dataFilename;
    }

    async readFile(): Promise<World> {
        try {
            // const regex = /mul\(\d{1,3},\d{1,3}\)/g;
            // const regex = /mul\(\d{1,3},\d{1,3}\)|do\(\)|don't\(\)/g;

            const data = await fs.readFile(this.dataFilename, { encoding: 'utf8' });

            let inRules = true;

            data.split('\n').forEach((l) => {
                if (l == '') {
                    inRules = false;
                } else {
                    if (inRules) {
                        const s: string[] = l.split('|');
                        const newRule = new Rule(parseInt(s[0]), parseInt(s[1]));
                        if (!this.allRulesA[newRule.getFirst()]) {
                            this.allRulesA[newRule.getFirst()] = [];
                        }

                        if (!this.allRulesB[newRule.getSecond()]) {
                            this.allRulesB[newRule.getSecond()] = [];
                        }
                        this.allRulesA[newRule.getFirst()].push(newRule);
                        this.allRulesB[newRule.getSecond()].push(newRule);

                        const a = parseInt(s[0]);
                        const b = parseInt(s[1]);
                        if (!this.orderingMatrix[a]) {
                            this.orderingMatrix[a] = [];
                        }
                        if (!this.orderingMatrix[b]) {
                            this.orderingMatrix[b] = [];
                        }

                        this.orderingMatrix[a][b] = -1;
                        this.orderingMatrix[b][a] = 1;
                    } else {
                        const s: number[] = l.split(',').map((e) => parseInt(e));
                        const newPages = new Pages(s);
                        this.allPages.push(newPages);
                    }
                }
            });
        } catch (err) {
            throw err;
        }

        // logger.info(this.allPages);
        // logger.info(this.allRules);

        return this;
    }

    process_one(): number {
        logger.info('process one');
        let result: number = 0;

        this.allPages.forEach((p) => {
            const pageList = p.getPages();
            let isValid = true;

            for (let x = 0; x < pageList.length; x++) {
                const p = pageList[x];

                // get the rule for this
                const ruleA = this.allRulesA[p];
                if (ruleA && ruleA.length > 0) {
                    ruleA.forEach((r) => {
                        const y = pageList.indexOf(r.getSecond());

                        if (y != -1) {
                            if (x > y) {
                                isValid = false;
                                // break;
                            } else {
                                logger.info(r + ' x=' + x + ' y=' + y);
                            }
                        }
                    });
                }

                const ruleB = this.allRulesB[p];
                if (ruleB && ruleB.length > 0) {
                    ruleB.forEach((r) => {
                        const y = pageList.indexOf(r.getFirst());
                        if (y != -1) {
                            // current number on the RHS must be after x
                            // so
                            if (x < y) {
                                isValid = false;
                            } else {
                                logger.info(r + ' x=' + x + ' ' + pageList[x] + ' y=' + y + ' ' + pageList[y]);
                            }
                        }
                    });
                }
            }

            if (isValid) {
                result += pageList[Math.round(pageList.length / 2) - 1];
                logger.info(pageList.join(',') + ' OK ' + pageList[Math.round(pageList.length / 2) - 1]);
            } else {
                logger.info(pageList.join(',') + ' WRONG');
                this.allIncorrent.push(p);
            }
        });

        return result;
    }

    process_two(): number {
        logger.info('process two');

        let result = 0;
        const temp = this.allIncorrent.map((p) => p.getPages());

        const cmfFn = (a: number, b: number) => {
            if (this.orderingMatrix[a]) {
                if (this.orderingMatrix[a][b]) {
                    logger.info(a + ' ' + b + '  ' + this.orderingMatrix[a][b]);
                    return this.orderingMatrix[a][b];
                }
            }
            return 0;
        };

        //  this.allIncorrent.forEach((i) => {
        temp.forEach((t) => {
            let sorted = t.slice();
            sorted = sorted.sort(cmfFn);

            result += sorted[Math.round(sorted.length / 2) - 1];
            logger.info(t.join(',') + ' ==> ' + sorted.join(','));
        });

        return result;
    }
}
