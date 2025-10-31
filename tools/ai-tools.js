module.exports = [
  {
    type: 'function',
    function: {
      name: 'youtubesearch',
      description: 'Search for videos on YouTube based on a query.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description:
              'The search query. For example, "best programming tutorials" or "cat videos".',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'googlesearch',
      description: 'Search Google for up-to-date information on a topic.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query.',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'weather',
      description: 'Get the current weather for a specific location.',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description:
              'The city or location to get the weather for, e.g., "San Francisco" or "Tokyo".',
          },
        },
        required: ['location'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'translate',
      description: 'Translate text from one language to another.',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'The text to translate.',
          },
          to: {
            type: 'string',
            description:
              'The 2-letter ISO 639-1 code for the target language, e.g., "en" for English, "es" for Spanish.',
          },
        },
        required: ['text', 'to'],
      },
    },
  },
];
