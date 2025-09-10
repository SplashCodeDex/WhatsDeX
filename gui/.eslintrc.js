module.exports = {
  extends: 'next/core-web-vitals',
  rules: {
    quotes: 'off',
    'linebreak-style': 'off',
    'comma-dangle': 'off',
    'react/react-in-jsx-scope': 'off',
  },
  globals: {
    React: true,
  },
};