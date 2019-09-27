// Generating interactions using Snap Driver. Actions should be of a fixed size
// Since the available actions is highly dependent on the state at that time, I
// will just be validating during generation
(function(global) {
    // TODO: Refactor all of this to get the random seed used to generate the data
    // TODO: Also save the stage size

    const saveSeedResult = function(seed, result) {
        
    };

    const random = new Math.seedrandom('hello');
    const range = (start, end) => [...Array(end-start)].map((_, i) => start+i);
    const sample = list => list[Math.floor(random() * list.length)]
    const randInt = (min, max) => Math.floor(random() * (max - min)) + min

    // set the seed?
    const generator = {};
    generator.char = () => String.fromCharCode(randInt(0, 255));
    generator.text = () => range(0, randInt(2, 120)).map(generator.char).join('');
    generator.point = driver => {
        const {Point} = driver.globals();
        const x = randInt(0, driver.world().width());
        const y = randInt(0, driver.world().height());
        return new Point(x, y);
    };
    generator.morph = driver => sample(driver.world().allChildren().filter(m => m.isVisible));
    generator.blockSpec = driver => sample(Object.keys(driver.globals().SpriteMorph.prototype.blocks));
    generator.sprite = driver => driver.world()

    const ACTION_ARGS = {
        keys: [generator.text],
        click: [driver => sample([generator.point, generator.morph])(driver)],
        rightClick: [generator.morph],
        dragAndDrop: [generator.morph, generator.point],
        //newRoleNWait: [generator.text],
        addBlock: [generator.blockSpec, generator.point],
        selectStage: [],
        //selectSprite: [generator.],
    }

    const ALL_ACTIONS = Object.keys(ACTION_ARGS);

    function InteractionGenerator(driver, actions=ALL_ACTIONS) {
        return async function generateInteractions(count) {
            const action = sample(actions);
            const args = ACTION_ARGS[action].map(fn => fn(driver));
            await driver[action].apply(driver, args.slice());
            return {action, args};
        };
    }

    global.InteractionGenerator = InteractionGenerator;

})(this);
