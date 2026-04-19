import { useState } from 'react';
import { useAuthStore } from '../store';
import { UserCircleIcon, CreditCardIcon, BellIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function Settings() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserCircleIcon },
    { id: 'billing', name: 'Billing', icon: CreditCardIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-violet-500 text-violet-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.name}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  defaultValue={user?.name}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  defaultValue={user?.email}
                  disabled
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800"
                />
              </div>
              <button className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700">
                Save Changes
              </button>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium">Current Plan</p>
                  <p className="text-2xl font-bold text-violet-600">{user?.plan}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Credits Remaining</p>
                  <p className="text-2xl font-bold">{user?.credits}</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700">
                Upgrade Plan
              </button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-violet-600" />
                <span>Email notifications for completed generations</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="w-4 h-4 text-violet-600" />
                <span>Marketing emails</span>
              </label>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Password
                </label>
                <input type="password" className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <input type="password" className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600" />
              </div>
              <button className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700">
                Update Password
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
