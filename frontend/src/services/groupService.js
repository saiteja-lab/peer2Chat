import api from './api';

export const groupService = {
  async createGroup(groupName, creatorId, memberIds) {
    const response = await api.post('/api/chat/group/create', {
      groupName,
      creatorId,
      memberIds
    });
    return response.data;
  },

  async getUserGroups(userId) {
    const response = await api.get(`/api/chat/group/user/${userId}`);
    return response.data.groups || [];
  },

  async sendGroupMessage(groupId, sender, message) {
    const response = await api.post('/api/chat/group/message', {
      groupId,
      sender,
      message
    });
    return response.data;
  },

  async getGroupMessages(groupId, limit = 50, lastMessageId) {
    const response = await api.get(`/api/chat/group/${groupId}/messages`, {
      params: { limit, lastMessageId }
    });
    return response.data;
  },

  async deleteGroupMessage(groupId, userName, message) {
    const response = await api.delete(`/api/chat/group/${groupId}/message`, {
      data: { userName, message }
    });
    return response.data;
  }
};
