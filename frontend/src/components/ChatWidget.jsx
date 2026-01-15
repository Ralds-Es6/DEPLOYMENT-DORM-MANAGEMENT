import { useState, useEffect, useRef } from 'react';
import { ChatBubbleLeftRightIcon, XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { sendMessage, getMessages, markAsRead } from '../api/messageService';
import toast from 'react-hot-toast';

const ChatWidget = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const [hasUnread, setHasUnread] = useState(false); // To show red dot

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchMessages = async () => {
        if (!user) return;
        try {
            const data = await getMessages();
            setMessages(data);

            // Check for unread
            const unread = data.some(m => m.isAdminMessage && !m.isRead);
            if (unread && !isOpen) {
                setHasUnread(true);
            }
        } catch (error) {
            console.error('Failed to fetch messages', error);
        }
    };

    useEffect(() => {
        if (user && !user.isAdmin) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 5000); // Poll every 5s
            return () => clearInterval(interval);
        }
    }, [user]);

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            setHasUnread(false);
            markAsRead(); // Mark user's messages as read
        }
    }, [isOpen, messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            setLoading(true);
            const msg = await sendMessage(newMessage);
            setMessages([...messages, msg]);
            setNewMessage('');
        } catch (error) {
            toast.error('Failed to send message');
        } finally {
            setLoading(false);
        }
    };

    if (!user || user.isAdmin) return null; // Only for students

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="bg-white w-[calc(100vw-3rem)] sm:w-96 h-[500px] max-h-[75vh] rounded-2xl shadow-2xl border border-gray-200 mb-4 flex flex-col overflow-hidden animate-slide-up origin-bottom-right">
                    {/* Header */}
                    <div className="bg-primary-600 p-4 flex justify-between items-center text-white">
                        <div className="flex items-center gap-2">
                            <div className="bg-white/20 p-1.5 rounded-lg">
                                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Admin Support</h3>
                                <p className="text-xs text-primary-100">Usually replies within hours</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.length === 0 ? (
                            <div className="text-center text-gray-400 text-sm mt-10">
                                <p>No messages yet.</p>
                                <p>Ask a question to start chatting!</p>
                            </div>
                        ) : (
                            messages.map((msg, index) => {
                                const isMe = !msg.isAdminMessage;
                                return (
                                    <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        {!isMe ? (
                                            <span className="text-xs font-bold text-gray-600 mb-1 ml-2">
                                                {msg.sender?.name || 'Admin'}
                                            </span>
                                        ) : (
                                            <span className="text-xs font-bold text-gray-600 mb-1 mr-2">
                                                {msg.sender?.name || 'Me'}
                                            </span>
                                        )}
                                        <div
                                            className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${isMe
                                                ? 'bg-primary-600 text-white rounded-br-none'
                                                : 'bg-white border border-gray-200 text-gray-700 rounded-bl-none shadow-sm'
                                                }`}
                                        >
                                            <p>{msg.content}</p>
                                            <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-100' : 'text-gray-400'}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {isMe && (
                                                    <span className="ml-1 opacity-75">
                                                        {msg.isRead ? '✓✓' : '✓'}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                        />
                        <button
                            type="submit"
                            disabled={loading || !newMessage.trim()}
                            className="p-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <PaperAirplaneIcon className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-lg shadow-primary-500/30 transition-all hover:scale-105 active:scale-95 relative group"
            >
                {isOpen ? (
                    <XMarkIcon className="w-6 h-6" />
                ) : (
                    <ChatBubbleLeftRightIcon className="w-6 h-6" />
                )}

                {/* Unread Badge */}
                {hasUnread && !isOpen && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                )}

                {!isOpen && (
                    <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Chat Support
                    </span>
                )}
            </button>
        </div>
    );
};

export default ChatWidget;
