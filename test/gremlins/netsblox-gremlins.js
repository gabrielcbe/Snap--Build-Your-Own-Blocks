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
 * Remove random blocks
 */
const removeBlockGremlin = function() {
    // Find random block

    // Drag it out
};

/**
 * Attach random blocks
 */
const attachBlockGremlin = function() {
    // Find two compatible blocks

    // Find attach point of second block

    // Drag them together

};

/**
 * List of available gremlin types
 */
const gremlinFunctions = [
    categoryChangeGremlin, 
    projectNameChangeGremlin,
    addBlockGremlin,
];