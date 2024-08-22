import GObject from "gi://GObject";

const SignalHandler = GObject.registerClass(
    {
        Signals: {
            "child-added": { param_types: [GObject.TYPE_OBJECT] },
            "child-removed": { param_types: [GObject.TYPE_OBJECT] },
            "children-changed": {},
        },
    },
    class SignalHandler extends GObject.Object {}
);

export const SignalBox = (props = {}) =>
    Object.assign(Widget.Box(props), {
        sigHandler: new SignalHandler(),
        _emitSignals(sig, child) {
            this.sigHandler.emit(`child-${sig}`, child);
            this.sigHandler.emit("children-changed");
        },
        _handleChildAdd(child) {
            this._emitSignals("added", child);
            const pid = child.connect("parent-set", () => {
                if (child.parent !== this) this._emitSignals("removed", child);
            });
            const did = child.connect("destroy", () => {
                this._emitSignals("removed", child);
                child = null; // Prevent disconnect signals after destroyed
            });
            this.connect("destroy", () => {
                child?.disconnect(pid);
                child?.disconnect(did);
            });
        },
        addSig(child) {
            this.add(child);
            this._handleChildAdd(child);
        },
        packStartSig(child, expand, fill, padding) {
            this.pack_start(child, expand, fill, padding);
            this._handleChildAdd(child);
        },
        packEndSig(child, expand, fill, padding) {
            this.pack_end(child, expand, fill, padding);
            this._handleChildAdd(child);
        },
    });
export default SignalBox;
