import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadIcon, ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ImageToImage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  const [strength, setStrength] = useState(0.75)

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    onDrop: (files) => {
      const file = files[0]
      const reader = new FileReader()
      reader.onload = () => setUploadedImage(reader.result as string)
      reader.readAsDataURL(file)
      toast.success('Image uploaded!')
    },
  })

  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold gradient-text mb-4">Image to Image</h1>
        <p className="text-gray-600 dark:text-gray-400">Transform existing images with AI</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Upload Image</h3>
          {!uploadedImage ? (
            <div
              {...getRootProps()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center cursor-pointer hover:border-violet-500 transition-colors"
            >
              <input {...getInputProps()} />
              <UploadIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">
                Drag and drop an image here, or click to select
              </p>
            </div>
          ) : (
            <div className="relative">
              <img src={uploadedImage} alt="Uploaded" className="w-full rounded-lg" />
              <button
                onClick={() => setUploadedImage(null)}
                className="absolute top-2 right-2 btn-danger text-sm"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Transformation</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the transformation..."
                className="input h-24 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Strength: {Math.round(strength * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={strength}
                onChange={(e) => setStrength(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <button
              disabled={!uploadedImage || !prompt}
              className="w-full btn-primary"
            >
              Transform Image
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
