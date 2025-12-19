import { useState } from 'react';

export default function SearchWidget() {
  const [activeTab, setActiveTab] = useState('hotels');
  
  return (
    <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl mx-auto">
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('hotels')}
          className={`px-6 py-2 rounded-lg ${
            activeTab === 'hotels'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100'
          }`}
        >
          Отели
        </button>
        <button
          onClick={() => setActiveTab('flights')}
          className={`px-6 py-2 rounded-lg ${
            activeTab === 'flights'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100'
          }`}
        >
          Авиабилеты
        </button>
      </div>
      <div className="text-gray-800">
        {activeTab === 'hotels' ? (
          <div>Форма поиска отелей</div>
        ) : (
          <div>Форма поиска авиабилетов</div>
        )}
      </div>
    </div>
  );
}
