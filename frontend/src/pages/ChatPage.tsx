import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [chatDeletedMessage, setChatDeletedMessage] = useState<string | null>(null);
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
    // При загрузке информации о чате сразу обновляем список чатов для обновления счетчика
    onSuccess: () => {
      if (isCustomer) {
        queryClient.invalidateQueries({ queryKey: ['customerChats'] });
      } else if (isPerformer) {
        queryClient.invalidateQueries({ queryKey: ['performerChats'] });
      }
    },
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
    refetchOnMount: true, // Всегда загружаем при монтировании (открытии чата)
    refetchOnWindowFocus: true, // Обновляем при возврате на вкладку
    refetchInterval: 5000, // Автоматическое обновление каждые 5 секунд для синхронизации
    // При каждом запросе getChatMessages бэкенд автоматически обновляет lastCheckedTime,
    // что помечает все сообщения как прочитанные и обновляет счетчик непрочитанных
    onSuccess: () => {
      // Сразу обновляем список чатов после успешной загрузки сообщений
      // Это обновит счетчик непрочитанных немедленно
      if (isCustomer) {
        queryClient.invalidateQueries({ queryKey: ['customerChats'] });
      } else if (isPerformer) {
        queryClient.invalidateQueries({ queryKey: ['performerChats'] });
      }
    },
  });

  // Немедленное обновление счетчика непрочитанных при открытии чата
  useEffect(() => {
    if (!chatId) return;
    
    // Оптимистично обновляем кэш чатов, устанавливая unreadCount = 0 для текущего чата
    // Это делает счетчик непрочитанных равным 0 сразу, до загрузки данных с бэкенда
    if (isCustomer) {
      queryClient.setQueryData(['customerChats'], (oldData: any) => {
        if (!oldData) return oldData;
        // В кэше хранится массив чатов напрямую (из queryFn: res.data.chats)
        if (!Array.isArray(oldData)) return oldData;
        
        return oldData.map((chat: any) => 
          chat.id === Number(chatId) ? { ...chat, unreadCount: 0 } : chat
        );
      });
      
      // Сразу вызываем API для обновления lastCheckedTime на бэкенде
      customerApi.markChatAsRead(Number(chatId))
        .then(() => {
          // После успешного обновления на бэкенде обновляем список чатов
          queryClient.invalidateQueries({ queryKey: ['customerChats'] });
        })
        .catch((error) => {
          console.error('Error marking chat as read:', error);
        });
    } else if (isPerformer) {
      queryClient.setQueryData(['performerChats'], (oldData: any) => {
        if (!oldData) return oldData;
        // В кэше хранится массив чатов напрямую (из queryFn: res.data.chats)
        if (!Array.isArray(oldData)) return oldData;
        
        return oldData.map((chat: any) => 
          chat.id === Number(chatId) ? { ...chat, unreadCount: 0 } : chat
        );
      });
      
      // Сразу вызываем API для обновления lastCheckedTime на бэкенде
      performerApi.markChatAsRead(Number(chatId))
        .then(() => {
          // После успешного обновления на бэкенде обновляем список чатов
          queryClient.invalidateQueries({ queryKey: ['performerChats'] });
        })
        .catch((error) => {
          console.error('Error marking chat as read:', error);
        });
    }
  }, [chatId, isCustomer, isPerformer, queryClient]);

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // Проверяем, удален ли чат другим участником
  useEffect(() => {
    if (chatInfo) {
      if (isCustomer && chatInfo.deletedByPerformer) {
        setChatDeletedMessage('Чат был удален исполнителем. Вы не можете отправлять сообщения в этот чат.');
      } else if (isPerformer && chatInfo.deletedByCustomer) {
        setChatDeletedMessage('Чат был удален заказчиком. Вы не можете отправлять сообщения в этот чат.');
      } else {
        setChatDeletedMessage(null);
      }
    }
  }, [chatInfo, isCustomer, isPerformer]);

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
            // Добавляем сообщение в локальное состояние
            const newMessage: Message = {
              id: data.messageId || Date.now(), // Используем ID из бэкенда, если есть
              content: data.content,
              text: data.content,
              sender: data.sender,
              fromWho: data.sender,
              authorUserId: data.senderId,
              sentAt: data.createdAt || new Date().toISOString(),
            };
            
            setMessages((prev) => {
              // Проверяем, нет ли уже такого сообщения (избегаем дубликатов)
              const exists = prev.some(m => 
                m.id === newMessage.id || 
                (m.content === newMessage.content && 
                 m.authorUserId === newMessage.authorUserId &&
                 Math.abs(new Date(m.sentAt).getTime() - new Date(newMessage.sentAt).getTime()) < 1000)
              );
              if (exists) return prev;
              return [...prev, newMessage];
            });

            // Инвалидируем запрос сообщений, чтобы при следующей загрузке данные были актуальными
            queryClient.invalidateQueries({ queryKey: ['chatMessages', chatId] });
            
            // Обновляем список чатов для обновления счетчика непрочитанных
            if (isCustomer) {
              queryClient.invalidateQueries({ queryKey: ['customerChats'] });
            } else if (isPerformer) {
              queryClient.invalidateQueries({ queryKey: ['performerChats'] });
            }
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });

      // Subscribe to error messages (for deleted chat notifications)
      const userId = user?.id;
      if (userId) {
        client.subscribe(`/user/${userId}/queue/errors`, (message) => {
          try {
            const data = JSON.parse(message.body);
            console.log('Received error:', data);
            if (data.type === 'ERROR' && data.content) {
              setChatDeletedMessage(data.content);
            }
          } catch (error) {
            console.error('Error parsing error message:', error);
          }
        });
      }

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
    
    // Блокируем отправку, если чат удален другим участником
    if (chatDeletedMessage) {
      return;
    }

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
      
      // Инвалидируем запрос сообщений после отправки, чтобы данные обновились
      // Это гарантирует, что при возврате на страницу сообщение будет в списке
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['chatMessages', chatId] });
        // Также обновляем список чатов, чтобы обновилось время последнего сообщения
        if (isCustomer) {
          queryClient.invalidateQueries({ queryKey: ['customerChats'] });
        } else if (isPerformer) {
          queryClient.invalidateQueries({ queryKey: ['performerChats'] });
        }
      }, 500); // Небольшая задержка, чтобы бэкенд успел сохранить сообщение
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
    <div className="flex flex-col h-[calc(100vh-180px)] max-h-[calc(100vh-180px)] overflow-hidden">
      <div className="flex items-center mb-4 flex-shrink-0">
        <button onClick={() => navigate(-1)} className="btn btn-secondary flex items-center mr-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold dark:text-slate-100">
            {chatInfo?.orderTitle || chatInfo?.roomName || `Чат #${chatId}`}
          </h1>
          {chatInfo && (
            <p className="text-sm text-gray-600">
              {isCustomer && chatInfo.performerName && `Исполнитель: ${chatInfo.performerName}`}
              {isPerformer && chatInfo.customerName && `Заказчик: ${chatInfo.customerName}`}
            </p>
          )}
        </div>
      </div>

      <div className="card flex-1 flex flex-col min-h-0 overflow-hidden">
        {chatDeletedMessage && (
          <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-800 rounded-lg flex-shrink-0">
            <p className="text-yellow-800 dark:text-yellow-300 text-sm font-medium">{chatDeletedMessage}</p>
          </div>
        )}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0 px-1">
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
                      ? 'bg-primary-600 text-white dark:bg-primary-500'
                      : 'bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-slate-100'
                  }`}
                >
                  <p className="text-sm font-medium mb-1">
                    {message.sender || message.fromWho || 'Пользователь'}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{message.content || message.text}</p>
                  {message.sentAt && (
                    <p className={`text-xs mt-1 ${isOwn ? 'text-primary-100' : 'text-gray-500 dark:text-slate-400'}`}>
                      {format(new Date(message.sentAt), 'HH:mm')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex space-x-2 flex-shrink-0 pt-2 border-t border-gray-200 dark:border-slate-700">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={chatDeletedMessage ? "Чат удален. Сообщения недоступны." : "Введите сообщение..."}
            disabled={!!chatDeletedMessage}
            className="flex-1 input disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button 
            onClick={handleSendMessage} 
            disabled={!isConnected || !!chatDeletedMessage}
            className="btn btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

