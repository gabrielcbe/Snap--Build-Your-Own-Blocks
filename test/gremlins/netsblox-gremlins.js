

/**
 * Log a message from a gremlin
 * @param message The message to be logged
 */
function _gremlinLog(message) {
    console.log(_gremlinLog.caller.name + ": " + message);
}

/**
 * Generates a random Unicode string
 * @param {Number} maxLength Maximum length of string
 * @param {Number=} minLength Minimum length of string
 */
function _getRandomString(maxLength, minLength = 1){
    let newName = "";
    let newLength = Math.random() * (maxLength - minLength) + minLength;

    for (let i = 0; i < newLength; i++) {
        newName += String.fromCharCode("0x" + Math.floor(Math.random() * 65503 + 32).toString(16));
    }

    return newName;
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
    let newName = _getRandomString(20);
    driver.setProjectNameNoConfirm(newName);
    driver.selectTab('scripts');
};

/**
 * Add a random block at a random position, out of the options in the current category
 */
const addBlockGremlin = function() {    
    const {Point, CommandBlockMorph, ReporterBlockMorph} = driver.globals();
    
    // Get block to add
    let blocks = driver.palette().contents.children.filter(f => f instanceof CommandBlockMorph || f instanceof ReporterBlockMorph);

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
 * @param {Filter} filter Filter to apply to blocks, default is that they are in the current view
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
 * Find a random input on a random block
 * @param {Filter} blockFilter Filter to apply to blocks
 * @param {Filter} inputFilter Filter to apply to inputs in blocks
 */
function _getRandomInput(blockFilter = _inView, inputFilter = _inView) {
    // Find block with desired inputs
    let block = _getRandomBlock((f) => blockFilter(f) && // Is the block type we want
        f.inputs() != [] && // Has inputs
        f.inputs().some(i => _inView(i) && inputFilter(i))); // Has an input we want

    // Make sure we found a block
    if(block === null){
        _gremlinLog("No blocks found");
        return;
    }

    // Find visible inputs
    let inputs = block.inputs().filter(
        i => _inView(i) && inputFilter(i) // Restrict to desired block type
    );

    // Make sure we have a valid input
    if(inputs.length === 0)
    {
        return null;
    }

    // Pick a random one
    return inputs[Math.floor(Math.random() * inputs.length)];
};

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
    let block2 = _getRandomBlock((f) => _inView(f) && f instanceof CommandBlockMorph && typeof f.topAttachPoint == 'function' && f != block1);

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
    driver.dragAndDrop(block2, dropPosition);
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
 * Sets a numeric input on a block
 */
const setNumericInputGremlin = function() {
    const {Point} = driver.globals();
    
    let checkNumeric = f => f.isNumeric === true;
    let input = _getRandomInput(_inView, checkNumeric);

    // Make sure we found something
    if(input == null)
    {
        _gremlinLog("No compatible input found.");
        return;
    }

    // Find position of input
    let clickPosition = input.center();

    // Determine random value
    let value = driver.ide().stage.width() * (Math.random() * 2 - 1);
    
    // Rounding to create a variety of answers
    value = value.toFixed(Math.floor(Math.random() * 6)).toString();
    
    // Click on input field
    driver.click(clickPosition);
    
    // TODO: Find why simulated clicks don't select properly
    input.setContents('');

    // Delete existing
    driver.keyDown(8);

    // Set input
    driver.keys(value);    

    // Click off of it
    driver.click(clickPosition.add(new Point(20,20))); 
};

/**
 * Sets a non-numeric input on a block
 */
const setStringInputGremlin = function() {
    const {Point} = driver.globals();
    
    let checkString = f => f.isNumeric === false && (f.choices === null || f.choices == undefined);
    let input = _getRandomInput(_inView, checkString);

    // Make sure we found something
    if(input == null)
    {
        _gremlinLog("No compatible input found.");
        return;
    }

    // Find position of input
    let clickPosition = input.center();

    // Click on input field
    driver.click(clickPosition);

    // TODO: Find why simulated clicks don't select properly
    input.setContents('');

    // Set input
    driver.keys(_getRandomString(20));    

    // Click off of it
    driver.click(clickPosition.add(new Point(20,20))); 
};

/**
 * Finds a drop-down input and picks a random option
 */
const setDropDownInputGremlin = function() {
    const {Point, MenuMorph, MenuItemMorph} = driver.globals();
    
    let checkDropdown = f => f.choices !== null && f.choices !== undefined;
    let input = _getRandomInput(_inView, checkDropdown);

    // Make sure we found something
    if(input == null)
    {
        _gremlinLog("No compatible input found.");
        return;
    }

    // Find position of input
    let clickPosition = new Point(input.right() - 2, input.center().y);

    // Click on input field
    driver.click(clickPosition);

    // Find menu options
    let menu = driver.world().children.find(f => f instanceof MenuMorph);
    if(menu == undefined || menu.children == undefined)
    {
        _gremlinLog("No menu found.");
        return;
    }

    let menuOptions = menu.children.filter(f => f instanceof MenuItemMorph);
    if(menuOptions.length < 1)
    {
        _gremlinLog("No menu options found.");
        return;
    }

    // Make a choice
    let menuOption = menuOptions[Math.floor(Math.random() * menuOptions.length)];

    // Click it
    driver.click(menuOption.center()); 
};

/**
 * Drag a reporter block into a compatible input of another block
 */
const blockAsInputGremlin = function() {
    let {CommandBlockMorph, ReporterBlockMorph, Point} = driver.globals();

    // Find compatible block and input
    let block = _getRandomBlock((f) => _inView(f) && f instanceof ReporterBlockMorph);
    let input = _getRandomInput((f) => _inView(f) && f != block); // An input not on the block we picked
    
    if(block == null)
    {
        _gremlinLog("No block found");
        return;
    }

    if(input == null)
    {
        _gremlinLog("No input found");
        return;
    }
    
    let location = input.center();
    driver.dragAndDrop(block, location);
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
    setStringInputGremlin,
    setDropDownInputGremlin,
    blockAsInputGremlin,
];

/**
 * Distribution of gremlin types, for devs to edit
 */
const _gremlinDistribution = [
    15, //categoryChangeGremlin 
    0.25, //projectNameChangeGremlin
    35, //addBlockGremlin
    10, //removeBlockGremlin
    20, //executeBlockGremlin
    1, //addSpriteGremlin
    2, //switchSpriteGremlin,
    25, //attachCommandBlockGremlin
    25, //setNumericInputGremlin
    25, //setStringInputGremln
    25, //setDropDownInputGremlin
    25, //blockAsInputGremlin
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

/**
 * @callback Filter
 * @param {*} input
 * @returns {Boolean} If the input matches the filter
 */
