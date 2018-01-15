let originalVpWidth, canvasEl, mobileEl, vpEl;

Element.prototype.hide = function() {
    this.style.display= 'none';
}

Element.prototype.show = function() {
    this.style.display= 'block';
}



function showMobile(){
    // get current viewport width
    originalVpWidth = visualViewport.width;
    canvasEl = document.getElementById('world');
    mobileEl = document.getElementById('mobile');
    vpEl = document.querySelector('meta[name="viewport"]');

    // hide snap
    canvasEl.hide();
    // set vp width to device
    vpEl.content = 'width=device-width';
    // show room management tab
    mobileEl.show();
}


function showSnap(){
    mobileEl.hide();
    // revert viewport
    console.log('originalVpWidth was', originalVpWidth, 'setting vw to', 980);
    vpEl.content = 'width='+980+', user-scalable=0';
    canvasEl.show();
}

// vue goodness
let app = new Vue({
    el: '#mobile',
    data: {
        friends: [], // have friends as computed?
        roles: [{
            name: 'loading',
            users: []
        }]
    },
    computed: {
        // check command validity
        checkCommands() {
            let cmds;
            try {
                cmds = JSON.parse(this.commands);
                // check for easy errors
                let validCommands = ['left', 'right', 'stop'];
                let allValid = cmds.every(cmd => {
                    if (!isNaN(cmd) || validCommands.includes(cmd)) return true;
                });
                return allValid;
            } catch (e) {
                return false;
            }
        },

    },
    methods: {
        // Room management 
        getRoom() {
            return world.children[0].room;
        },

        listUsers(role) {
            if (!role.users) return '';
            return role.users.map(user => user.username).join(', ');
        },

        // updates roles inplace
        updateRoles() {
            let roles = this.getRoom().getRoles();
            console.log('roles', roles);
            this.roles = roles;
        },

        updateFriendList() {
            console.log('updating the friend list');
            this.friends = [];
            let handleError =(err, lbl) => {
                console.error(err);
            };
            let friendsCb = friends => {
                // TODO search find pick the friend if there are any
                friends.unshift('myself');
                console.log('friendlist:', friends);
                this.friends = friends;
            };
            SnapCloud.getFriendList(friendsCb, handleError);
        },

        // invite a friend to a role
        inviteGuest(username, roleName) {
            const room = this.getRoom();
            // FIXME temp workaround to invite guests w/o selecting a role
            if (!roleName) {
                let theRole = this.roles.find(role => role.users.length === 0);
                if (theRole) {
                    roleName = theRole.name;
                } else {
                    console.error('no role selected, cant invite guests');
                    return;
                }
            }
            // TODO don't expose if is not the owner or a collaborator
            if (room.isOwner() || room.isCollaborator()) {
                room.inviteGuest(username, roleName);
            } else {
                // not allowed to do this
                console.error('you are not allowed to invite guests');
            }
        },

        // move to a role
        moveToRole(roleName) {
            let alert = this.alertCtrl.create({
                title: 'Confirm',
                message: `Move to role ${roleName}?`,
                buttons: [
                    {
                        text: 'Cancel',
                        role: 'cancel',
                        handler: () => {
                            console.log('Cancel clicked');
                        }
                    },
                    {
                        text: 'Move',
                        handler: () => {
                            this.getRoom().moveToRole(roleName);
                            // FIXME moving to role is an async task
                            this.updateRoles();
                        }
                    }
                ]
            });
            alert.present();
        },

        evictUser(user, roleName) {
            // TODO warn/confirm
            let room = this.getRoom();
            let sucCb = () => {
                console.log('evicted', user.username);
                this.updateRoles();
            };
            let errCb =(err, lbl) => {
                console.error(err, lbl);
            };
            let alert = this.alertCtrl.create({
                title: 'Confirm',
                message: `Are you sure you want to evict ${user.username}?`,
                buttons: [
                    {
                        text: 'Cancel',
                        role: 'cancel',
                        handler: () => {
                            console.log('Eviction canceled');
                        }
                    },
                    {
                        text: 'Evict',
                        handler: () => {
                            SnapCloud.evictUser( sucCb, errCb,
                                [user.uuid, roleName, room.ownerId, room.name]
                            );
                        }
                    }
                ]
            });
            alert.present();
        },

        showSnap() {
            showSnap();
        },

        presentActions(role) {
            let actionSheet = this.actionSheetCtrl.create({
                title: 'Choose an action',
                buttons: [
                    {
                        text: 'Evict User',
                        role: 'destructive',
                        icon: !this.platform.is('ios') ? 'exit' : null,
                        handler: () => {
                            // TODO find the user, through the role? 
                            let user = role.users.find(uName => uName !== 'myself');
                            this.evictUser(user, role.name);
                            console.log('Destructive clicked');
                        }
                    },{
                        text: 'Move To',
                        icon: !this.platform.is('ios') ? 'move' : null,
                        handler: () => {
                            this.moveToRole(role.name);
                            console.log('moving to');
                        }
                    },{
                        text: 'Invite Guest',
                        icon: !this.platform.is('ios') ? 'add' : null,
                        handler: () => {
                            console.log('invite guest clicked. open modal list');
                            // TODO present a list of users and invite the one
                            this.inviteGuest(this.friends[0], role.name);
                        }
                    },{
                        text: 'Cancel',
                        role: 'cancel',
                        icon: !this.platform.is('ios') ? 'close' : null,
                        handler: () => {
                            console.log('Cancel clicked');
                        }
                    }
                ]
            });
            actionSheet.present();
        },

    }
});
