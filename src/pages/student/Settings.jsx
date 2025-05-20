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
import ImageUpload from '../../components/ui/ImageUpload';
import { UserCircle } from 'lucide-react';

function StudentSettings() {
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
          setValue('yearLevel', data.yearLevel || '');
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
        address: data.address,
        yearLevel: data.yearLevel
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
    <DashboardLayout title="Student Settings">
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
              label="Year Level"
              {...register('yearLevel', { required: 'Year level is required' })}
              error={errors.yearLevel?.message}
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

export default StudentSettings;