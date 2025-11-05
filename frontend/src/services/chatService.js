
import api from './api'

export const chatService = {
    async createOrGetChatSession(user1, user2){
        const response = await api.post('api/chat/session', {user1, user2})
        return response.data
    },

    async sendMessage(sessionId, sender, message){
        const response = await api.post('api/chat/message', {sessionId, sender, message})
        return response.data
    },

    async getMessages(sessionId, limit = 10, lastMessageId){
        const response = await api.get(`api/chat/messages/${sessionId}`, {
            params: { limit, lastMessageId }
        })
        return response.data
    },

    async markMessagesAsRead(sessionId, userId, messageIds = []){
        const response = await api.put(`/api/chat/messages/${sessionId}/read`,{
            userId,
            messageIds
        })
        return response.data
    },

    async getUserChatSessions(userId) {
        const response = await api.get(`api/chat/sessions/${userId}`)
        return response.data.sessions
    },

    async deleteMessage(sessionId, userName, message){
        const response = await api.delete(`/api/chat/messages/${sessionId}`, {
            data: { userName, message }
        })
        return response.data
    },

    async getUnreadCounts(userId){
        const response = await api.get(`/api/chat/unread/${userId}`)
        return response.data.counts || {}
    },

    // async getAllUsers() {
    //     const response = await api.get('/users')
    //     return response.data.users
    // }
}