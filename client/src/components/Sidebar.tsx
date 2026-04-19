import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import {
  HomeIcon,
  PhotoIcon,
  SwatchIcon,
  PaintBrushIcon,
  ClockIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'
import { Link, useLocation } from 'react-router-dom'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navigation = [
  { name: 'Text to Image', href: '/', icon: HomeIcon },
  { name: 'Image to Image', href: '/img2img', icon: PhotoIcon },
  { name: 'Inpainting', href: '/inpainting', icon: PaintBrushIcon },
  { name: 'Gallery', href: '/gallery', icon: SwatchIcon },
  { name: 'History', href: '/history', icon: ClockIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
]

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation()

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 dark:border-gray-700">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">AI</span>
          </div>
          <span className="text-xl font-bold gradient-text">GenArt</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'text-violet-600 dark:text-violet-400')} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Credits card */}
      <div className="p-4">
        <div className="bg-gradient-to-br from-violet-600 to-pink-600 rounded-xl p-4 text-white">
          <h3 className="font-semibold text-sm">Free Plan</h3>
          <p className="text-xs text-white/80 mt-1">100 generations remaining</p>
          <button className="mt-3 w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
            Upgrade to Pro
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-64 lg:bg-white lg:dark:bg-gray-900 lg:border-r lg:border-gray-200 lg:dark:border-gray-700">
        <NavContent />
      </aside>

      {/* Mobile sidebar */}
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex w-full max-w-xs flex-1 bg-white dark:bg-gray-900">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute right-0 top-0 -mr-12 pt-4">
                    <button
                      type="button"
                      className="ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
                      onClick={onClose}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <NavContent />
              </Dialog.Panel>
            </Transition.Child>
            <div className="w-14 flex-shrink-0" aria-hidden="true" />
          </div>
        </Dialog>
      </Transition.Root>
    </>
  )
}
