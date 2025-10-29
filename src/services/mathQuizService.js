const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');

class MathQuizService {
    constructor() {
        this.modes = {
            noob: [-3, 3, -3, 3, '+-', 15000, 10],
            easy: [-10, 10, -10, 10, '*/+-', 20000, 40],
            medium: [-40, 40, -20, 20, '*/+-', 40000, 150],
            hard: [-100, 100, -70, 70, '*/+-', 60000, 350],
            extreme: [-999999, 999999, -999999, 999999, '*/', 99999, 9999],
            impossible: [-99999999999, 99999999999, -99999999999, 999999999999, '*/', 30000, 35000],
            impossible2: [-999999999999999, 999999999999999, -999, 999, '/', 30000, 50000]
        };
        this.operators = { '+': '+', '-': '-', '*': '×', '/': '÷' };
    }

    _randomInt(from, to) {
        if (from > to) [from, to] = [to, from];
        return Math.floor(Math.random() * (to - from + 1) + from);
    }

    _pickRandom(list) {
        return list[Math.floor(Math.random() * list.length)];
    }

    _generateMathQuestion(mode) {
        const [a1, a2, b1, b2, ops, time, bonus] = this.modes[mode];
        let a = this._randomInt(a1, a2);
        let b = this._randomInt(b1, b2);
        let op = this._pickRandom([...ops]);

        if (op === '/' && b === 0) b = 1; // Avoid division by zero

        let result = eval(`${a}${op}${b}`);
        if (op === '/') result = Math.floor(result);

        return {
            question: `${a} ${this.operators[op]} ${b}`,
            answer: result,
            timeLimit: time,
            reward: bonus,
        };
    }

    async startMathQuiz(chatId, playerId, mode = 'easy') {
        if (!this.modes[mode]) {
            throw new Error(`Invalid mode: ${mode}`);
        }

        const activeQuiz = await this.getActiveQuiz(playerId);
        if (activeQuiz) {
            throw new Error('You still have an active math quiz!');
        }

        const questionData = this._generateMathQuestion(mode);
        const expiresAt = new Date(Date.now() + questionData.timeLimit);

        const quizSession = await prisma.gameSession.create({
            data: {
                gameType: 'math_quiz',
                chatId,
                players: [playerId],
                gameState: questionData,
                expiresAt,
            },
        });

        return {
            success: true,
            message: `*Math Quiz - ${mode.toUpperCase()}*\n\nBerapa hasil dari:\n*${questionData.question}*\n\n*Waktu:* ${(questionData.timeLimit / 1000)} detik\n*Hadiah:* ${questionData.reward} XP`,
            quizId: quizSession.id,
        };
    }

    async processMathAnswer(quizId, answer) {
        const quiz = await prisma.gameSession.findUnique({ where: { id: quizId } });
        if (!quiz || !quiz.isActive) {
            return { success: false, message: 'Quiz tidak ditemukan atau sudah berakhir!' };
        }

        await this.endQuiz(quizId); // End the quiz regardless of the answer

        const correctAnswer = quiz.gameState.answer;
        const isCorrect = Math.abs(parseFloat(answer) - correctAnswer) < 0.01;

        if (isCorrect) {
            // Award XP to the user
            await prisma.user.update({
                where: { jid: quiz.players[0] },
                data: { xp: { increment: quiz.gameState.reward } },
            });
            return {
                success: true,
                correct: true,
                message: `*Jawaban Benar! 🎉*\n\n*Soal:* ${quiz.gameState.question}\n*Jawaban:* ${correctAnswer}\n*Kamu mendapat:* ${quiz.gameState.reward} XP`,
            };
        } else {
            return {
                success: true,
                correct: false,
                message: `*Jawaban Salah!*\n\n*Soal:* ${quiz.gameState.question}\n*Jawaban Benar:* ${correctAnswer}`,
            };
        }
    }

    async getActiveQuiz(playerId) {
        return prisma.gameSession.findFirst({
            where: {
                gameType: 'math_quiz',
                players: { has: playerId },
                isActive: true,
                expiresAt: { gt: new Date() },
            },
        });
    }

    async endQuiz(quizId) {
        return prisma.gameSession.update({
            where: { id: quizId },
            data: { isActive: false },
        });
    }

    getAvailableModes() {
        return Object.keys(this.modes);
    }
}

module.exports = new MathQuizService();
