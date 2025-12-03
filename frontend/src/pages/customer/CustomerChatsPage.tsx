import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { customerApi } from '../../services/api';
import { MessageSquare, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Modal from '../../components/Modal';

export default function CustomerChatsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['customerChats'],
    queryFn: () => customerApi.getChats().then((res) => res.data.chats),
  });

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Чаты</h1>
      <div className="card">
        {data && data.length > 0 ? (
          <div className="space-y-4">
            {data.map((chat) => (
              <div
                key={chat.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative"
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
                        <p className="text-sm text-gray-600">
                          Исполнитель: {chat.performerName || 'Не указан'}
                        </p>
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
            <p className="text-gray-500 text-lg">Чатов пока нет</p>
          </div>
        )}
      </div>

      {/* Модальное окно подтверждения удаления */}
      <Modal isOpen={showDeleteConfirm} onClose={handleCancelDelete}>
        <div className="card max-w-md w-full mx-4">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Подтверждение удаления</h2>
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
            
            <p className="text-gray-700">
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

