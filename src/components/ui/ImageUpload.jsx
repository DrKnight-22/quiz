import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import Button from './Button';

const ImageUpload = ({ currentImage, onImageUpload, onImageRemove }) => {
  const [previewUrl, setPreviewUrl] = useState(currentImage || '');
  const [isHovered, setIsHovered] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
        onImageUpload(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = () => {
    setPreviewUrl('');
    onImageRemove();
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative w-32 h-32 mb-4"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt="Profile"
              className="w-full h-full rounded-full object-cover"
            />
            {isHovered && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <Button
                  variant="ghost"
                  className="text-white hover:text-error-500"
                  onClick={handleRemove}
                >
                  <X size={24} />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
            <Upload size={32} className="text-gray-400" />
          </div>
        )}
      </div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id="profile-image-upload"
      />
      <label htmlFor="profile-image-upload">
        <Button
          type="button"
          variant="outline"
          className="cursor-pointer"
        >
          {previewUrl ? 'Change Photo' : 'Upload Photo'}
        </Button>
      </label>
    </div>
  );
};

export default ImageUpload;