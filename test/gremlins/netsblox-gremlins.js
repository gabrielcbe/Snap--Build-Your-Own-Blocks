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
    const {Point, CommandBlockMorph} = driver.globals();
    
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
    let bb = driver.ide().currentSprite.scripts.scrollFrame.bounds;
    let location = new Point(Math.random() * bb.width() + bb.left(), Math.random() * bb.height() + bb.top());
    driver.dragAndDrop(block, location);
};

/**
 * Determine if a point is inside a bounding box
 * @param {Rectangle} box
 * @param {Point} point 
 */
const _inBounds = function(box, point) {
    let {top, left} = {top: box.origin.y, left: box.origin.y};
    let {bottom, right} = {bottom: box.corner.y, right: box.corner.y};
    let {x, y} = point;

    return x >= left && y >= top && x <= right && y <= bottom;
}

/**
 * Get an array of all usable blocks
 */
function _getAllBlocks(onlyVisible = true) {
    
    let scripts = driver.ide().currentSprite.scripts;

    // Determine predicate to use
    let validBlock = undefined;
    if(onlyVisible)
    {
        validBlock = (f) => (f.blockSpec != undefined && _inBounds(scripts.scrollFrame.boundingBox(), f.center()));
    }
    else
    {
        validBlock = (f) => (f.blockSpec != undefined);
    }

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
function _getRandomBlock() {
    let blocks = _getAllBlocks();

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
    let block = _getRandomBlock();

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
    let block = _getRandomBlock();

    if(block === null)
        return;

    // Run it
    driver.click(block);

    // Close anything opened by accident
    if(driver.dialog() != undefined)
    {
        let btnContainer = driver.dialog().children.find(f => f.children.find(g => g.action === "cancel"));

        if(btnContainer != undefined && btnContainer.children.length > 0){
            driver.click(btnContainer.children[btnContainer.children.length - 1].center());
        }
    }
}

/**
 * Attach random blocks
 */
const attachBlockGremlin = function() {
    // Find two compatible blocks
    let block1 = _getRandomBlock();
    let block2 = _getRandomBlock();

    // Make sure we found two blocks
    if(block1 === null || block1 == block2){
        return;
    }

    // Make sure they're compatible


    // Find attach point of second block

    // Drag them together

};

/**
 * Add a sprite to the project
 */
const addSpriteGremlin = function() {
    let addSpriteBtn = driver.ide().corralBar.children.find(f => f.action === "addNewSprite");
    
    // Click the button
    driver.click(addSpriteBtn.center());
};

/**
 * Switch between active sprites
 */
const switchSpriteGremlin = function() {
    const {SpriteIconMorph} = driver.globals();
    
    // Get available sprites (+stage)
    let sprites = driver.ide().corral.allChildren();
    sprites = sprites.filter(f => f instanceof SpriteIconMorph);

    // Click random one
    let sprite = sprites[Math.floor(Math.random() * sprites.length)];
    driver.click(sprite.center());
};

/**
 * List of available gremlin types
 */
const gremlinFunctions = [
    categoryChangeGremlin, 
    projectNameChangeGremlin,
    addBlockGremlin,
    removeBlockGremlin,
    executeBlockGremlin,
    addSpriteGremlin,
    switchSpriteGremlin,
];

/**
 * Distribution of gremlin types, for devs to edit
 */
const _gremlinDistribution = [
    15, //categoryChangeGremlin 
    1, //projectNameChangeGremlin
    30, //addBlockGremlin
    15, //removeBlockGremlin
    10, //executeBlockGremlin
    1, //addSpriteGremlin
    2, //switchSpriteGremlin
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
