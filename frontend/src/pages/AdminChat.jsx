import { useState, useEffect, useRef } from 'react';
import {
    ChatBubbleLeftRightIcon,
    PaperAirplaneIcon,
    MagnifyingGlassIcon,
    UserCircleIcon,
    ClockIcon
} from '@heroicons/react/24/outline';
import { getConversations, getMessages, sendMessage, markAsRead } from '../api/messageService';
import toast from 'react-hot-toast';

const AdminChat = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchConversations();
        // Poll for new conversations/messages
        const interval = setInterval(() => {
            fetchConversations();
            if (selectedUser) {
                fetchMessages(selectedUser.userId);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [selectedUser]); // Dependency on selectedUser so fetchMessages uses correct ID

    const fetchConversations = async () => {
        try {
            const data = await getConversations();
            setConversations(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch conversations');
        }
    };

    const fetchMessages = async (userId) => {
        try {
            const data = await getMessages(userId);
            setMessages(data);
        } catch (error) {
            console.error('Failed to fetch chat log');
        }
    };

    const handleSelectUser = async (conv) => {
        setSelectedUser(conv);
        setMessages([]); // Clear previous
        await fetchMessages(conv.userId);
        await markAsRead(conv.userId);
        scrollToBottom();
        fetchConversations(); // Update unread counts
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser) return;

        try {
            setSending(true);
            const msg = await sendMessage(newMessage, selectedUser.userId);
            setMessages([...messages, msg]);
            setNewMessage('');
            scrollToBottom();
        } catch (error) {
            toast.error('Failed to send');
        } finally {
            setSending(false);
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const filteredConversations = conversations.filter(c =>
        c.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.userEmail?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
            {/* Sidebar - Conversation List */}
            <div className={`${selectedUser ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-r border-gray-100 bg-gray-50/50`}>
                <div className="p-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-800 text-lg mb-4">Messages</h2>
                    <div className="relative">
                        <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search Users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="text-center p-8 text-gray-400 text-sm">No conversations found</div>
                    ) : (
                        filteredConversations.map(conv => (
                            <button
                                key={conv.userId}
                                onClick={() => handleSelectUser(conv)}
                                className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-white transition-colors border-b border-gray-100 text-left ${selectedUser?.userId === conv.userId ? 'bg-white border-l-4 border-l-primary-500 shadow-sm' : 'border-l-4 border-l-transparent'
                                    }`}
                            >
                                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold shrink-0">
                                    {conv.userName?.charAt(0) || 'U'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className={`font-semibold text-sm truncate ${conv.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>{conv.userName}</h3>
                                        <span className="text-xs text-gray-400 shrink-0">
                                            {new Date(conv.lastMessageTime).toLocaleDateString() === new Date().toLocaleDateString()
                                                ? new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                : new Date(conv.lastMessageTime).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                        {conv.lastMessageContent}
                                    </p>
                                </div>
                                {conv.unreadCount > 0 && (
                                    <div className="bg-primary-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                        {conv.unreadCount}
                                    </div>
                                )}
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className={`flex-1 flex flex-col ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
                {!selectedUser ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <ChatBubbleLeftRightIcon className="w-8 h-8 text-gray-300" />
                        </div>
                        <p>Select a conversation to start messaging</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setSelectedUser(null)} className="md:hidden text-gray-500 hover:text-gray-700">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                                    {selectedUser.userName?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{selectedUser.userName}</h3>
                                    <p className="text-xs text-gray-500">{selectedUser.userEmail}</p>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
                            {messages.map((msg, idx) => {
                                const isAdmin = msg.isAdminMessage;
                                return (
                                    <div key={idx} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                                        <span className={`text-xs font-bold text-gray-600 mb-1 ${isAdmin ? 'mr-2' : 'ml-2'}`}>
                                            {msg.sender?.name || (isAdmin ? 'Me' : 'User')}
                                        </span>
                                        <div
                                            className={`max-w-[70%] px-5 py-3 rounded-2xl text-sm ${isAdmin
                                                ? 'bg-primary-600 text-white rounded-br-none'
                                                : 'bg-white border border-gray-200 text-gray-700 rounded-bl-none shadow-sm'
                                                }`}
                                        >
                                            <p>{msg.content}</p>
                                            <p className={`text-[10px] mt-1 text-right ${isAdmin ? 'text-primary-100' : 'text-gray-400'}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {isAdmin && (
                                                    <span className="ml-1 opacity-75">{msg.isRead ? '✓✓' : '✓'}</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 flex gap-3">
                            <input
                                type="text"
                                placeholder="Type a reply..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                            />
                            <button
                                type="submit"
                                disabled={sending || !newMessage.trim()}
                                className="p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <PaperAirplaneIcon className="w-6 h-6" />
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminChat;
