# Axiom Studio

Open `index.html` in a browser to run the app. The source stays flat in this
directory; the script order in `index.html` is intentional because the classic
scripts share top-level declarations.

## Source files

- `index.html` — app markup and script/style references
- `styles.css` — app layout, themes, and responsive styling
- `editor-reference.js` — language reference and autocomplete catalogs
- `language-parser.js` — tokens, lexer, and parser
- `symbolic-engine.js` — symbolic manipulation and math backend adapter
- `interpreter.js` — Axiom runtime and built-in functions
- `signal-workbench.js` — signal sampling, charts, and plot windows
- `editor.js` — editor history, suggestions, and editing controls
- `app.js` — application controls and helper functions
- `test-suite.js` — validation tests, startup, and error-log export
- `ui.js` — workspace, tabs, settings, and learning UI

Keep the script tags in `index.html` in their current order when adding or
reordering scripts. `ui.js` is an isolated module wrapper and loads last.
