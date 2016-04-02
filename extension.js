const Main = imports.ui.main;
const Lang = imports.lang;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;
const Clutter = imports.gi.Clutter;
const ExtensionUtils = imports.misc.extensionUtils;

const Self = ExtensionUtils.getCurrentExtension();
const Convenience = Self.imports.convenience;

const ui = imports.ui;

const SHORTCUT = 'invert-window-shortcut';

function inject_after(proto, name, func) {
	let orig = proto[name];

	proto[name] = function() {
		let ret = orig.apply(this, arguments);
		return func.apply(this, [ret].concat([].slice.call(arguments)));
	}

	return orig;
}

function remove_injection(proto, name, orig) {
	proto[name] = orig;
}

const InvertWindowEffect = new Lang.Class({
	Name: 'InvertWindowEffect',
	Extends: Clutter.ShaderEffect,

	_init: function(params) {
		this.parent(params);
		this.set_shader_source(' \
			uniform sampler2D tex; \
			void main() { \
				vec4 color = texture2D(tex, cogl_tex_coord_in[0].st); \
				color.rgb /= color.a; \
				color.rgb = vec3(1.0, 1.0, 1.0) - color.rgb; \
				color.rgb *= color.a; \
				cogl_color_out = color * cogl_color_in; \
			} \
		');
	},

	vfunc_paint_target: function() {
		this.set_uniform_value("tex", 0);
		this.parent();
	}
});

function InvertWindow() {
	this.settings = Convenience.getSettings();
	this.workspace_injection = null;
	this.alttab_injection = null;
}

InvertWindow.prototype = {
	toggle_effect: function() {
		global.get_window_actors().forEach(function(actor) {
			let meta_window = actor.get_meta_window();
			if(meta_window.has_focus()) {
				if(actor.get_effect('invert-color')) {
					actor.remove_effect_by_name('invert-color');
					delete meta_window._invert_window_tag;
				}
				else {
					let effect = new InvertWindowEffect();
					actor.add_effect_with_name('invert-color', effect);
					meta_window._invert_window_tag = true;
				}
			}
		}, this);
	},

	enable: function() {
		Main.wm.addKeybinding(
			SHORTCUT,
			this.settings,
			Meta.KeyBindingFlags.NONE,
			Shell.ActionMode.NORMAL,
			Lang.bind(this, this.toggle_effect)
		);

		this.workspace_injection = inject_after(ui.workspace.WindowClone.prototype, '_init', function(ret) {
			if(this.realWindow.get_effect('invert-color')) {
				let effect = new InvertWindowEffect();
				this.actor.add_effect_with_name('invert-color', effect);
			}
			return ret;
		});

		this.alttab_injection = inject_after(ui.altTab, '_createWindowClone', function(clone, window, size) {
			if(window.get_effect('invert-color')) {
				let effect = new InvertWindowEffect();
				clone.add_effect_with_name('invert-color', effect);
			}
			return clone;
		});

		global.get_window_actors().forEach(function(actor) {
			let meta_window = actor.get_meta_window();
			if(meta_window.hasOwnProperty('_invert_window_tag')) {
				let effect = new InvertWindowEffect();
				actor.add_effect_with_name('invert-color', effect);
			}
		}, this);
	},

	disable: function() {
		Main.wm.removeKeybinding(SHORTCUT);

		global.get_window_actors().forEach(function(actor) {
			actor.remove_effect_by_name('invert-color');
		}, this);

		remove_injection(ui.workspace.WindowClone.prototype, '_init', this.workspace_injection);
		this.workspace_injection = null;

		remove_injection(ui.altTab, '_createWindowClone', this.alttab_injection);
		this.alttab_injection = null;
	}
};

let invert_window;

function init() {
}

function enable() {
	invert_window = new InvertWindow();
	invert_window.enable();
}

function disable() {
	invert_window.disable();
	invert_window = null;
}

