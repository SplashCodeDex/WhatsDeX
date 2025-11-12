import translateCommand from '../../../commands/tool/translate.js';
import * as apiTools from '../../../tools/api.js';
import axios from 'axios';

// Mock dependencies
jest.mock('axios');
jest.mock('../../../tools/api');

describe('translate command', () => {
  let ctx;

  beforeEach(() => {
    jest.clearAllMocks();
    ctx = {
      args: [],
      quoted: null,
      bot: {
        context: {
          formatter: {
            quote: str => str,
          },
          config: {
            msg: {
              footer: 'test-footer',
            },
          },
        },
      },
      reply: jest.fn(),
    };
  });

  it('should translate text successfully', async () => {
    // Arrange
    ctx.args = ['en', 'halo', 'dunia'];
    const mockApiResponse = { data: { translated_text: 'hello world' } };
    axios.get.mockResolvedValue(mockApiResponse);
    apiTools.createUrl.mockReturnValue('http://mockapi.com/translate');

    // Act
    await translateCommand.code(ctx);

    // Assert
    expect(apiTools.createUrl).toHaveBeenCalledWith('davidcyril', '/tools/translate', {
      text: 'halo dunia',
      to: 'en',
    });
    expect(axios.get).toHaveBeenCalledWith('http://mockapi.com/translate');
    expect(ctx.reply).toHaveBeenCalledWith('hello world');
  });

  it('should fetch and display the language list for the "list" subcommand', async () => {
    // Arrange
    ctx.args = ['list'];
    const mockLangList = {
      data: [
        { code: 'en', language: 'English' },
        { code: 'id', language: 'Indonesian' },
      ],
    };
    axios.get.mockResolvedValue(mockLangList);
    apiTools.createUrl.mockReturnValue('http://mockapi.com/langlist');

    // Act
    await translateCommand.code(ctx);

    // Assert
    expect(axios.get).toHaveBeenCalledWith('http://mockapi.com/langlist');
    const replyText = ctx.reply.mock.calls[0][0].text;
    expect(replyText).toContain('Language Code: en');
    expect(replyText).toContain('Language: English');
    expect(replyText).toContain('Language Code: id');
  });

  it('should reply with an error if no text is provided', async () => {
    // Arrange
    ctx.args = [];

    // Act
    await translateCommand.code(ctx);

    // Assert
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining('Please provide text to translate.')
    );
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('should use "id" as default language if no code is provided', async () => {
    // Arrange
    ctx.args = ['halo', 'dunia'];
    axios.get.mockResolvedValue({ data: { translated_text: 'mock translation' } });

    // Act
    await translateCommand.code(ctx);

    // Assert
    expect(apiTools.createUrl).toHaveBeenCalledWith('davidcyril', '/tools/translate', {
      text: 'halo dunia',
      to: 'id',
    });
  });
});
