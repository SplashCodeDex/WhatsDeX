import youtubevideoCommand from '../../../commands/downloader/youtubevideo.js';
import * as apiTools from '../../../tools/api.js';
import axios from 'axios';

jest.mock('../../../tools/cmd.js', () => ({
  parseFlag: jest.fn((argsString, customRules) => {
    const options = {};
    const input = [];
    const args = argsString.trim().split(/\s+/);

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (customRules[arg]) {
        const rule = customRules[arg];

        if (rule.type === 'value') {
          const value = args[i + 1];

          if (value && rule.validator(value)) {
            options[rule.key] = rule.parser(value);
            i++;
          } else {
            options[rule.key] = rule.default || null;
          }
        } else if (rule.type === 'boolean') {
          options[rule.key] = true;
        }
      } else {
        input.push(arg);
      }
    }

    options.input = input.join(' ');
    return options;
  }),
}));

// Mock dependencies
jest.mock('axios');
jest.mock('../../../tools/api');

describe('youtubevideo command', () => {
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
            },
          },
        },
      },
      reply: jest.fn(),
    };
  });

  it('should download a video for a valid URL', async () => {
    // Arrange
    ctx.args = ['https://www.youtube.com/watch?v=dQw4w9WgXcQ'];
    const mockApiResponse = {
      data: {
        result: {
          title: 'Rick Astley - Never Gonna Give You Up',
          download: 'http://example.com/video.mp4',
        },
      },
    };
    axios.get.mockResolvedValue(mockApiResponse);
    apiTools.createUrl.mockReturnValue('http://mockapi.com/youtube?url=...&format=720');

    // Act
    await youtubevideoCommand.code(ctx);

    // Assert
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('http://mockapi.com'));
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        video: { url: 'http://example.com/video.mp4' },
        caption: expect.stringContaining('URL: https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
      })
    );
  });

  it('should reply with an error for an invalid URL', async () => {
    // Arrange
    ctx.args = ['not-a-valid-url'];

    // Act
    await youtubevideoCommand.code(ctx);

    // Assert
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Please provide a valid URL.'));
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('should reply with an error if no URL is provided', async () => {
    // Arrange
    ctx.args = [];

    // Act
    await youtubevideoCommand.code(ctx);

    // Assert
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Please provide a valid URL.'));
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('should use the specified quality when provided', async () => {
    // Arrange
    ctx.args = ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', '-q', '480'];
    axios.get.mockResolvedValue({ data: { result: {} } });

    // Act
    await youtubevideoCommand.code(ctx);

    // Assert
    expect(apiTools.createUrl).toHaveBeenCalledWith('izumi', '/downloader/youtube', {
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      format: '480',
    });
  });

  it('should reply with an error when an invalid quality flag makes the URL invalid', async () => {
    // Arrange
    ctx.args = ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', '-q', 'bad-quality'];

    // Act
    await youtubevideoCommand.code(ctx);

    // Assert
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining('The URL cannot contain spaces.')
    );
    expect(axios.get).not.toHaveBeenCalled();
  });
});
