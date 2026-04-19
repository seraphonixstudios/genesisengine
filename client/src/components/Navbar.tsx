import { Fragment, useState } from 'react'
import { Dialog, Menu, Transition } from '@headlessui/react'
import {
  Bars3Icon,
  BellIcon,
  MagnifyingGlassIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import toast from 'react-hot-toast'

interface NavbarProps {
  onMenuClick: () => void
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const [searchQuery, setSearchQuery] = useState('')

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 lg:pl-64">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section */}
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 lg:hidden"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            {/* Search */}
            <div className="hidden md:flex ml-4 lg:ml-0">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search generations..."
                  className="input pl-10 w-64"
                />
              </div>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800"
            >
              {theme === 'dark' ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>

            {/* Notifications */}
            <button className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 relative">
              <BellIcon className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Profile dropdown */}
            <Menu as="div" className="relative ml-2">
              <Menu.Button className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <img
                  src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user?.email}
                  alt="Profile"
                  className="h-8 w-8 rounded-full bg-gray-200"
                />
                <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-200">
                  {user?.name || user?.email}
                </span>
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <a
                          href="/settings"
                          className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''} block px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}
                        >
                          Settings
                        </a>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''} block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400`}
                        >
                          Sign out
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </nav>
  )
}
