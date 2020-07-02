/*globals driver, expect, TestUtils */
describe('save', function() {
    let SnapCloud, ProjectDialogMorph;
    before(() => {
        SnapCloud = driver.globals().SnapCloud;
        ProjectDialogMorph = driver.globals().ProjectDialogMorph;
    });
    this.timeout(15000);

    [
        //['w/o ws connection', () => driver.disconnect(), () => driver.connect()],
        ['fully connected']
    ].forEach(tuple => {
        const [label, beforeFn, afterFn] = tuple;
        describe(label, function() {
            if (beforeFn) {
                before(beforeFn);
            }
            if (afterFn) {
                after(afterFn);
            }

            describe('basic tests', function() {
                beforeEach(() => {
                    return driver.reset()
                        .then(() => driver.addBlock('doIfElse'))
                        .then(() => driver.selectCategory('control'));
                });

                it('should be able to save and reload the project', function() {
                    // Get the project name
                    const projectName = `can-reload-${Date.now()}`;

                    return driver.setProjectName(projectName)
                        .then(() => TestUtils.saveProject())
                        .then(() => driver.reset())
                        .then(() => TestUtils.openProject(projectName));
                });

                it('should overwrite on rename', function() {
                    const projectName = `rename-test-${Date.now()}`;
                    const newName = `RENAMED-${projectName}`;

                    return driver.setProjectName(projectName)
                        .then(() => TestUtils.saveProject())
                        .then(() => driver.setProjectName(newName))
                        .then(() => TestUtils.openProjectsBrowser())
                        .then(projectDialog => {
                            let projectList = projectDialog.listField.listContents
                                .children.map(child => child.labelString);
                            return driver
                                .expect(
                                    () => {
                                        projectList = projectDialog.listField.listContents
                                            .children.map(child => child.labelString);
                                        return projectList.includes(newName);
                                    },
                                    `Could not find ${newName} in project list`
                                )
                                .then(() => expect(projectList.includes(projectName)).toBe(false));
                        });
                });
            });

            describe('save as', function() {
                let projectName;
                let saveAsName;

                describe('from saved', function() {
                    before(function() {
                        projectName = `save-as-${Date.now()}`;

                        return driver.reset()
                            .then(() => driver.setProjectName(projectName))
                            .then(() => driver.addBlock('doIfElse'))
                            .then(() => TestUtils.saveProject())
                            .then(() => driver.reset())
                            .then(() => TestUtils.openProject(projectName))
                            .then(() => {
                                saveAsName = `new${projectName}-saveAs`;
                                return driver.saveProjectAs(saveAsName);
                            });
                    });

                    it('should change name of current project', function() {
                        return driver.expect(
                            () => driver.ide().room.name === saveAsName,
                            `Project name not updated (expected ${saveAsName})`
                        );
                    });

                    it('should make a copy on save as', function() {
                        return TestUtils.openProjectsBrowser()
                            .then(projectDialog => {
                                // Check that both projects show up in the project list
                                return driver.waitUntil(() => {
                                    // Click the cloud icon
                                    const cloudSrc = projectDialog.srcBar.children[0];
                                    driver.click(cloudSrc);

                                    const projectList = projectDialog.listField.listContents
                                        .children.map(child => child.labelString);
                                    const hasOriginal = projectList.includes(projectName);
                                    const hasSaveAsVersion = projectList.includes(saveAsName);

                                    return hasOriginal && hasSaveAsVersion;
                                });
                            });
                    });
                });

                describe('from unsaved', function() {
                    const existingName = `existing-${Date.now()}`;

                    before(async function() {
                        await driver.reset();
                        await driver.addBlock('doIf');
                        await driver.saveProjectAs(existingName);
                    });

                    beforeEach(async function() {
                        await driver.reset();
                        await driver.addBlock('doIfElse');
                    });

                    it('should not make a copy', async function() {
                        const name = `save-as-unsaved-${Date.now()}`;
                        const saveAs = `${name}-SAVE-AS`;
                        await driver.setProjectName(name);
                        await driver.addBlock('forward');
                        await driver.saveProjectAs(saveAs);
                        const dialog = await TestUtils.openProjectsBrowser();
                        await driver.waitUntil(() => {
                            const cloudSrc = dialog.srcBar.children[0];
                            driver.click(cloudSrc);

                            const projectList = dialog.listField.listContents
                                .children.map(child => child.labelString);
                            const hasOriginal = projectList.includes(name);
                            const hasSaveAsVersion = projectList.includes(saveAs);

                            return !hasOriginal && hasSaveAsVersion;
                        });
                    });

                    it('should prompt for overwrite if conflicting exists', async function() {
                        await driver.saveProjectAs(existingName, false);
                        await driver.expect(
                            () => driver.isShowingDialogKey(key => key.includes('decideReplace')),
                            'No overwrite prompt for conflicting project names'
                        );
                    });

                    it('should save as given name on overwrite', async function() {
                        const originalName = `original-name-${Date.now()}`;
                        await driver.setProjectName(originalName);
                        await driver.saveProjectAs(existingName, false);
                        const menu = driver.dialogs().pop();
                        menu.ok();
                        await driver.expect(
                            TestUtils.showingSaveMsg,
                            `Did not show save message on overwrite`
                        );
                        const browser = await TestUtils.openProjectsBrowser();
                        const names = TestUtils.getProjectList(browser);
                        expect(names).toContain(existingName);
                        expect(names).toNotContain(originalName);
                    });

                    it('should not save if not overwriting', async function() {
                        const originalName = `original-name-${Date.now()}`;
                        await driver.setProjectName(originalName);
                        await driver.saveProjectAs(existingName, false);
                        const menu = driver.dialog();
                        menu.cancel();
                        const [dialog] = driver.dialogs();
                        expect(dialog.task).toBe('save');
                    });
                });
            });

            describe('saveACopy', function() {
                let username;
                const projectName = `saveACopy-${Date.now()}`;

                beforeEach(() => driver.reset()
                    .then(() => username = SnapCloud.username)
                    .then(() => driver.setProjectName(projectName))
                );
                afterEach(() => SnapCloud.username = username);

                it('should create "Copy of <project>" on saveACopy', function() {
                    const ide = driver.ide();
                    // make the user a collaborator
                    SnapCloud.username = 'test';

                    ide.room.collaborators.push(SnapCloud.username);
                    ide.room.ownerId = 'otherUser';

                    // Click the project menu
                    driver.click(ide.controlBar.projectButton);
                    const dialog = driver.dialog();
                    const saveACopyBtn = dialog.children.find(item => item.action === 'saveACopy');
                    driver.click(saveACopyBtn);
                    return driver.expect(TestUtils.showingSaveMsg, `Did not see save message after "Save Copy"`)
                        .then(() => TestUtils.openProjectsBrowser())
                        .then(projectDialog => {
                            const copyName = `Copy of ${projectName}`;
                            return driver.expect(
                                () => TestUtils.getProjectList(projectDialog).includes(copyName),
                                `Could not find copied project (${copyName})`
                            );
                        });
                });
            });

            describe('setProjectName', function() {
                before(() => driver.reset());

                it('should not allow name collisions', function() {
                    const name = `collision-test-${Date.now()}`;
                    return driver.saveProjectAs(name)
                        .then(() => driver.reset())
                        .then(() => driver.setProjectNameNoConfirm(name))
                        .then(() => driver.expect(
                            () => driver.ide().room.name.startsWith(name),
                            `Name did not update to a variant of ${name}`
                        ))
                        .then(() => expect(driver.ide().room.name).toNotBe(name));
                });
            });
        });
    });
});
