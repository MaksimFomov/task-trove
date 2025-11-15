import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { customerApi, performerApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Send, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { Message } from '../types';

export default function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  // const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const stompClientRef = useRef<Client | null>(null);

  const isCustomer = user?.role === 'Customer';
  const isPerformer = user?.role === 'Performer';

  // Получаем информацию о чате
  const { data: chatInfo } = useQuery({
    queryKey: ['chatInfo', chatId],
    queryFn: async () => {
      if (isCustomer) {
        const chats = await customerApi.getChats().then((res) => res.data.chats);
        return chats.find((c) => c.id === Number(chatId));
      } else if (isPerformer) {
        const chats = await performerApi.getChats().then((res) => res.data.chats);
        return chats.find((c) => c.id === Number(chatId));
      }
      return null;
    },
    enabled: !!chatId && (isCustomer || isPerformer),
  });

  const { data: initialMessages } = useQuery({
    queryKey: ['chatMessages', chatId],
    queryFn: () => {
      if (isCustomer) {
        return customerApi.getMessages(Number(chatId)).then((res) => res.data.messages);
      } else if (isPerformer) {
        return performerApi.getMessages(Number(chatId)).then((res) => res.data.messages);
      }
      return Promise.resolve([]);
    },
    enabled: !!chatId && (isCustomer || isPerformer),
  });

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  useEffect(() => {
    if (!chatId) return;

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      return;
    }

    // Create STOMP client with SockJS
    const client = new Client({
      webSocketFactory: () => {
        return new SockJS('http://localhost:8080/chat') as any;
      },
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        console.log('STOMP:', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log('STOMP connected');
      setIsConnected(true);

      // Subscribe to chat messages
      client.subscribe(`/topic/chat.${chatId}`, (message) => {
        try {
          const data = JSON.parse(message.body);
          console.log('Received message:', data);
          
          if (data.type === 'CHAT' && data.content) {
            setMessages((prev) => [...prev, {
              id: Date.now(),
              content: data.content,
              text: data.content,
              sender: data.sender,
              fromWho: data.sender,
              authorUserId: data.senderId,
              sentAt: new Date().toISOString(),
            } as Message]);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });

      // Send join message
      client.publish({
        destination: '/app/chat.addUser',
        body: JSON.stringify({
          chatId: Number(chatId),
          sender: user?.login,
          type: 'JOIN',
        }),
      });
    };

    client.onStompError = (frame) => {
      console.error('STOMP error:', frame);
      setIsConnected(false);
    };

    client.onWebSocketClose = () => {
      console.log('WebSocket closed');
      setIsConnected(false);
    };

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (client.active) {
        client.deactivate();
      }
    };
  }, [chatId, user?.login]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !chatId || !stompClientRef.current || !isConnected) return;

    const message = {
      content: newMessage,
      chatId: Number(chatId),
      sender: user?.login,
      type: 'CHAT',
    };

    try {
      stompClientRef.current.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(message),
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      <div className="flex items-center mb-4">
        <button onClick={() => navigate(-1)} className="btn btn-secondary flex items-center mr-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {chatInfo?.orderTitle || chatInfo?.roomName || `Чат #${chatId}`}
          </h1>
          {chatInfo && (
            <p className="text-sm text-gray-600">
              {isCustomer && chatInfo.performerName && `Исполнитель: ${chatInfo.performerName}`}
              {isPerformer && chatInfo.customerName && `Заказчик: ${chatInfo.customerName}`}
            </p>
          )}
        </div>
        <div className="ml-4">
          <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {isConnected ? '● Подключено' : '○ Отключено'}
          </span>
        </div>
      </div>

      <div className="card flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((message) => {
            const isOwn = message.authorUserId === user?.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwn
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  <p className="text-sm font-medium mb-1">
                    {message.sender || message.fromWho || 'Пользователь'}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{message.content || message.text}</p>
                  {message.sentAt && (
                    <p className={`text-xs mt-1 ${isOwn ? 'text-primary-100' : 'text-gray-500'}`}>
                      {format(new Date(message.sentAt), 'HH:mm')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите сообщение..."
            className="flex-1 input"
          />
          <button 
            onClick={handleSendMessage} 
            disabled={!isConnected}
            className="btn btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

