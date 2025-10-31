module.exports = {
  env: {
    test: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: { node: 'current' },
            modules: 'commonjs', // Convert ESM → CommonJS for tests
          },
        ],
      ],
    },
  },
};
