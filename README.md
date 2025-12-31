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
        updateInterval: 60000,  // Update interval in milliseconds (default: 60000)
        cats: ["Whiskers", "Mittens", "Shadow"]  // Array of cat names
    }
}
```

## Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `updateInterval` | How often to update the display (in milliseconds) | `60000` (1 minute) |
| `cats` | Array of cat names (strings) | `[]` (empty array) |

## Development

This module is currently in development. More features and options will be added.

## License

MIT
