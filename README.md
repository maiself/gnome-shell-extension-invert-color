# True Color Invert

GNOME shell extension for inverting window colors in hue preserving manner. Effectively a manual dark theme for GNOME windows.

Available on the GNOME Extensions website here:

https://extensions.gnome.org/extension/3530/true-color-invert/

## Keyboard Shortcut

`Super + I`

## Debugging

Errors will print out here:
```bash
journalctl -f -o cat /usr/bin/gnome-shell
```

## Contributing

Before submitting pull requests, please run:

```bash
glib-compile-schemas schemas/
```

To recompile the `gschemas`.

## Building for Release

To make the ZIP for the GNOME Shell Extension website: 

1. `sh build.sh`
2. Tag `main` at that time with a release tag according to the revisions made.
