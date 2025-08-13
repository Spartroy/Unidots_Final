import React, { useContext } from 'react';
import AuthContext from '../../context/AuthContext';

const CourierProfile = () => {
  const { user } = useContext(AuthContext);
  if (!user) return null;
  return (
    <div className="bg-white shadow rounded p-6">
      <h2 className="text-lg font-semibold mb-4">Your Profile</h2>
      <div className="space-y-2 text-sm text-gray-700">
        <div><span className="font-medium">Name:</span> {user.name}</div>
        <div><span className="font-medium">Email:</span> {user.email}</div>
        <div><span className="font-medium">Role:</span> {user.role}</div>
      </div>
    </div>
  );
};

export default CourierProfile;


