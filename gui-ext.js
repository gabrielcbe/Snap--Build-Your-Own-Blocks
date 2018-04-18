/* globals ProjectDialogMorph, ensureFullUrl, localize, nop,
   IDE_Morph, Process, SnapCloud, BlockExportDialogMorph, DialogBoxMorph,
   detect
   */

ProjectDialogMorph.prototype._deleteProject =
    ProjectDialogMorph.prototype.deleteProject;

ProjectDialogMorph.prototype.deleteProject = function () {
    if (this.source === 'cloud-shared') {
        // Remove self from list of collabs
        var name = this.listField.selected.ProjectName;
        this.ide.confirm(
            localize(
                'Are you sure you want to delete'
            ) + '\n"' + name + '"?',
            'Delete Project',
            function() {
                SnapCloud.evictCollaborator(SnapCloud.username);
            }
        );
    } else {
        this._deleteProject();
    }
};

// adapted from installCloudProjectList
ProjectDialogMorph.prototype._openProject = ProjectDialogMorph.prototype.openProject;
ProjectDialogMorph.prototype.openProject = function () {
    var myself = this,
        proj = this.listField.selected,
        response;

    if (this.source === 'examples') {
        this.destroy();
        response = this.ide.getURL(this.ide.resourceURL('Examples', proj.name));
        this.ide.droppedText(response);
        // role name
        this.ide.updateUrlQueryString(proj.name, false, true);
    } else if (this.source === 'cloud-shared'){
        this.destroy();
        SnapCloud.callService('joinActiveProject', function(response) {
            myself.ide.rawLoadCloudProject(response[0], proj.Public);
        }, myself.ide.cloudError(), [proj.ProjectName, proj.Owner]);
    } else {
        return this._openProject();
    }
};

ProjectDialogMorph.prototype.openCloudProject = function (project) {
    var myself = this,
        msg;

    this.destroy();
    myself.ide.nextSteps([
        function () {
            msg = myself.ide.showMessage('Fetching project\nfrom the cloud...');
        },
        function () {
            SnapCloud.reconnect(function() {
                var isReopen = project.ProjectName === myself.ide.room.name,
                    onlyMe = myself.ide.room.getCurrentOccupants() === 1;

                if (isReopen && onlyMe) {  // reopening own project
                    myself.rawOpenCloudProject(project);
                } else {
                    SnapCloud.isProjectActive(
                        project.ProjectName,
                        function(isActive) {
                            var choices,
                                dialog;

                            if (isActive) {
                                // Prompt if we should join the project or open new
                                dialog = new DialogBoxMorph(null, nop);
                                choices = {};
                                choices['Join Existing'] = function() {
                                    SnapCloud.callService('joinActiveProject', function(response) {
                                        myself.ide.rawLoadCloudProject(response[0], project.Public);
                                    }, myself.ide.cloudError(), [project.ProjectName, project.Owner]);
                                    dialog.destroy();
                                    myself.destroy();
                                };
                                choices['Create Copy'] = function() {
                                    myself.rawOpenCloudProject(project);
                                    dialog.destroy();
                                };
                                dialog.ask(
                                    localize('Join Existing Project'),
                                    localize('This project is already open. Would you like to join\n' +
                                        'the active one or create a new copy?'),
                                    myself.world(),
                                    choices
                                );
                            } else {
                                myself.rawOpenCloudProject(project);
                            }
                        },
                        myself.ide.cloudError()
                    );
                }
            }, myself.ide.cloudError());

        },
        function() {
            msg.destroy();
        }
    ]);
};

// TODO: Why is this one so much different?
ProjectDialogMorph.prototype.rawOpenCloudProject = function (proj) {
    var myself = this,
        msg = myself.ide.showMessage('Fetching project\nfrom the cloud...');

    SnapCloud.reconnect(
        function () {
            SnapCloud.callService(
                'getProject',
                function (response) {
                    msg.destroy();
                    myself.ide.rawLoadCloudProject(response[0], proj.Public);
                },
                myself.ide.cloudError(),
                [proj.Owner, proj.ProjectName, SnapCloud.socketId()]
            );
        },
        myself.ide.cloudError()
    );
    this.destroy();
};

