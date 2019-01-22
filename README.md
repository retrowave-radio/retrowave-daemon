# Retrowave Radio - File System

File system abstraction service intended to manage radio air.

Simply it carry on two tasks:

1. Watch for upload directory with music files;
2. Prepare and bring them on/off air.

## Developing

Install dependencies.

```sh
npm -g install pm2@3
npm install
```

Build project.

```sh
npm run build
```

Start project locally in development mode.

```sh
export NODE_ENV=development
npm start
npm run watch
```

To enable debug log messages set NODE_DEBUG environment variable.

```sh
export NODE_DEBUG=retrowave-fs
```
