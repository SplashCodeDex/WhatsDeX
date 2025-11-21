/**
 * Math Quiz Service - Interactive math challenges
 * Implements different difficulty levels with proper architecture
 */

class MathQuizService {
  constructor() {
    this.activeQuizzes = new Map();
    this.quizTimeouts = new Map();
    this.rateLimits = new Map();

    // Math difficulty configurations
    this.modes = {
      noob: [-3, 3, -3, 3, '+-', 15000, 10],
      easy: [-10, 10, -10, 10, '*/+-', 20000, 40],
      medium: [-40, 40, -20, 20, '*/+-', 40000, 150],
      hard: [-100, 100, -70, 70, '*/+-', 60000, 350],
      extreme: [-999999, 999999, -999999, 999999, '*/', 99999, 9999],
      impossible: [-99999999999, 99999999999, -99999999999, 999999999999, '*/', 30000, 35000],
      impossible2: [-999999999999999, 999999999999999, -999, 999, '/', 30000, 50000],
    };

    this.operators = {
      '+': '+',
      '-': '-',
      '*': '×',
      '/': '÷',
    };
  }

  /**
   * Generate random integer between two values
   * @param {number} from - Minimum value
   * @param {number} to - Maximum value
   */
  randomInt(from, to) {
    if (from > to) [from, to] = [to, from];
    from = Math.floor(from);
    to = Math.floor(to);
    return Math.floor((to - from) * Math.random() + from);
  }

  /**
   * Pick random item from array
   * @param {Array} list - Array to pick from
   */
  pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  /**
   * Generate math question
   * @param {string} mode - Difficulty mode
   */
  async generateMathQuestion(mode) {
    try {
      if (!this.modes[mode]) {
        throw new Error(`Invalid mode: ${mode}`);
      }

      const [a1, a2, b1, b2, ops, time, bonus] = this.modes[mode];
      let a = this.randomInt(a1, a2);
      let b = this.randomInt(b1, b2);
      let op = this.pickRandom([...ops]);

      // Handle division to avoid division by zero
      if (op === '/' && b === 0) {
        b = 1;
      }

      let result;
      try {
        result = new Function(`return ${a} ${op.replace('/', '*')} ${b < 0 ? `(${b})` : b}`)();
      } catch (error) {
        // Fallback for complex operations
        result = a + b;
        op = '+';
      }

      // Handle division case
      if (op === '/') {
        [a, result] = [result, a];
      }

      return {
        soal: `${a} ${this.operators[op]} ${b}`,
        mode,
        waktu: time,
        hadiah: bonus,
        jawaban: result,
      };
    } catch (error) {
      console.error('Error generating math question:', error);
      throw new Error('Failed to generate math question');
    }
  }

  /**
   * Start math quiz
   * @param {string} chatId - Chat ID
   * @param {string} playerId - Player ID
   * @param {string} mode - Difficulty mode
   */
  async startMathQuiz(chatId, playerId, mode = 'easy') {
    try {
      const quizId = `math_${chatId}_${playerId}_${Date.now()}`;

      // Check if user already has active quiz
      const activeQuiz = this.getActiveQuiz(playerId);
      if (activeQuiz) {
        throw new Error('Kamu masih memiliki quiz matematika yang aktif!');
      }

      // Check rate limit
      if (!this.checkRateLimit(playerId, 'mathquiz')) {
        throw new Error('Rate limit exceeded. Please wait before starting new quiz.');
      }

      // Generate question
      const question = await this.generateMathQuestion(mode);

      const quizData = {
        id: quizId,
        chatId,
        playerId,
        question,
        startTime: Date.now(),
      };

      this.activeQuizzes.set(quizId, quizData);

      // Set timeout based on difficulty
      const timeout = setTimeout(() => {
        this.endQuiz(quizId, 'timeout');
      }, question.waktu);

      this.quizTimeouts.set(quizId, timeout);

      return {
        success: true,
        message: `*Math Quiz - ${mode.toUpperCase()}*\n\n*Berapa hasil dari:*\n*${question.soal}*\n\n*Waktu:* ${(question.waktu / 1000).toFixed(1)} detik\n*Hadiah:* ${question.hadiah} money`,
        quizId,
        question: question.soal,
        timeLimit: question.waktu / 1000,
      };
    } catch (error) {
      console.error('Error starting math quiz:', error);
      throw error;
    }
  }