ProjectDialogMorph.prototype.saveProject = function () {
    var name = this.nameField.contents().text.text,
        notes = this.notesText.text,
        myself = this;

    this.ide.projectNotes = notes || this.ide.projectNotes;
    if (/[\.@]+/.test(name)) {
        this.ide.inform(
            'Invalid Project Name',
            'Could not save project because\n' +
            'the provided name contains illegal characters.',
            this.world()
        );
        return;
    }

    if (this.source === 'cloud') {
        if (detect(
                this.projectList,
                function (item) {return item.ProjectName === name; }
            )) {
            this.ide.confirm(
                localize(
                    'Are you sure you want to replace'
                ) + '\n"' + name + '"?',
                'Replace Project',
                function () {
                    myself.saveCloudProject(name);
                }
            );
        } else {
            myself.saveCloudProject(name);
        }
    } else { // 'local'
        if (detect(
                this.projectList,
                function (item) {return item.name === name; }
            )) {
            this.ide.confirm(
                localize(
                    'Are you sure you want to replace'
                ) + '\n"' + name + '"?',
                'Replace Project',
                function () {
                    myself.ide.room.name = name;
                    myself.ide.source = 'local';
                    myself.ide.saveProject(name);
                    myself.destroy();
                }
            );
        } else {
            this.ide.room.name = name;
            myself.ide.source = 'local';
            this.ide.saveProject(name);
            this.destroy();
        }
    }
};

////////////////////////////////////////////////////
// Override submodule for exporting of message types
////////////////////////////////////////////////////

IDE_Morph.prototype.exportGlobalBlocks = function () {
    if (this.stage.globalBlocks.length > 0 || this.stage.deletableMessageNames().length) {
        new BlockExportDialogMorph(
            this.serializer,
            this.stage.globalBlocks,
            this.stage
        ).popUp(this.world());
    } else {
        this.inform(
            'Export blocks/msg types',
            'this project doesn\'t have any\n'
                + 'custom global blocks or message types yet'
        );
    }
};


IDE_Morph.prototype._getURL = IDE_Morph.prototype.getURL;
IDE_Morph.prototype.getURL = function (url, callback) {
    url = ensureFullUrl(url);
    return this._getURL(url, callback);
};

IDE_Morph.prototype._rawOpenBlocksString = IDE_Morph.prototype.rawOpenBlocksString;
IDE_Morph.prototype.rawOpenBlocksString = function (str, name, silently) {
    var myself = this,
        msgTypes;

    if (Process.prototype.isCatchingErrors) {
        try {
            msgTypes = this.serializer.parse(str).childrenNamed('messageType');
        } catch (err) {
            this.showMessage('Load failed: ' + err);
        }
    } else {
        msgTypes = this.serializer.parse(str).childrenNamed('messageType');
    }

    if (silently) {
        msgTypes.forEach(function(msgType) {
            var name = msgType.childNamed('name').contents,
                fields = msgType.childNamed('fields').children.map(function(field) {
                    return field.contents;
                });

            myself.stage.addMessageType({
                name: name,
                fields: fields
            });
        });

        this.flushBlocksCache();
        this.flushPaletteCache();
        this.refreshPalette();
        this.showMessage(
            'Imported Blocks / Message Types Module' + (name ? ': ' + name : '') + '.',
            2
        );
    }

    return this._rawOpenBlocksString(str, name, silently);
};

///////////////////////////// Project Archives /////////////////////////////
ProjectArchiveDialogMorph.prototype = new DialogBoxMorph();
ProjectArchiveDialogMorph.prototype.constructor = ProjectArchiveDialogMorph;
ProjectArchiveDialogMorph.uber = DialogBoxMorph.prototype;

// ProjectArchiveDialogMorph instance creation:

function ProjectArchiveDialogMorph(ide) {
    this.init(ide);
}

ProjectArchiveDialogMorph.prototype.init = function(ide) {
    var myself = this,
        projectName = ide.room.name;

    // additional properties:
    this.ide = ide;
    this.projectList = []; // [{name: , thumb: , notes:}]

    this.handle = null;
    this.nameField = null;
    this.listField = null;
    this.preview = null;
    this.notesText = null;
    this.notesField = null;

    // initialize inherited properties:
    ProjectArchiveDialogMorph.uber.init.call(
        this,
        this, // target
        null, // function
        null // environment
    );

    // override inherited properites:
    this.labelString = 'Previous Versions of ' + projectName;
    this.createLabel();
    this.key = 'viewArchives';

    // build contents
    this.buildContents();

    //this.onNextStep = function () { // yield to show "updating" message
        //myself.setSource(myself.source);
    //};
};

