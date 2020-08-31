/*global driver, expect, assert */
describe('room', function() {
    this.timeout(10000);
    describe('isValidName', function() {
        it('should reject names including @', function() {
            const {RoomMorph} = driver.globals();
            assert(!RoomMorph.isValidName('hello@world'));
        });

        it('should reject names including .', function() {
            const {RoomMorph} = driver.globals();
            assert(!RoomMorph.isValidName('hello.world'));
        });

        it('should accept alphanumeric names', function() {
            const {RoomMorph} = driver.globals();
            assert(RoomMorph.isValidName('helloworld'));
        });
    });

    describe('isEmptyName', function() {
        it('should return false for names with characters', function() {
            const {RoomMorph} = driver.globals();
            assert(!RoomMorph.isEmptyName(' helloworld'));
        });

        it('should return true if only whitespace', function() {
            const {RoomMorph} = driver.globals();
            assert(RoomMorph.isEmptyName(' \t'));
        });

        it('should return true if empty', function() {
            const {RoomMorph} = driver.globals();
            assert(RoomMorph.isEmptyName(''));
        });
    });

    describe('new', function() {
        const name = 'newRoleName';
        let initialRoleName = '';
        before(() => {
            return driver.reset()
                .then(() => driver.addBlock('forward'))
                .then(() => {
                    initialRoleName = driver.ide().projectName;
                    driver.newRole(name);

                    // wait for it to show up
                    let room = driver.ide().room;
                    return driver.expect(
                        () => room.getRole(name),
                        `new role (${name}) did not appear`
                    );
                });
        });

        describe('moveToRole', function() {
            let SnapCloud, projectId, oldRoleId;
            before(function() {
                SnapCloud = driver.globals().SnapCloud;
                projectId = SnapCloud.projectId;
                oldRoleId = SnapCloud.projectId;

                driver.moveToRole(name);
                driver.dialogs().forEach(d => d.destroy());
            });

            it('should be able to move to new role', function() {
                // wait for the project name to change
                return driver
                    .expect(() => {
                        return driver.ide().projectName === name;
                    }, `could not move to ${name} role`)
                    .then(() => expect(projectId).toBe(SnapCloud.projectId));
            });

            it('should not update projectId', function() {
                expect(projectId).toBe(SnapCloud.projectId);
            });

            it('should update roleId', function() {
                expect(oldRoleId).toNotBe(SnapCloud.roleId);
            });

            it('should be able to move back and forth', async function() {
                // wait for the project name to change
                await driver.expect(() => {
                    return driver.ide().projectName === name;
                }, `could not move to ${name} role`);

                driver.moveToRole(initialRoleName);
                driver.dialogs().forEach(d => d.destroy());
                await driver.expect(() => {
                    return driver.ide().projectName === initialRoleName;
                }, `could not move to ${initialRoleName} role`);

                driver.moveToRole(name);
                driver.dialogs().forEach(d => d.destroy());
                await expect(() => {
                    return driver.ide().projectName === name;
                }, `could not move to ${name} role`);
            });

            it('should be an empty role', function() {
                // Check for existing blocks
                return driver.expect(() => {
                    return !driver.ide().currentSprite.scripts.children.length;
                }, `did not load empty role "${name}"`);
            });

            it('should be able to add block', function() {
                const {SnapActions} = driver.globals();
                return driver
                    .expect(
                        () => driver.ide().projectName === name,
                        `did not open empty role "${name}"`
                    )
                    .then(() => driver.expect(
                        () => SnapActions._attemptedLocalActions.length === 0,
                        `Still has pending actions`
                    ))
                    .then(() => {
                        driver.selectCategory('looks');
                        driver.selectTab('scripts');
                        let showBlock = driver.palette().contents.children
                            .find(item => item.selector === 'show');

                        let dropPosition = driver.ide().currentSprite.scripts.center();

                        driver.dragAndDrop(showBlock, dropPosition);
                        const action = SnapActions._attemptedLocalActions[0];
                        return action.promise;
                    });
            });
        });
    });

    describe('rename', function() {
        const newName = 'newRoleName';
        before(() => {
            return driver.reset()
                .then(()=> {
                    driver.selectTab('room');

                    const room = driver.ide().room;
                    const roleName = room.getCurrentRoleName();
                    const role = room.getRole(roleName);

                    // rename the role
                    driver.click(role.label);
                    driver.keys(newName);
                    driver.dialog().ok();
                });
        });

        it('should change role name in room tab', function() {
            return driver.expect(() => {
                return driver.ide().room.getRole(newName);
            }, 'role did not change names');
        });
    });

    describe('duplicate', function() {
        before(async () => {
            await driver.reset();
            await driver.addBlock('forward');
            await driver.selectTab('Room');

            await driver.expect(() => { // determine if the roleid update is recevied from the server
                const roleName = driver.ide().projectName;
                const role = driver.ide().room.getRole(roleName);
                return (role.id.match(/-\d{12,15}/) !== null); // FIXME
            }, 'didnt receive role update');

            // get a handle of the current/only role
            const roleName = driver.ide().projectName;
            const role = driver.ide().room.getRole(roleName);

            // duplicate the role
            driver.click(role);
            const dupBtn = driver.dialog().buttons.children
                .find(btn => btn.action === 'createRoleClone');
            driver.click(dupBtn);
        });

        it('should create a new role', function() {
            return driver.expect(() => {
                const roleNames = driver.ide().room.getRoleNames();
                return roleNames.length === 2;
            }, 'new role did not appear');
        });

        it('should contain the same blocks', function() {
            const roleName = driver.ide().projectName;
            const roleNames = driver.ide().room.getRoleNames();
            const newRoleName = roleNames.find(name => name !== roleName);
            const currentBlockCount = driver.ide().currentSprite.scripts.children.length;

            // Move to the role and check the blocks
            driver.moveToRole(newRoleName);
            return driver.expect(() => {
                return driver.ide().currentSprite.scripts.children.length === currentBlockCount;
            }, 'role does not contain expected blocks');
        });
    });

    describe('remove', function() {
        const newRoleName = 'testRole';

        before(async function() {
            // create a new role
            await driver.newRoleNWait(newRoleName);

            // delete the newly created role
            const role = driver.ide().room.getRole(newRoleName);
            driver.click(role);
            const delBtn = driver.dialog().buttons.children
                .find(btn => btn.action === 'deleteRole');
            driver.click(delBtn);
        });

        it('should remove the role', function() {
            return driver.expect(() => {
                const roleNames = driver.ide().room.getRoleNames();
                return !roleNames.includes(newRoleName); // check it does not include the role anymore
            }, 'could not remove new role');
        });
    });

    describe('rename project', function() {
        const newName = 'newProjectName';

        it('should be able to rename the project', function() {
            const room = driver.ide().room;

            driver.selectTab('room');

            driver.click(room.roomName);
            driver.keys(newName);
            driver.dialog().ok();

            return driver.expect(() => {
                return room.name.startsWith(newName);  // may have (2) or (3) appended
            }, 'did not rename project: ' + room.name);
        });
    });
});
