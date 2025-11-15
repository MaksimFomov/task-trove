import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import { useState } from 'react';
import Modal from '../../components/Modal';
import type { Account, Portfolio } from '../../types';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [, ] = useState<Account | null>(null);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [portfolioData, setPortfolioData] = useState<Portfolio | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => adminApi.getUsers().then((res) => res.data.users),
  });

  const activateMutation = useMutation({
    mutationFn: (userId: number) => adminApi.activate(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('Пользователь активирован');
    },
  });

  const disactivateMutation = useMutation({
    mutationFn: (userId: number) => adminApi.disactivate(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('Пользователь деактивирован');
    },
  });

  const handleViewPortfolio = async (userId: number) => {
    try {
      const response = await adminApi.getPortfolio(userId);
      setPortfolioData(response.data);
      setShowPortfolio(true);
    } catch (error) {
      toast.error('Ошибка при загрузке портфолио');
    }
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
      <h1 className="text-3xl font-bold text-gray-900">Управление пользователями</h1>

      <div className="card">
        {data && data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Логин
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Роль
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.login}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                        {user.role?.name || 'USER'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {portfolioData?.status === 'ACTIVE' ? (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Активен
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          Неактивен
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleViewPortfolio(user.id)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => activateMutation.mutate(user.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => disactivateMutation.mutate(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Пользователей не найдено</p>
          </div>
        )}
      </div>

      {/* Portfolio Modal */}
      <Modal isOpen={showPortfolio && !!portfolioData} onClose={() => setShowPortfolio(false)}>
        {portfolioData && (
          <div className="card max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Портфолио</h2>
              <button onClick={() => setShowPortfolio(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Имя</p>
                <p className="text-lg">{portfolioData.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-lg">{portfolioData.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Телефон</p>
                <p className="text-lg">{portfolioData.phone || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Город/Страна</p>
                <p className="text-lg">{portfolioData.townCountry || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Специализации</p>
                <p className="text-lg">{portfolioData.specializations || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Занятость</p>
                <p className="text-lg">{portfolioData.employment || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Опыт</p>
                <p className="text-lg whitespace-pre-wrap">{portfolioData.experience || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Статус</p>
                <p className="text-lg">{portfolioData.status || '-'}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

