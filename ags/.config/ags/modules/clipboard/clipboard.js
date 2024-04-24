const { GLib } = imports.gi;
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
const { exec, execAsync } = Utils;
import { MaterialIcon } from '../.commonwidgets/materialicon.js';
import { setupCursorHover } from '../.widgetutils/cursorhover.js';

const clipDir = `${GLib.get_user_cache_dir()}/ags/clipboard`;

export const Clipboard = () => {
	const ClipboardItem = (content, item) => {
		const crosser = Widget.Box({
        	className: 'clipboard-crosser',
    	});
		const contentBox = Widget.Box({
        	className: 'clipboard-item spacing-h-5',
        	children: [
            	Widget.Label({
                	hexpand: true,
                	xalign: 0,
                	wrap: true,
                	className: 'txt txt-small clipboard-item-txt',
                	label: content,
            	}),
            	Widget.Button({ // Remove
                	vpack: 'center',
                	className: 'txt clipboard-item-action',
                	child: MaterialIcon('delete_forever', 'norm', { vpack: 'center' }),
                	onClicked: () => {
                    	const contentWidth = contentBox.get_allocated_width();
                    	crosser.toggleClassName('clipboard-crosser-removed', true);
                    	crosser.css = `margin-left: -${contentWidth}px;`;
                    	Utils.timeout(200, () => {
                        	widgetRevealer.revealChild = false;
                    	});
                    	Utils.timeout(350, () => {
                        	execAsync(["bash", "-c", `echo '${item}' | cliphist delete`]).catch(print);
                    	});
                	},
                	setup: setupCursorHover,
            	}),
            	crosser,
        	]
    	});
    	const widgetRevealer = Widget.Revealer({
        	revealChild: true,
        	transition: 'slide_down',
        	transitionDuration: 150,
        	child: Widget.Button({
        		onClicked: () => {
        			execAsync(["bash", "-c", `echo '${content}' | wl-copy`]).catch(print);
        			mainBox.attribute.update(mainBox);
        		},
        		child: contentBox,
        	}),
    	})
    	return widgetRevealer;
	}
	const mainBox = Widget.Box({
    	vertical: true,
    	className: "spacing-h-15",
    	attribute: {
    		"update": async (self) => {
    			await execAsync(["fish", "-C", `mkdir -p '${clipDir}'; rm '${clipDir}/*'; cliphist list | while read -l line; echo $line > "${clipDir}/$(string escape --style=var $line)"; end`]).catch(print);
    			self.children = [];
    			for (const file of exec(`find '${clipDir}'`).split("\n")) {
    				self.pack_start(ClipboardItem(exec(`fish -C "cat '${file}' | cliphist decode"`), exec(`cat '${file}'`)), false, false, 0);
    			}
    		}
    	},
    	setup: self => {
    		self.attribute.update(self).catch(print);
    	}
	});
	return Widget.Scrollable({
		hscroll: "never",
		vscroll: "automatic",
		child: mainBox,
		setup: (listContents) => {
        	const vScrollbar = listContents.get_vscrollbar();
        	vScrollbar.get_style_context().add_class('sidebar-scrollbar');
    	}
	});
}