ProjectArchiveDialogMorph.prototype.buildContents = function () {
    var thumbnail, notification, baseSize = new Point(455, 335);

    this.addBody(new Morph());
    this.body.color = this.color;

    this.listField = new ListMorph([]);
    //this.fixListFieldItemColors();
    this.listField.fixLayout = nop;
    this.listField.edge = InputFieldMorph.prototype.edge;
    this.listField.fontSize = InputFieldMorph.prototype.fontSize;
    this.listField.typeInPadding = InputFieldMorph.prototype.typeInPadding;
    this.listField.contrast = InputFieldMorph.prototype.contrast;
    this.listField.drawNew = InputFieldMorph.prototype.drawNew;
    this.listField.drawRectBorder = InputFieldMorph.prototype.drawRectBorder;

    this.body.add(this.listField);

    this.preview = new Morph();
    this.preview.fixLayout = nop;
    this.preview.edge = InputFieldMorph.prototype.edge;
    this.preview.fontSize = InputFieldMorph.prototype.fontSize;
    this.preview.typeInPadding = InputFieldMorph.prototype.typeInPadding;
    this.preview.contrast = InputFieldMorph.prototype.contrast;
    this.preview.drawNew = function () {
        InputFieldMorph.prototype.drawNew.call(this);
        if (this.texture) {
            this.drawTexture(this.texture);
        }
    };
    this.preview.drawCachedTexture = function () {
        var context = this.image.getContext('2d');
        var scale = Math.min(
                (this.width() / this.cachedTexture.width),
                (this.height() / this.cachedTexture.height)
            ),
            width = scale * this.cachedTexture.width,
            height = scale * this.cachedTexture.height;

        context.drawImage(this.cachedTexture, this.edge, this.edge,
            width, height);

        this.changed();
    };
    this.preview.drawRectBorder = InputFieldMorph.prototype.drawRectBorder;
    this.preview.setExtent(
        this.ide.serializer.thumbnailSize.divideBy(4).add(this.preview.edge * 2)
    );

    this.body.add(this.preview);
    this.preview.drawNew();

    this.notesField = new ScrollFrameMorph();
    this.notesField.fixLayout = nop;

    this.notesField.edge = InputFieldMorph.prototype.edge;
    this.notesField.fontSize = InputFieldMorph.prototype.fontSize;
    this.notesField.typeInPadding = InputFieldMorph.prototype.typeInPadding;
    this.notesField.contrast = InputFieldMorph.prototype.contrast;
    this.notesField.drawNew = InputFieldMorph.prototype.drawNew;
    this.notesField.drawRectBorder = InputFieldMorph.prototype.drawRectBorder;

    this.notesField.acceptsDrops = false;
    this.notesField.contents.acceptsDrops = false;

    this.notesText = new TextMorph('');

    this.notesField.isTextLineWrapping = true;
    this.notesField.padding = 3;
    this.notesField.setContents(this.notesText);
    this.notesField.setWidth(this.preview.width());

    this.body.add(this.notesField);

    if (this.task === 'open') {
        this.addButton('openProject', 'Open');
        this.action = 'openProject';
    }
    this.addButton('cancel', 'Cancel');

    this.setExtent(baseSize);
    this.fixLayout();
    this.drawNew();
};

ProjectArchiveDialogMorph.prototype.openProject = function () {
    console.log('opening project...');
    return;
    var proj = this.listField.selected,
        src;
    if (!proj) {return; }
    this.ide.source = this.source;
    if (this.source === 'cloud') {
        this.openCloudProject(proj);
    } else if (this.source === 'examples') {
        // Note "file" is a property of the parseResourceFile function.
        src = this.ide.getURL(this.ide.resourceURL('Examples', proj.fileName));
        SnapActions.disableCollaboration();
        SnapUndo.reset();
        this.ide.openProjectString(src);
        this.destroy();
    } else { // 'local'
        this.ide.openProject(proj.name);
        this.destroy();
    }
};

ProjectArchiveDialogMorph.prototype.popUp = function () {
    console.log('popping up...');
    return ProjectArchiveDialogMorph.uber.popUp.apply(this, arguments);
};
