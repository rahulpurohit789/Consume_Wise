import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Save, 
  Edit3, 
  Shield, 
  Heart,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const ProfilePage: React.FC = () => {
  const { user, updateProfile, isLoading } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    preferences: {
      allergies: [] as string[],
      dietaryRestrictions: [] as string[]
    }
  });
  const [newAllergy, setNewAllergy] = useState('');
  const [newRestriction, setNewRestriction] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        preferences: user.preferences || {
          allergies: [],
          dietaryRestrictions: []
        }
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    try {
      await updateProfile(formData.preferences);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        preferences: user.preferences || {
          allergies: [],
          dietaryRestrictions: []
        }
      });
    }
    setIsEditing(false);
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !formData.preferences.allergies.includes(newAllergy.trim())) {
      setFormData({
        ...formData,
        preferences: {
          ...formData.preferences,
          allergies: [...formData.preferences.allergies, newAllergy.trim()]
        }
      });
      setNewAllergy('');
    }
  };

  const removeAllergy = (allergy: string) => {
    setFormData({
      ...formData,
      preferences: {
        ...formData.preferences,
        allergies: formData.preferences.allergies.filter(a => a !== allergy)
      }
    });
  };

  const addRestriction = () => {
    if (newRestriction.trim() && !formData.preferences.dietaryRestrictions.includes(newRestriction.trim())) {
      setFormData({
        ...formData,
        preferences: {
          ...formData.preferences,
          dietaryRestrictions: [...formData.preferences.dietaryRestrictions, newRestriction.trim()]
        }
      });
      setNewRestriction('');
    }
  };

  const removeRestriction = (restriction: string) => {
    setFormData({
      ...formData,
      preferences: {
        ...formData.preferences,
        dietaryRestrictions: formData.preferences.dietaryRestrictions.filter(r => r !== restriction)
      }
    });
  };

  const commonAllergies = [
    'Peanuts', 'Tree Nuts', 'Milk', 'Eggs', 'Fish', 'Shellfish', 'Soy', 'Wheat', 'Sesame'
  ];

  const commonRestrictions = [
    'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Paleo', 'Low-Sodium', 'Low-Sugar'
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">User not found</h2>
          <p className="text-gray-600">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your account information and dietary preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="w-5 h-5 mr-2 text-primary-600" />
                  Basic Information
                </h2>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    disabled
                    className="input bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Contact support to change your name
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="input bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Contact support to change your email
                  </p>
                </div>
              </div>
            </div>

            {/* Dietary Preferences */}
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Heart className="w-5 h-5 mr-2 text-primary-600" />
                    Dietary Preferences
                  </h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="btn btn-secondary btn-sm"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    {isEditing ? 'Cancel' : 'Edit'}
                  </button>
                </div>
              </div>
              <div className="card-body space-y-6">
                {/* Allergies */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Food Allergies
                  </label>
                  
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newAllergy}
                          onChange={(e) => setNewAllergy(e.target.value)}
                          placeholder="Add an allergy..."
                          className="input flex-1"
                          onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
                        />
                        <button
                          onClick={addAllergy}
                          className="btn btn-primary"
                        >
                          Add
                        </button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {commonAllergies.map((allergy) => (
                          <button
                            key={allergy}
                            onClick={() => {
                              if (!formData.preferences.allergies.includes(allergy)) {
                                setFormData({
                                  ...formData,
                                  preferences: {
                                    ...formData.preferences,
                                    allergies: [...formData.preferences.allergies, allergy]
                                  }
                                });
                              }
                            }}
                            disabled={formData.preferences.allergies.includes(allergy)}
                            className={`px-3 py-1 text-xs rounded-full border ${
                              formData.preferences.allergies.includes(allergy)
                                ? 'bg-primary-100 text-primary-800 border-primary-200'
                                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                            }`}
                          >
                            {allergy}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.preferences.allergies.map((allergy) => (
                      <span
                        key={allergy}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-danger-100 text-danger-800"
                      >
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {allergy}
                        {isEditing && (
                          <button
                            onClick={() => removeAllergy(allergy)}
                            className="ml-2 text-danger-600 hover:text-danger-800"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Dietary Restrictions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dietary Restrictions
                  </label>
                  
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newRestriction}
                          onChange={(e) => setNewRestriction(e.target.value)}
                          placeholder="Add a restriction..."
                          className="input flex-1"
                          onKeyPress={(e) => e.key === 'Enter' && addRestriction()}
                        />
                        <button
                          onClick={addRestriction}
                          className="btn btn-primary"
                        >
                          Add
                        </button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {commonRestrictions.map((restriction) => (
                          <button
                            key={restriction}
                            onClick={() => {
                              if (!formData.preferences.dietaryRestrictions.includes(restriction)) {
                                setFormData({
                                  ...formData,
                                  preferences: {
                                    ...formData.preferences,
                                    dietaryRestrictions: [...formData.preferences.dietaryRestrictions, restriction]
                                  }
                                });
                              }
                            }}
                            disabled={formData.preferences.dietaryRestrictions.includes(restriction)}
                            className={`px-3 py-1 text-xs rounded-full border ${
                              formData.preferences.dietaryRestrictions.includes(restriction)
                                ? 'bg-primary-100 text-primary-800 border-primary-200'
                                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                            }`}
                          >
                            {restriction}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.preferences.dietaryRestrictions.map((restriction) => (
                      <span
                        key={restriction}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-success-100 text-success-800"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {restriction}
                        {isEditing && (
                          <button
                            onClick={() => removeRestriction(restriction)}
                            className="ml-2 text-success-600 hover:text-success-800"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleCancel}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isLoading}
                      className="btn btn-primary"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Info */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-primary-600" />
                  Account Information
                </h2>
              </div>
              <div className="card-body space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Member since</span>
                  <span className="font-medium">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Account status</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <div className="card-body space-y-3">
                <button className="btn btn-secondary w-full">
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Support
                </button>
                <button className="btn btn-secondary w-full">
                  <Shield className="w-4 h-4 mr-2" />
                  Privacy Settings
                </button>
                <button className="btn btn-danger w-full">
                  Delete Account
                </button>
              </div>
            </div>

            {/* Tips */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">Tips</h2>
              </div>
              <div className="card-body">
                <div className="space-y-3 text-sm text-gray-600">
                  <p>• Update your dietary preferences for better recommendations</p>
                  <p>• Add allergies to get safety warnings</p>
                  <p>• Your preferences help personalize your health insights</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

