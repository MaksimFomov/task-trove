import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { customerApi } from '../../services/api';
import { MessageSquare, Trash2, AlertTriangle, Loader2, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Modal from '../../components/Modal';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Chat } from '../../types';

export default function CustomerChatsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const { data, isLoading } = useQuery({
    queryKey: ['customerChats'],
    queryFn: () => customerApi.getChats().then((res) => res.data.chats),
  });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchTerm(searchTerm.trim().toLowerCase()), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const deleteChatMutation = useMutation({
    mutationFn: (chatId: number) => customerApi.deleteChat(chatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerChats'] });
      toast.success('Чат удален');
      setShowDeleteConfirm(false);
      setChatToDelete(null);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Не удалось удалить чат';
      toast.error(message);
    },
  });

  const canDeleteChat = (chat: any) => {
    return chat.orderIsDone === true || chat.orderPerformerId == null;
  };

  const handleDeleteClick = (chatId: number) => {
    setChatToDelete(chatId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (chatToDelete !== null) {
      deleteChatMutation.mutate(chatToDelete);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setChatToDelete(null);
  };

  const filteredAndSorted = useMemo(() => {
    if (!data) return [];
    const filtered = data.filter((chat: Chat) => {
      if (!debouncedSearchTerm) return true;
      const haystack = [
        chat.orderTitle,
        chat.roomName,
        chat.performerName,
        chat.customerName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(debouncedSearchTerm);
    });

    return [...filtered].sort((a, b) => {
      const dateA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const dateB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [data, debouncedSearchTerm, sortOrder]);

  const renderLastMessageTime = (chat: Chat) => {
    if (!chat.lastMessageTime) return null;
    return (
      <p className="text-xs text-gray-500">
        Последнее сообщение: {format(new Date(chat.lastMessageTime), 'd MMM yyyy HH:mm', { locale: ru })}
      </p>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Чаты</h1>
      <div className="card">
        <div className="flex flex-col gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Поиск по названию заказа, имени или комнате..."
              className="input pl-10"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700 dark:text-slate-300 font-medium">Сортировка:</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              className="input text-sm py-1 px-3 max-w-xs"
            >
              <option value="newest">Сначала новые</option>
              <option value="oldest">Сначала старые</option>
            </select>
          </div>
        </div>
        
        {/* Подсказка по поиску */}
        {debouncedSearchTerm && (
          <div className="text-sm text-gray-600 dark:text-slate-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
            <span className="font-medium">Поиск:</span> "{debouncedSearchTerm}"
            {filteredAndSorted.length > 0 ? (
              <span className="ml-2">— найдено {filteredAndSorted.length} {filteredAndSorted.length === 1 ? 'чат' : filteredAndSorted.length < 5 ? 'чата' : 'чатов'}</span>
            ) : (
              <span className="ml-2 text-orange-600">— ничего не найдено</span>
            )}
          </div>
        )}
        {filteredAndSorted && filteredAndSorted.length > 0 ? (
          <div className="space-y-4">
            {filteredAndSorted.map((chat) => (
              <div
                key={chat.id}
                className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow relative"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="relative flex-1 cursor-pointer"
                    onClick={() => navigate(`/chat/${chat.id}`)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <MessageSquare className="w-8 h-8 text-primary-600" />
                        {(chat.unreadCount ?? 0) > 0 && (
                          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                            {(chat.unreadCount ?? 0) > 99 ? '99+' : chat.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {chat.orderTitle || chat.roomName}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-slate-400">
                          Исполнитель: {chat.performerName || 'Не указан'}
                        </p>
                        {renderLastMessageTime(chat)}
                      </div>
                    </div>
                  </div>
                  {canDeleteChat(chat) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(chat.id);
                      }}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title="Удалить чат"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-slate-400 text-lg">Чатов пока нет</p>
          </div>
        )}
      </div>

      {/* Модальное окно подтверждения удаления */}
      <Modal isOpen={showDeleteConfirm} onClose={handleCancelDelete}>
        <div className="card max-w-md w-full mx-4">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Подтверждение удаления</h2>
          </div>
          
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-semibold mb-2">
                ⚠️ Внимание!
              </p>
              <p className="text-red-700 text-sm">
                Чат будет удален только для вас. Другой участник чата продолжит видеть его в своем списке.
              </p>
            </div>
            
            <p className="text-gray-700 dark:text-slate-300">
              Вы уверены, что хотите удалить этот чат?
            </p>
            
            <div className="flex space-x-2 pt-4">
              <button
                onClick={handleConfirmDelete}
                disabled={deleteChatMutation.isPending}
                className="btn btn-danger flex items-center flex-1"
              >
                {deleteChatMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Удаление...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Да, удалить
                  </>
                )}
              </button>
              <button
                onClick={handleCancelDelete}
                disabled={deleteChatMutation.isPending}
                className="btn btn-secondary flex-1"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

