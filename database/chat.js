/**
 * @module database/chat
 * @description Módulo para gerenciar o histórico de chat dos usuários.
 * @param {import("simpl.db").Database} db - A instância do banco de dados.
 * @returns {object} - Um objeto com funções para interagir com o histórico de chat.
 */
module.exports = (db) => {
    // Garante que a tabela 'chat' exista
    if (!db.has("chat")) {
        db.create("chat", []);
    }

    /**
     * Obtém o histórico de chat de um usuário.
     * @param {string} userId - O ID do usuário.
     * @returns {Array<object>} - O histórico de chat do usuário.
     */
    const getHistory = (userId) => {
        const chat = db.get("chat", {
            key: userId
        });
        return chat ? chat.history : [];
    };

    /**
     * Adiciona uma nova mensagem ao histórico de chat de um usuário.
     * @param {string} userId - O ID do usuário.
     * @param {object} message - A mensagem a ser adicionada.
     */
    const addHistory = (userId, message) => {
        let chat = db.get("chat", {
            key: userId
        });
        if (!chat) {
            chat = {
                key: userId,
                history: []
            };
        }
        chat.history.push(message);
        db.set("chat", chat, {
            key: userId
        });
    };

    /**
     * Limpa o histórico de chat de um usuário.
     * @param {string} userId - O ID do usuário.
     */
    const clearHistory = (userId) => {
        db.delete("chat", {
            key: userId
        });
    };

    return {
        getHistory,
        addHistory,
        clearHistory,
    };
};
