const botMode = require("../middleware/botMode.js");

describe("botMode middleware", () => {
    let ctx;

    beforeEach(() => {
        ctx = {
            self: {
                context: {
                    database: {
                        bot: {
                            get: jest.fn(),
                        },
                    },
                },
            },
            isGroup: jest.fn(),
            isOwner: false,
            userDb: {
                premium: false,
            },
        };
    });

    it("should allow a non-premium user in a group when bot mode is 'group'", async () => {
        ctx.self.context.database.bot.get.mockResolvedValue({ mode: "group" });
        ctx.isGroup.mockReturnValue(true);
        const result = await botMode(ctx);
        expect(result).toBe(true);
    });

    it("should block a non-premium user in a private chat when bot mode is 'group'", async () => {
        ctx.self.context.database.bot.get.mockResolvedValue({ mode: "group" });
        ctx.isGroup.mockReturnValue(false);
        const result = await botMode(ctx);
        expect(result).toBe(false);
    });

    it("should allow a premium user in a private chat when bot mode is 'group'", async () => {
        ctx.self.context.database.bot.get.mockResolvedValue({ mode: "group" });
        ctx.isGroup.mockReturnValue(false);
        ctx.userDb.premium = true;
        const result = await botMode(ctx);
        expect(result).toBe(true);
    });

    it("should allow an owner in a private chat when bot mode is 'group'", async () => {
        ctx.self.context.database.bot.get.mockResolvedValue({ mode: "group" });
        ctx.isGroup.mockReturnValue(false);
        ctx.isOwner = true;
        const result = await botMode(ctx);
        expect(result).toBe(true);
    });

    it("should allow a non-premium user in a private chat when bot mode is 'private'", async () => {
        ctx.self.context.database.bot.get.mockResolvedValue({ mode: "private" });
        ctx.isGroup.mockReturnValue(false);
        const result = await botMode(ctx);
        expect(result).toBe(true);
    });

    it("should block a non-premium user in a group when bot mode is 'private'", async () => {
        ctx.self.context.database.bot.get.mockResolvedValue({ mode: "private" });
        ctx.isGroup.mockReturnValue(true);
        const result = await botMode(ctx);
        expect(result).toBe(false);
    });

    it("should allow an owner in a group when bot mode is 'private'", async () => {
        ctx.self.context.database.bot.get.mockResolvedValue({ mode: "private" });
        ctx.isGroup.mockReturnValue(true);
        ctx.isOwner = true;
        const result = await botMode(ctx);
        expect(result).toBe(true);
    });

    it("should allow an owner when bot mode is 'self'", async () => {
        ctx.self.context.database.bot.get.mockResolvedValue({ mode: "self" });
        ctx.isOwner = true;
        const result = await botMode(ctx);
        expect(result).toBe(true);
    });

    it("should block a non-owner when bot mode is 'self'", async () => {
        ctx.self.context.database.bot.get.mockResolvedValue({ mode: "self" });
        const result = await botMode(ctx);
        expect(result).toBe(false);
    });

    it("should allow any user when bot mode is not set", async () => {
        ctx.self.context.database.bot.get.mockResolvedValue({});
        const result = await botMode(ctx);
        expect(result).toBe(true);
    });
});
