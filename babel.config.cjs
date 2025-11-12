module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: { node: 'current' },
        modules: 'auto', // Convert ESM → CommonJS for tests
      },
    ],
  ],
  env: {
    test: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: { node: 'current' },
            modules: false, // Preserve ESM for tests
          },
        ],
      ],
    },
  },
};
