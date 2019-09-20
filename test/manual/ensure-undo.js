/**
 * This contains a utility for ensuring every action is undo-able.
 * When activated, it will undo every action that occurs and ensure
 * that the project state is the same before the action and after
 * the undo.
 */
class EnsureUndo {
    constructor($parent) {
        this.$el = document.createElement('div');
        this.$el.classList.add('ensure-undo');
        this.$el.innerHTML = 'EnsureUndo';
        this.enabled = false;
        this.$el.onclick = () => {
            if (this.enabled) {
                this.disable();
            } else {
                this.enable();
            }
        };
        this.windows = [];
        $parent.appendChild(this.$el);
    }

    enable() {
        this.enabled = true;
        this.$el.classList.add('active');
    }

    disable() {
        this.enabled = false;
        this.$el.classList.remove('active');
    }

    onCompleteAction(i, err, result) {
        const window = this.windows[i];
        const {SnapActions} = window;
        const callback = this.callbacks[i].bind(SnapActions, err, result);
        const action = SnapActions.currentEvent;

        if (err) {
            console.error(err);
            callback()
        } else if (!isUndo || beenUndone) {
            callback();
        } else {  // Undo it!
        }
    }

    register(windows) {
        this.windows = windows;
        this.callbacks = windows.map(window => window.SnapActions.completeAction);

        this.windows.forEach((window, i) => {
            const {SnapActions} = window;
            SnapActions.completeAction = this.onCompleteAction.bind(this, i);
        });
    }

    static init(container) {  // TODO: Pass a handle to the morphic world
        return new EnsureUndo(container);
    }
}
