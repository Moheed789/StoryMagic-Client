import React from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';

interface DeleteStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyId: string;
  storyTitle: string;
  onDelete: (storyId: string) => void;
}

const DeleteStoryModal: React.FC<DeleteStoryModalProps> = ({
  isOpen,
  onClose,
  storyId,
  storyTitle,
  onDelete
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      const session: any = await fetchAuthSession();
      const token = session?.tokens?.idToken?.toString();

      const res = await fetch(
        `https://keigr6djr2.execute-api.us-east-1.amazonaws.com/dev/stories/${storyId}`,
        {
          method: 'DELETE',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            'Content-Type': 'application/json',
          },
        }
      );

      if (!res.ok) throw new Error('Failed to delete story');

      // Call the onDelete callback to update the parent component
      onDelete(storyId);
      onClose();
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('Failed to delete story. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-red-600 mb-2">Delete Story?</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Are you sure you want to delete this story?
            <br />
            <span className="font-medium">"{storyTitle}"</span>
            <br />
            This action can't be undone.
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full py-3 px-4 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
          
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteStoryModal;