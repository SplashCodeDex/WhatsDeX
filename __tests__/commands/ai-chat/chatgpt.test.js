const axios = require("axios");
const chatgptCommand = require("../../../commands/ai-chat/chatgpt.js");

jest.mock("axios");

describe("chatgpt command", () => {
    let ctx;

    beforeEach(() => {
        ctx = {
            author: { id: "user123" },
            args: ["hello"],
            bot: {
                context: {
                    config: {
                        api: {
                            openai: "test-key",
                        },
                    },
                    database: {
                        chat: {
                            getHistory: jest.fn().mockReturnValue([]),
                            addHistory: jest.fn(),
                        },
                    },
                    formatter: {
                        quote: (str) => str,
                    },
                    tools: {
                        msg: {
                            generateInstruction: jest.fn(),
                            generateNotes: jest.fn(),
                        },
                        cmd: {
                            generateCmdExample: jest.fn(),
                            handleError: jest.fn(),
                        },
                    },
                },
            },
            reply: jest.fn(),
        };
    });

    it("should reply with an error if openai key is not configured", async () => {
        ctx.bot.context.config.api.openai = "";
        await chatgptCommand.code(ctx);
        expect(ctx.reply).toHaveBeenCalledWith("⛔ OpenAI API key is not configured. Please configure it in the config file.");
    });

    it("should reply with instructions if no input is provided", async () => {
        ctx.args = [];
        await chatgptCommand.code(ctx);
        expect(ctx.reply).toHaveBeenCalled();
        expect(ctx.bot.context.tools.msg.generateInstruction).toHaveBeenCalled();
    });

    it("should call openai api, save history, and reply with the result", async () => {
        const response = { data: { choices: [{ message: { content: "world" } }] } };
        axios.post.mockResolvedValue(response);

        await chatgptCommand.code(ctx);

        expect(ctx.bot.context.database.chat.getHistory).toHaveBeenCalledWith("user123");
        expect(axios.post).toHaveBeenCalled();
        expect(ctx.bot.context.database.chat.addHistory).toHaveBeenCalledTimes(2);
        expect(ctx.reply).toHaveBeenCalledWith("world");
    });

    it("should handle openai api errors", async () => {
        const error = {
            response: {
                data: {
                    error: {
                        message: "Invalid API key",
                    },
                },
            },
        };
        axios.post.mockRejectedValue(error);

        await chatgptCommand.code(ctx);

        expect(ctx.reply).toHaveBeenCalledWith("⛔ OpenAI API Error: Invalid API key");
    });
});
