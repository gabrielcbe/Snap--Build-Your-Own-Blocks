/**
 * Log a message from a gremlin
 * @param message The message to be logged
 */
const _gremlinLog = function(message) {
    console.log(_gremlinLog.caller.name + ": " + message);
}

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
        _gremlinLog("No blocks available :(");
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
    let {x, y} = point;

    return x >= box.left() && y >= box.top() && x <= box.right() && y <= box.bottom();
}

/**
 * Check if a Morph is a visible part of the script
 * @param {Morph} f Morph to check
 * @returns {Boolean} If input is in script view
 */
const _inView = (f) =>  _inBounds(driver.ide().currentSprite.scripts.scrollFrame.boundingBox(), f.center());

/**
 * Get an array of all usable blocks
 * @param filter Filter to apply to blocks, default is that they are in the current view
 */
function _getAllBlocks(filter = _inView) {
    
    let scripts = driver.ide().currentSprite.scripts;

    // Determine predicate to use
    let validBlock = undefined;
    if(filter)
    {
        validBlock = (f) => (f.blockSpec != undefined && filter(f));
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
 * @param filter Filter to apply to blocks, default is that they are in the current view
 */
function _getRandomBlock(filter = _inView) {
    let blocks = _getAllBlocks(filter);

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
    {
        _gremlinLog("No blocks available :(");
        return;
    }
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
    {
        _gremlinLog("No blocks available :(");
        return;
    }
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
const attachCommandBlockGremlin = function() {
    let {CommandBlockMorph, CSlotMorph, Point} = driver.globals();

    // Find two compatible blocks
    let block1 = _getRandomBlock((f) => _inView(f) && f instanceof CommandBlockMorph && typeof f.bottomAttachPoint == 'function');
    let block2 = _getRandomBlock((f) => _inView(f) && f instanceof CommandBlockMorph && typeof f.topAttachPoint == 'function');

    // Make sure we found two distinct blocks
    if(block1 === null || block2 === null || block1 == block2){
        if(block1 == null)
            _gremlinLog("Couldn't find top block");

        if(block2 == null)
            _gremlinLog("Couldn't find bottom block");

        else if(block1 == block2)
            _gremlinLog("Couldn't find two blocks");

        return;
    }
    
    // Find possible drop points
    let dropPoints = [block1.bottomAttachPoint()];
    
    // Include C Slots
    block1.inputs().filter(f => f instanceof CSlotMorph).forEach(slot => {
        dropPoints.push(slot.slotAttachPoint());
    });

    // Pick a random one
    let dropPoint = dropPoints[Math.floor(Math.random() * dropPoints.length)];

    // Find attach point of block
    let dropPosition = dropPoint
        .add(new Point(block2.width()/2, block2.height()/2))
        .subtract(block2.topAttachPoint().subtract(block2.topLeft()));

    // Drag them together
    driver.dragAndDrop(block2, dropPosition.subtract(block2.center().subtract(block2.topLeft())), block2.topLeft().add(new Point(1,1)));
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
 * Drag a (compatible) block into the input of another block
 */
const blockAsInputGremlin = function() {

};

/**
 * Sets a numeric input on a block
 */
const setNumericInputGremlin = function() {
    const {Point} = driver.globals();
    
    let checkNumeric = f => f.isNumeric === true;

    // Find compatible block
    let block = _getRandomBlock((f) => _inView(f) && f.inputs() != [] && 
        f.inputs().some(i => checkNumeric(i)));

    // Make sure we found a block
    if(block === null){
        _gremlinLog("No blocks found");
        return;
    }

    // Find numeric inputs
    let inputs = block.inputs().filter(
        i => _inView(i) && checkNumeric(i)
    );

    // Make sure we have a valid input
    if(inputs.length === 0)
    {
        _gremlinLog("No valid input found");
        return;
    }

    // Pick a random one
    let input = inputs[Math.floor(Math.random() * inputs.length)];

    // Find position of input
    let clickPosition = input.center();

    // Determine random value
    let value = driver.ide().stage.width() * (Math.random() * 2 - 1);
    
    // Rounding to create a variety of answers
    value = value.toFixed(Math.floor(Math.random() * 6));
    
    // Click on input field
    driver.mouseDown(clickPosition);
    driver.mouseUp(clickPosition); 

    // Set input
    driver.keys(value);    

    // Click off of it
    driver.mouseDown(clickPosition.add(new Point(20,20)));
    driver.mouseUp(clickPosition.add(new Point(20,20)));     

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
    attachCommandBlockGremlin,
    setNumericInputGremlin,
];

/**
 * Distribution of gremlin types, for devs to edit
 */
const _gremlinDistribution = [
    15, //categoryChangeGremlin 
    1, //projectNameChangeGremlin
    30, //addBlockGremlin
    10, //removeBlockGremlin
    10, //executeBlockGremlin
    1, //addSpriteGremlin
    2, //switchSpriteGremlin,
    20, //attachCommandBlockGremlin
    50, //setNumericInputGremlin
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
