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

    driver.setProjectName(newName);
    driver.selectTab('scripts');
};

/**
 * Add a random block at a random position, out of the options in the current category
 */
const addBlockGremlin = function() {

};

/**
 * List of available gremlin types
 */
const gremlinFunctions = [
    categoryChangeGremlin, 
    projectNameChangeGremlin,
    addBlockGremlin,
];