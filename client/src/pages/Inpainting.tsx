import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadIcon, PaintbrushIcon } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Inpainting() {
  const [image, setImage] = useState<string | null>(null)
  const [mask, setMask] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')

  const { getRootProps: getImageProps, getInputProps: getImageInput } = useDropzone({
    accept: { 'image/*': [] },
    onDrop: (files) => {
      const reader = new FileReader()
      reader.onload = () => setImage(reader.result as string)
      reader.readAsDataURL(files[0])
    },
  })

  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold gradient-text mb-4">Inpainting</h1>
        <p className="text-gray-600 dark:text-gray-400">Edit specific areas of images</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Original Image</h3>
          {!image ? (
            <div {...getImageProps()} className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer">
              <input {...getImageInput()} />
              <UploadIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">Upload image</p>
            </div>
          ) : (
            <img src={image} alt="Original" className="w-full rounded-lg" />
          )}
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Mask</h3>
          <div className="border-2 border-dashed rounded-xl p-8 text-center">
            <PaintbrushIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">Draw mask (coming soon)</p>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what to add..."
                className="input h-24 resize-none"
              />
            </div>
            <button disabled={!image || !prompt} className="w-full btn-primary">
              Generate
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
