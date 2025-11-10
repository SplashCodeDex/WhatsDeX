module.exports = {
  env: {
    test: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: { node: 'current' },
            modules: 'auto', // Convert ESM → CommonJS for tests
          },
        ],
      ],
    },
  },
};
