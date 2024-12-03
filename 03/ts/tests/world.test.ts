import { World } from 'src/world.js';

describe('project tests', () => {
    test('moduleA is correct', async () => {
        const w = new World();
        expect(w.getText()).toEqual('world');
    });
});
