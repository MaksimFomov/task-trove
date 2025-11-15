import SockJS from 'sockjs-client';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';

interface ChatMessage {
  content: string;
  sender: string;
  chatId: number;
  senderId: number;
  senderType: string;
  type: 'CHAT' | 'JOIN' | 'LEAVE';
}

class WebSocketService {
  private stompClient: Client | null = null;
  private subscription: StompSubscription | null = null;
  private listeners: Map<string, ((data: any) => void)[]> = new Map();
  // private reconnectAttempts = 0;
  // private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  // private currentChatId: number | null = null;

  connect(chatId: number) {
    if (this.stompClient?.connected) {
      this.disconnect();
    }

    // this.currentChatId = chatId;
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('No authentication token found');
      this.emit('error', { message: 'Authentication required' });
      return;
    }

    const socket = new SockJS('http://localhost:8080/chat');
    this.stompClient = new Client({
      webSocketFactory: () => socket as any,
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: (str: string) => {
        console.log('STOMP: ' + str);
      },
      reconnectDelay: this.reconnectDelay,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = () => {
      console.log('WebSocket connected');
      // this.reconnectAttempts = 0;
      this.emit('connected', {});
      this.subscribeToChat(chatId);
    };

    this.stompClient.onStompError = (frame: any) => {
      console.error('STOMP error:', frame);
      this.emit('error', { message: frame.headers['message'] || 'Connection error' });
    };

    this.stompClient.onWebSocketError = (error: any) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    };

    this.stompClient.onDisconnect = () => {
      console.log('WebSocket disconnected');
      this.emit('disconnected', {});
    };

    this.stompClient.activate();
  }

  private subscribeToChat(chatId: number) {
    if (!this.stompClient?.connected) {
      console.error('Cannot subscribe: not connected');
      return;
    }

    // Подписываемся на сообщения конкретного чата
    this.subscription = this.stompClient.subscribe(
      `/topic/chat.${chatId}`,
      (message: IMessage) => {
        try {
          const data = JSON.parse(message.body);
          this.emit('message', data);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      }
    );

    // Отправляем уведомление о присоединении к чату
    this.sendJoinMessage(chatId);
  }

  private sendJoinMessage(chatId: number) {
    if (!this.stompClient?.connected) {
      return;
    }

    const joinMessage: Partial<ChatMessage> = {
      chatId,
      type: 'JOIN'
    };

    this.stompClient.publish({
      destination: '/app/chat.addUser',
      body: JSON.stringify(joinMessage)
    });
  }

  disconnect() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
    
    // this.currentChatId = null;
  }

  sendMessage(content: string, chatId: number) {
    if (!this.stompClient?.connected) {
      console.error('WebSocket is not connected');
      return;
    }

    const message: Partial<ChatMessage> = {
      content,
      chatId,
      type: 'CHAT'
    };

    this.stompClient.publish({
      destination: '/app/chat.sendMessage',
      body: JSON.stringify(message)
    });
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: (data: any) => void) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  isConnected(): boolean {
    return this.stompClient?.connected || false;
  }
}

export const wsService = new WebSocketService();

