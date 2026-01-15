import api from './apiConfig';

const sendMessage = async (content, recipientId = null) => {
    const response = await api.post('/messages', { content, recipientId });
    return response.data;
};

const getMessages = async (userId = null) => {
    // If userId is provided, it's admin viewing that user's chat. 
    // If null, it's user viewing their own chat.
    const url = userId ? `/messages/${userId}` : '/messages';
    const response = await api.get(url);
    return response.data;
};

const getConversations = async () => {
    const response = await api.get('/messages/conversations');
    return response.data;
};

const markAsRead = async (userId = null) => {
    const url = userId ? `/messages/read/${userId}` : '/messages/read';
    const response = await api.put(url);
    return response.data;
};

export {
    sendMessage,
    getMessages,
    getConversations,
    markAsRead
};
