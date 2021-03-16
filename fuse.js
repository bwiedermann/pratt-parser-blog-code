const {fusebox, stylesheet} = require('fuse-box');
const fuse = fusebox({
  entry: 'src/index.ts',
  target: 'browser',
  devServer: true,
  webIndex: {template: 'src/index.html'},
  plugins: [stylesheet],
});

fuse.runDev();