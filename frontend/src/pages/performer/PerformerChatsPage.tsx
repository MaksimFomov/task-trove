import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { performerApi } from '../../services/api';
import { MessageSquare } from 'lucide-react';

export default function PerformerChatsPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['performerChats'],
    queryFn: () => performerApi.getChats().then((res) => res.data.chats),
  });

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
                onClick={() => navigate(`/chat/${chat.id}`)}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-8 h-8 text-primary-600" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {chat.orderTitle || chat.roomName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Заказчик: {chat.customerName || 'Не указан'}
                    </p>
                  </div>
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
    </div>
  );
}

