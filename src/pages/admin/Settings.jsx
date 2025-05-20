import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { UserCircle, Trash2 } from 'lucide-react';

// ✅ Inline ImageUpload Component
const ImageUpload = ({ currentImage, onImageUpload, onImageRemove }) => {
  const [preview, setPreview] = useState(currentImage || null);

  useEffect(() => {
    setPreview(currentImage || null);
  }, [currentImage]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onImageUpload(file);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover border"
          />
          <button
            type="button"
            onClick={onImageRemove}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            title="Remove photo"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ) : (
        <label className="cursor-pointer text-center">
          <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 border hover:bg-gray-200">
            Upload
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
};

function AdminSettings() {
  const { currentUser } = useAuth();  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfileData(data);
          setValue('name', data.name || '');
          setValue('email', data.email || '');
          setValue('address', data.address || '');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile data');
      }
    };

    fetchProfileData();
  }, [currentUser, setValue]);

  const handleImageUpload = async (file) => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const imageRef = ref(storage, `profile-images/${currentUser.uid}`);
      await uploadBytes(imageRef, file);
      const imageUrl = await getDownloadURL(imageRef);

      await updateDoc(doc(db, 'users', currentUser.uid), {
        profileImage: imageUrl
      });

      setProfileData(prev => ({ ...prev, profileImage: imageUrl }));
      toast.success('Profile image updated successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const handleImageRemove = async () => {
    if (!currentUser || !profileData?.profileImage) return;

    try {
      setLoading(true);
      const imageRef = ref(storage, `profile-images/${currentUser.uid}`);
      await deleteObject(imageRef);

      await updateDoc(doc(db, 'users', currentUser.uid), {
        profileImage: null
      });

      setProfileData(prev => ({ ...prev, profileImage: null }));
      toast.success('Profile image removed successfully');
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove image');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    if (!currentUser) return;

    try {
      setLoading(true);
      await updateDoc(doc(db, 'users', currentUser.uid), {
        name: data.name,
        address: data.address
      });

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Admin Settings">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-soft p-6 animate-fade-in">
        <div className="flex items-center mb-6">
          <UserCircle size={24} className="text-primary-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-800">Profile Settings</h2>
        </div>

        <div className="mb-8">
          <ImageUpload
            currentImage={profileData?.profileImage}
            onImageUpload={handleImageUpload}
            onImageRemove={handleImageRemove}
          />
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input
              label="Full Name"
              {...register('name', { required: 'Name is required' })}
              error={errors.name?.message}
            />

            <Input
              label="Email"
              {...register('email')}
              disabled
              className="bg-gray-50"
            />

            <Input
              label="Address"
              {...register('address')}
              placeholder="Your address"
            />
          </div>

          <div className="mt-6">
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default AdminSettings;
