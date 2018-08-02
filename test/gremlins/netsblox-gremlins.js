/**
 * Randomly changes the selected category
 */
const categoryChangeGremlin = function() {
    let categoryNames = driver.getCategoryNames();
    driver.selectCategory(categoryNames[Math.floor(Math.random() * categoryNames.length)]);
};

/**
 * Randomly changes the name of the project to a Unicode string
 */
const projectNameChangeGremlin = function() {
    let newName = "";
    let newLength = Math.random() * 20;

    for (let i = 0; i < newLength; i++) {
        newName += String.fromCharCode("0x" + Math.floor(Math.random() * 65503 + 32).toString(16));
    }

    driver.setProjectNameNoConfirm(newName);
    driver.selectTab('scripts');
};

/**
 * Add a random block at a random position, out of the options in the current category
 */
const addBlockGremlin = function() {
    const {CommandBlockMorph, Point} = driver.globals();
    
    // Get block to add
    let blocks = driver.palette().contents.children.filter(f => f instanceof CommandBlockMorph);

    // Make sure we're not, for example, in the custom tab with no custom blocks
    if(blocks.length == 0)
    {
        console.log("No blocks available :(");
        return;
    }

    let block = blocks[Math.floor(Math.random() * blocks.length)];

    // Add block
    let bb = driver.ide().currentSprite.scripts.bounds;
    let location = new Point(Math.random() * bb.width() + bb.left(), Math.random() * bb.height() + bb.top());
    driver.dragAndDrop(block, location);
};

/**
 * Get an array of all usable blocks
 */
function getAllBlocks() {
    
    const validBlock = (f) => f.blockSpec != undefined;

    let scripts = driver.ide().currentSprite.scripts;
    let parentblocks = scripts.children.filter(validBlock);
    let blocks = [];

    // Add blocks
    while(parentblocks.length > 0)
    {
        let p = parentblocks.shift();

        if(blocks.indexOf(p) !== -1)
        {
            continue;
        }

        if(validBlock(p))
        {
            blocks.push(p);
        }

        p.children.forEach(c => parentblocks.push(c));

        let children = p.children.filter(validBlock);
        children.forEach(c => parentblocks.push(c));
    }

    return blocks;
}

/**
 * Get a random block out of the available ones
 */
function getRandomBlock() {
    let blocks = getAllBlocks();

    // Can't select anything from empty
    if(blocks.length < 1)
        return null;

    return blocks[Math.floor(Math.random() * blocks.length)];
}

/**
 * Remove random blocks
 */
const removeBlockGremlin = function() {
    // Find random block
    let block = getRandomBlock();

    // Need a block to remove
    if(block === null)
        return;

    // Drag it out
    let location = driver.palette().center();
    driver.dragAndDrop(block, location);
};

/**
 * Execute random block
 */
const executeBlockGremlin = function() {

    // Find random block
    let block = getRandomBlock();

    if(block === null)
        return;

    // Run it
    driver.click(block);
}

/**
 * Attach random blocks
 */
const attachBlockGremlin = function() {
    // Find two compatible blocks

    // Find attach point of second block

    // Drag them together

};

/**
 * Add a sprite to the project
 */
const addSpriteGremlin = function() {

};

/**
 * Switch between active sprites
 */
const switchSpriteGremlin = function() {

};

/**
 * List of available gremlin types
 */
const gremlinFunctions = [
    categoryChangeGremlin, 
    projectNameChangeGremlin,
    addBlockGremlin,
    removeBlockGremlin,
    executeBlockGremlin
];

/**
 * Distribution of gremlin types, for devs to edit
 */
const _gremlinDistribution = [
    15, //categoryChangeGremlin 
    5, //projectNameChangeGremlin
    30, //addBlockGremlin
    15, //removeBlockGremlin
    10, //executeBlockGremlin
];

/**
 * Get the normalized version of the distribution for use with Distribution strategy
 */
const getGremlinDistribution = function(){
    let sum = 0, distribution = [];

    _gremlinDistribution.forEach(e => {
        sum += e;
    });

    _gremlinDistribution.forEach(e => {
        distribution.push(e / sum);
    });

    return distribution;
}
