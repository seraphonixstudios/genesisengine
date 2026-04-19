import { ClockIcon } from 'lucide-react'

const historyItems = [
  { id: 1, prompt: 'A serene mountain landscape', date: '2024-01-15', status: 'completed' },
  { id: 2, prompt: 'Futuristic city', date: '2024-01-14', status: 'completed' },
  { id: 3, prompt: 'Abstract art', date: '2024-01-13', status: 'failed' },
]

export default function History() {
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold gradient-text mb-4">Generation History</h1>
        <p className="text-gray-600 dark:text-gray-400">View your past generations</p>
      </div>

      <div className="card">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {historyItems.map((item) => (
            <div key={item.id} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                  <ClockIcon className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{item.prompt}</p>
                  <p className="text-sm text-gray-500">{item.date}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                item.status === 'completed'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
