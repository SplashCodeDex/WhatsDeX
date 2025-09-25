module.exports = {
  env: {
    commonjs: true,
    es2020: true,
    node: true,
    jest: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 2020,
  },
  rules: {
    // In this project, console is used for important user feedback and error logging.
    // We will allow console.log and console.error, but warn on others.
    'no-console': ['warn', { allow: ['log', 'error'] }],
    // Other customizations can be added here
  },
};
