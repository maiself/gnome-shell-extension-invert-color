const Main = imports.ui.main;
const Lang = imports.lang;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;
const Clutter = imports.gi.Clutter;
const ExtensionUtils = imports.misc.extensionUtils;

const Self = ExtensionUtils.getCurrentExtension();
const Convenience = Self.imports.convenience;

const SHORTCUT = 'invert-window-shortcut';

const TrueInvertWindowEffect = new Lang.Class({
	Name: 'TrueInvertWindowEffect',
	Extends: Clutter.ShaderEffect,

	vfunc_get_static_shader_source: function() {
		return `
			uniform bool invert_color;
			uniform float opacity = 1.0;
			uniform sampler2D tex;

			/**
			 * based on shift_whitish.glsl https://github.com/vn971/linux-color-inversion
			 */
			void main() {
				vec4 c = texture2D(tex, cogl_tex_coord_in[0].st);
				
				/* shifted */
				float white_bias = .17;
				float m = 1.0 + white_bias;
				
				float shift = white_bias + c.a - min(c.r, min(c.g, c.b)) - max(c.r, max(c.g, c.b));
				
				c = vec4((shift + c.r) / m, 
						(shift + c.g) / m, 
						(shift + c.b) / m, 
						c.a);
					
				/* non-shifted */
				// float shift = c.a - min(c.r, min(c.g, c.b)) - max(c.r, max(c.g, c.b));
				// c = vec4(shift + c.r, shift + c.g, shift + c.b, c.a);

				cogl_color_out = c;
			}
		`;
	},

	vfunc_paint_target: function(paint_context) {
		this.set_uniform_value("tex", 0);
		this.parent(paint_context);
	}
});

function InvertWindow() {
	this.settings = Convenience.getSettings();
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
					let effect = new TrueInvertWindowEffect();
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

		global.get_window_actors().forEach(function(actor) {
			let meta_window = actor.get_meta_window();
			if(meta_window.hasOwnProperty('_invert_window_tag')) {
				let effect = new TrueInvertWindowEffect();
				actor.add_effect_with_name('invert-color', effect);
			}
		}, this);
	},

	disable: function() {
		Main.wm.removeKeybinding(SHORTCUT);

		global.get_window_actors().forEach(function(actor) {
			actor.remove_effect_by_name('invert-color');
		}, this);
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

