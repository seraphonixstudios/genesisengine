import { useEffect, useState } from 'react';
import { useGenerationStore } from '../store';
import { PhotoIcon, ClockIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

export default function Gallery() {
  const { generations, fetchGenerations } = useGenerationStore();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchGenerations();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'FAILED':
        return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />;
      case 'PROCESSING':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gallery</h1>
        <span className="text-gray-500">{generations.length} images</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {generations.map((gen) => (
          <div
            key={gen.id}
            onClick={() => gen.url && setSelectedImage(gen.url)}
            className="group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
          >
            {gen.thumbnailUrl || gen.url ? (
              <img
                src={gen.thumbnailUrl || gen.url}
                alt={gen.prompt}
                className="w-full aspect-square object-cover"
              />
            ) : (
              <div className="w-full aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <PhotoIcon className="w-12 h-12 text-gray-400" />
              </div>
            )}
            
            <div className="absolute top-2 right-2">
              {getStatusIcon(gen.status)}
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-white text-sm line-clamp-2">{gen.prompt}</p>
                <p className="text-gray-300 text-xs mt-1">
                  {new Date(gen.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Full size"
            className="max-w-full max-h-full rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
