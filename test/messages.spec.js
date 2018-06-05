/* globals expect, driver, SnapActions, MessageCreatorMorph, PushButtonMorph,
   CustomBlockDefinition*/
describe('messages', function() {

    describe('message type', function() {
        beforeEach(function() {
            return driver.reset()
                .then(() => driver.selectCategory('network'));
        });

        it('should be able to open the msg type dialog', function() {
            var world = driver.world();
            var palette = driver.palette();
            var isMakeMsgTypeBtn = item => item instanceof PushButtonMorph &&
                item.labelString === 'Make a message type';
            var btn = palette.contents.children.find(isMakeMsgTypeBtn);

            btn.mouseClickLeft();
            var dialog = world.children[world.children.length-1];
            expect(dialog instanceof MessageCreatorMorph).toBe(true);
        });

        it('should show delete msg type btn after create msg type', function() {
            var action = SnapActions.addMessageType('test', ['field1', 'field2']);

            return action.then(() => {
                var palette = driver.palette();
                var isDelMsgTypeBtn = item => item instanceof PushButtonMorph &&
                    item.labelString === 'Delete a message type';
                var btn = palette.contents.children.find(isDelMsgTypeBtn);

                expect(!!btn).toBe(true);
            });
        });

    });

    describe('unused msg types', function() {
        const usedMsgType = 'usedMsgType';
        const unusedMsgType = 'unusedMsgType';
        let unusedMsgs = null;
        before(function() {
            return SnapActions.addMessageType(usedMsgType)
                .then(() => SnapActions.addMessageType(unusedMsgType))
                .then(() => driver.addBlock('receiveSocketMessage'))
                .then(block => {
                    driver.click(block.inputs()[0]);
                    const dialog = driver.dialog();
                    driver.click(dialog.children.find(c => c.labelString === usedMsgType));

                    // Create a custom block
                    const sprite = driver.ide().currentSprite;
                    const spec = 'sprite block %s';
                    const definition = new CustomBlockDefinition(spec, sprite);

                    definition.category = 'motion';
                    return SnapActions.addCustomBlock(definition, sprite);
                })
                .then(() => {
                    const projectBtn = driver.ide().controlBar.projectButton;
                    driver.click(projectBtn);

                    // Open the dialog to remove unused blocks/msgs
                    const dialog = driver.dialog();
                    driver.click(dialog.children.find(c => c.action === 'exportGlobalBlocks'));
                    const exportDialog = driver.dialog();
                    unusedMsgs = exportDialog.msgs.map(msg => msg.blockSpec);
                });
        });

        it('should not detect used msgs', function() {
            expect(unusedMsgs.includes(usedMsgType)).toBeFalsy();
        });

        it('should detect unused msgs', function() {
            expect(unusedMsgs.includes(unusedMsgType)).toBeTruthy();
        });
    });
});
