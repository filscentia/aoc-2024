import fs from 'node:fs/promises';

import { logger } from './services/logger.js';

type Command = {
    cmd: string;
};

export class World {
    allCommands: Command[] = [];
    dataFilename: string;

    constructor(dataFilename: string) {
        this.dataFilename = dataFilename;
    }

    async readFile(): Promise<World> {
        try {
            // const regex = /mul\(\d{1,3},\d{1,3}\)/g;
            const regex = /mul\(\d{1,3},\d{1,3}\)|do\(\)|don't\(\)/g;

            const data = await fs.readFile(this.dataFilename, { encoding: 'utf8' });

            let enabled = true;

            data.split('\n').forEach((l) => {
                let m;

                while ((m = regex.exec(l)) !== null) {
                    // This is necessary to avoid infinite loops with zero-width matches
                    logger.info(m);
                    if (m.index === regex.lastIndex) {
                        regex.lastIndex++;
                    }
                    const c = { cmd: m[0] };
                    if (c.cmd.startsWith('mul') && enabled) {
                        this.allCommands.push(c);
                    } else if (c.cmd.startsWith("don't")) {
                        enabled = false;
                    } else if (c.cmd.startsWith('do')) {
                        enabled = true;
                    }
                }
            });
        } catch (err) {
            throw err;
        }

        return this;
    }

    _run_cmd(c: Command): number {
        const p1 = c.cmd.indexOf('(');
        const p2 = c.cmd.indexOf(',');

        const op1: number = parseInt(c.cmd.substring(p1 + 1, p2));
        const op2: number = parseInt(c.cmd.substring(p2 + 1, c.cmd.length));

        return op1 * op2;
    }

    process_one(): number {
        logger.info('process one');
        let result: number = 0;

        this.allCommands.forEach((cmd) => {
            result += this._run_cmd(cmd);
        });
        return result;
    }

    process_two(): number {
        logger.info('process two');
        return 0;
    }
}
