import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { customerApi } from '../../services/api';
import { MessageSquare, Trash2, AlertTriangle, Loader2, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Modal from '../../components/Modal';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Chat } from '../../types';
import { saveState, loadState } from '../../utils/stateStorage';

const PAGE_KEY = 'customerChats';

export default function CustomerChatsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState(() => loadState<string>(PAGE_KEY, 'searchTerm', ''));
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>(() => {
    return loadState<'newest' | 'oldest'>(PAGE_KEY, 'sortOrder', 'newest');
  });

  // Сохранение состояния в localStorage
  useEffect(() => {
    saveState(PAGE_KEY, 'searchTerm', searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    saveState(PAGE_KEY, 'sortOrder', sortOrder);
  }, [sortOrder]);

  const { data, isLoading } = useQuery({
    queryKey: ['customerChats'],
    queryFn: () => customerApi.getChats().then((res) => res.data.chats),
    refetchInterval: 1000, // Автоматическое обновление каждую секунду
  });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchTerm(searchTerm.trim().toLowerCase()), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const deleteChatMutation = useMutation({
    mutationFn: (chatId: number) => customerApi.deleteChat(chatId),
    onSuccess: () => {
      // Немедленное обновление всех связанных запросов
      queryClient.invalidateQueries({ queryKey: ['customerChats'] });
      queryClient.invalidateQueries({ queryKey: ['customerOrders'] });
      toast.success(t('chats.chatDeleted'));
      setShowDeleteConfirm(false);
      setChatToDelete(null);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || t('errors.generic');
      toast.error(message);
    },
  });

  const canDeleteChat = (chat: any) => {
    // Чат можно удалить в любой момент (удаление только у себя)
    return true;
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
        <div className="text-lg text-gray-600">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">{t('chats.title')}</h1>
      <div className="card">
        <div className="flex flex-col gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('chats.searchPlaceholder')}
              className="input pl-10"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              className="px-4 py-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="newest">{t('orderList.sortNewest')}</option>
              <option value="oldest">{t('orderList.sortOldest')}</option>
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
                          {chat.performerName || t('orderDetail.notSpecified')}
                        </h3>
                        {chat.orderTitle && (
                          <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                            {chat.orderTitle}
                        </p>
                        )}
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
                      title={t('chats.deleteChatConfirm')}
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
            <p className="text-gray-500 dark:text-slate-400 text-lg">{t('chats.noChats')}</p>
          </div>
        )}
      </div>

      {/* Модальное окно подтверждения удаления */}
      <Modal isOpen={showDeleteConfirm} onClose={handleCancelDelete}>
        <div className="card max-w-md w-full mx-4">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t('chats.deleteChatConfirm')}</h2>
          </div>
          
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-semibold mb-2">
                ⚠️ {t('common.warning')}!
              </p>
              <p className="text-red-700 text-sm">
                {t('chats.deleteChatMessage')}
              </p>
            </div>
            
            <p className="text-gray-700 dark:text-slate-300">
              {t('chats.deleteChatConfirm')}?
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
                    {t('common.loading')}
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('common.yes')}, {t('common.delete')}
                  </>
                )}
              </button>
              <button
                onClick={handleCancelDelete}
                disabled={deleteChatMutation.isPending}
                className="btn btn-secondary flex-1"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

