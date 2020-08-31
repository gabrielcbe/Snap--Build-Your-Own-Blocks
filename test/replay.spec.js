/*global driver */
describe('replay', function() {
    this.timeout(4000);
    const newProjectWithActions = async function() {
        const {SnapActions} = driver.globals();
        await driver.reset();
        // Add a couple blocks, change the stage size, etc
        await driver.addBlock('forward');
        await SnapActions.setStageSize(500, 500);
        await driver.addBlock('bubble');
    };

    describe('undo/redo', function() {
        beforeEach(function() {
            return newProjectWithActions()
                .then(() => driver.ide().replayEvents());  // enter replay mode
        });

        it('should be able to undo all events', function(done) {
            const replayer = driver.ide().replayControls;
            replayer.jumpToBeginning();
            setTimeout(done, 750);
        });

        it('should be able to redo all events', function(done) {
            const replayer = driver.ide().replayControls;
            replayer.jumpToBeginning();
            // Jump to end
            setTimeout(() => {
                replayer.jumpToEnd();
                setTimeout(() => {
                    // Make sure a block exists!
                    const blocks = driver.ide().currentSprite.scripts.children;
                    if (blocks.length === 0) return done('blocks were not replayed!');
                    return done();
                }, 750);
            }, 500);
        });
    });

    describe('user actions', function() {
        beforeEach(function() {
            return newProjectWithActions()
                .then(() => driver.ide().replayEvents());  // enter replay mode
        });

        it('should still undo after current user actions during replay', async function() {
            const replayer = driver.ide().replayControls;
            replayer.jumpToEnd();

            driver.click(driver.ide().controlBar.startButton);

            await driver.sleep(25);
            await replayer.jumpToBeginning();
            await driver.expect(
                () => driver.ide().currentSprite.scripts.children.length === 0,
                'blocks were not undone!'
            );
        });
    });

    describe('error handling', function() {
        let reportedBugs = [];
        beforeEach(function() {
            // exit replay mode
            return newProjectWithActions()
                .then(() => {
                    const SnapUndo = driver.globals().SnapUndo;
                    driver.ide().exitReplayMode();

                    // add a garbage action
                    const badAction = {
                        type: 'setField',
                        args: ['item_123', 'catnip', 'dognip']
                    };
                    SnapUndo.record(badAction);

                    // enter replay mode
                    driver.ide().replayEvents();

                    // record bugs
                    driver.ide().submitBugReport =
                        (desc, error) => reportedBugs.push([desc, error]);

                    const replayer = driver.ide().replayControls;
                    replayer.jumpToBeginning();
                });
        });

        it('should notify user on error', function() {
            return driver.expect(() => driver.dialog(), 'No dialog shown');
        });

        it('should report the error in bug report', function() {
            return driver.expect(() => reportedBugs.length, 'No reported bugs');
        });
    });
});
