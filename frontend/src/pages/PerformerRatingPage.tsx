import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { customerApi, performerApi } from '../services/api';
import { Trophy, Star, Medal, Award, Loader2, Mail, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TopPerformer {
  id: number;
  lastName?: string;
  firstName?: string;
  middleName?: string;
  fullName?: string;
  email?: string;
  rating: number;
  completedOrdersCount: number;
}

export default function PerformerRatingPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const role = user?.role || '';

  const isCustomer = role === 'Customer';
  const isPerformer = role === 'Performer';

  const { data, isLoading, error } = useQuery({
    queryKey: ['topPerformers'],
    queryFn: async () => {
      if (isCustomer) {
        const response = await customerApi.getTopPerformers();
        return response.data;
      } else if (isPerformer) {
        const response = await performerApi.getTopPerformers();
        return response.data;
      }
      return { performers: [] };
    },
  });

  const performers: TopPerformer[] = data?.performers || [];

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Award className="w-6 h-6 text-amber-600" />;
    return <span className="text-lg font-bold text-gray-500 dark:text-slate-400">{index + 1}</span>;
  };

  const getRankBadgeColor = (index: number) => {
    if (index === 0) return 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700';
    if (index === 1) return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600';
    if (index === 2) return 'bg-amber-100 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700';
    return 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <span className="ml-3 text-lg text-gray-600 dark:text-slate-400">{t('common.loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600 dark:text-red-400">
          {t('common.error')}: {String(error)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 flex items-center">
            <Trophy className="w-8 h-8 mr-3 text-yellow-500" />
            {t('rating.title', 'Рейтинг исполнителей')}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-slate-400">
            {t('rating.description', 'Топ исполнителей на основе оценок заказчиков')}
          </p>
        </div>
      </div>

      {performers.length === 0 ? (
        <div className="card text-center py-12">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg text-gray-500 dark:text-slate-400">
            {t('rating.noPerformers', 'Пока нет исполнителей с рейтингом')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {performers.map((performer, index) => (
            <div
              key={performer.id}
              className={`card border-2 ${getRankBadgeColor(index)} transition-all hover:shadow-lg`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex items-center justify-center w-12 h-12">
                    {getRankIcon(index)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                        {performer.fullName || 
                         `${performer.lastName || ''} ${performer.firstName || ''} ${performer.middleName || ''}`.trim() ||
                         'Исполнитель'}
                      </h3>
                      {index < 3 && (
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                          index === 1 ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' :
                          'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                        }`}>
                          {index === 0 ? '🥇 1 место' : index === 1 ? '🥈 2 место' : '🥉 3 место'}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-slate-400">
                      {performer.email && (
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          {performer.email}
                        </div>
                      )}
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        {performer.completedOrdersCount || 0} {t('rating.completedOrders', 'выполненных заказов')}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <div className="text-right">
                    <div className="flex items-center justify-end space-x-1 mb-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.round(performer.rating / 20)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300 dark:text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                      {performer.rating || 0}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">
                      {t('rating.points', 'баллов')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