  /**
   * Process math answer
   * @param {string} quizId - Quiz ID
   * @param {number} answer - User's answer
   */
  async processMathAnswer(quizId, answer) {
    try {
      const quiz = this.activeQuizzes.get(quizId);
      if (!quiz) {
        return { success: false, message: 'Quiz tidak ditemukan!' };
      }

      // Check if answer is correct
      const isCorrect = Math.abs(parseFloat(answer) - quiz.question.jawaban) < 0.01;

      if (isCorrect) {
        // Correct answer
        await this.endQuiz(quizId, 'correct');

        return {
          success: true,
          correct: true,
          message: `*Jawaban Benar! 🎉*\n\n*Soal:* ${quiz.question.soal}\n*Jawaban:* ${quiz.question.jawaban}\n*Hadiah:* ${quiz.question.hadiah} money`,
          reward: quiz.question.hadiah,
        };
      }
      // Wrong answer
      return {
        success: true,
        correct: false,
        message: `*Jawaban Salah!*\n\n*Soal:* ${quiz.question.soal}\n*Jawaban Kamu:* ${answer}\n*Jawaban Benar:* ${quiz.question.jawaban}`,
        correctAnswer: quiz.question.jawaban,
      };
    } catch (error) {
      console.error('Error processing math answer:', error);
      throw new Error('Failed to process answer');
    }
  }

  /**
   * Get active quiz by player
   * @param {string} playerId - Player ID
   */
  getActiveQuiz(playerId) {
    for (const [quizId, quiz] of this.activeQuizzes.entries()) {
      if (quiz.playerId === playerId) {
        return { quizId, quiz };
      }
    }
    return null;
  }

  /**
   * End quiz and cleanup
   * @param {string} quizId - Quiz ID
   * @param {string} reason - Reason for ending
   */
  async endQuiz(quizId, reason) {
    try {
      const quiz = this.activeQuizzes.get(quizId);
      if (!quiz) return;

      // Clear timeout
      const timeout = this.quizTimeouts.get(quizId);
      if (timeout) {
        clearTimeout(timeout);
        this.quizTimeouts.delete(quizId);
      }

      // Remove from active quizzes
      this.activeQuizzes.delete(quizId);

      console.log(`Math quiz ${quizId} ended. Reason: ${reason}`);
    } catch (error) {
      console.error('Error ending math quiz:', error);
    }
  }

  /**
   * Check rate limit for math quizzes
   * @param {string} playerId - Player ID
   * @param {string} operation - Operation type
   */
  checkRateLimit(playerId, operation) {
    const key = `${playerId}_${operation}`;
    const now = Date.now();
    const limit = this.rateLimits.get(key);

    if (!limit || now - limit.lastQuiz > 60000) {
      // 1 minute cooldown
      this.rateLimits.set(key, { lastQuiz: now, count: 1 });
      return true;
    }

    if (limit.count >= 5) {
      // Max 5 quizzes per minute
      return false;
    }

    limit.count++;
    return true;
  }

  /**
   * Clean up inactive quizzes
   */
  cleanupInactiveQuizzes() {
    const now = Date.now();

    for (const [quizId, quiz] of this.activeQuizzes.entries()) {
      if (now - quiz.startTime > 300000) {
        // 5 minutes max
        this.endQuiz(quizId, 'cleanup');
      }
    }
  }

  /**
   * Get available modes
   */
  getAvailableModes() {
    return Object.keys(this.modes);
  }

  /**
   * Get mode information
   * @param {string} mode - Mode name
   */
  getModeInfo(mode) {
    if (!this.modes[mode]) {
      return null;
    }

    const [a1, a2, b1, b2, ops, time, bonus] = this.modes[mode];
    return {
      name: mode,
      range: `${a1} to ${a2}, ${b1} to ${b2}`,
      operators: ops
        .split('')
        .map(op => this.operators[op])
        .join(', '),
      timeLimit: `${time / 1000} seconds`,
      reward: bonus,
    };
  }
}

module.exports = new MathQuizService();
