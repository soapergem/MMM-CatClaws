# MMM-CatClaws

A MagicMirror² module.

## Installation

1. Navigate to your MagicMirror's `modules` folder:
```bash
cd ~/MagicMirror/modules
```

2. Clone this repository:
```bash
git clone https://github.com/gmyers/cat-claws.git MMM-CatClaws
```

3. Navigate to the module folder and install dependencies:
```bash
cd MMM-CatClaws
npm install
```

## Configuration

Add the module to your MagicMirror's `config.js` file:

```javascript
{
    module: "MMM-CatClaws",
    position: "top_right",
    config: {
        cats: ["Whiskers", "Mittens", "Shadow"],  // Array of cat names
        undoTimeout: 10000  // Time in ms to show undo option (0 to disable)
    }
}
```

## Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `cats` | Array of cat names (strings) | `[]` (empty array) |
| `undoTimeout` | Time in milliseconds to show undo option after clicking a tile. Set to `0` to disable undo functionality. | `10000` (10 seconds) |

## Development

This module is currently in development. More features and options will be added.

## License

MIT
