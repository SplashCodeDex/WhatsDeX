import googlesearchCommand from '../../../commands/search/googlesearch.js';
import * as apiTools from '../../../tools/api.js';
import axios from 'axios';

// Mock dependencies
jest.mock('axios');
jest.mock('../../../tools/api');

describe('googlesearch command', () => {
  let ctx;

  beforeEach(() => {
    jest.clearAllMocks();
    ctx = {
      args: [],
      bot: {
        context: {
          formatter: {
            quote: str => str,
          },
          config: {
            msg: {
              footer: 'test-footer',
              notFound: 'not found',
            },
          },
        },
      },
      reply: jest.fn(),
    };
  });

  it('should return search results for a valid query', async () => {
    // Arrange
    ctx.args = ['what', 'is', 'love'];
    const mockApiResponse = {
      data: {
        result: [
          {
            title: 'Haddaway - What Is Love',
            desc: 'Music video',
            url: 'http://example.com/haddaway',
          },
          {
            title: 'What Is Love? - Wikipedia',
            desc: 'Wikipedia article',
            url: 'http://example.com/wiki',
          },
        ],
      },
    };
    axios.get.mockResolvedValue(mockApiResponse);
    apiTools.createUrl.mockReturnValue('http://mockapi.com/google?q=what+is+love');

    // Act
    await googlesearchCommand.code(ctx);

    // Assert
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('http://mockapi.com'));
    const replyText = ctx.reply.mock.calls[0][0].text;
    expect(replyText).toContain('Title: Haddaway - What Is Love');
    expect(replyText).toContain('Title: What Is Love? - Wikipedia');
  });

  it('should reply with an error for an empty query', async () => {
    // Arrange
    ctx.args = [];

    // Act
    await googlesearchCommand.code(ctx);

    // Assert
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining('Please provide a search query.')
    );
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('should handle no results from the API', async () => {
    // Arrange
    ctx.args = ['a very obscure query'];
    const mockApiResponse = {
      data: {
        result: [],
      },
    };
    axios.get.mockResolvedValue(mockApiResponse);
    apiTools.createUrl.mockReturnValue('http://mockapi.com/google?q=a+very+obscure+query');

    // Act
    await googlesearchCommand.code(ctx);

    // Assert
    expect(ctx.reply).toHaveBeenCalledWith('not found');
  });
});
