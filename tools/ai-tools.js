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
                        description: 'The search query. For example, "best programming tutorials" or "cat videos".'
                    }
                },
                required: ['query']
            }
        }
    }
];
