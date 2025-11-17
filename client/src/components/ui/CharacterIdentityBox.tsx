"use client";

import React, { useState, useEffect } from 'react';
import { fetchAuthSession } from "aws-amplify/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "../../hooks/use-toast";
import { EditIcon } from 'lucide-react';

interface Character {
  id: string;
  name: string;
  description: string;
}

interface CharacterIdentityBoxProps {
  storyId: string;
  isBatchGenerating?: boolean; 
}

const CharacterIdentityBox: React.FC<CharacterIdentityBoxProps> = ({ storyId, isBatchGenerating = false }) => {
  const { toast } = useToast();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    fetchCharacters();
  }, [storyId]);

  const fetchCharacters = async () => {
    try {
      setLoading(true);
      setError(null);

      const session: any = await fetchAuthSession();
      const token = session?.tokens?.idToken?.toString();

      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please login first",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/stories/${storyId}/characters`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch characters: ${response.status}`);
      }

      const data = await response.json();

      if (data.characters && Array.isArray(data.characters)) {
        setCharacters(data.characters);
      } else if (Array.isArray(data)) {
        setCharacters(data);
      } else {
        setCharacters([]);
      }

    } catch (error: any) {
      console.error("Error fetching characters:", error);
      setError(error.message || "Failed to load characters");

      toast({
        title: "Error",
        description: "Failed to load characters",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    fetchCharacters();
  };

  const updateCharacterLocally = (updatedCharacter: Character) => {
    setCharacters(prev =>
      prev.map(c => c.id === updatedCharacter.id ? updatedCharacter : c)
    );
  };

  const handleSaveAllCharacters = async () => {
    try {
      setSaveLoading(true);

      const session: any = await fetchAuthSession();
      const token = session?.tokens?.idToken?.toString();

      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please login first",
          variant: "destructive",
        });
        return;
      }

      const charactersToSave = characters.map(character => ({
        name: character.name,
        description: character.description,
        id: character.id
      }));

      console.log("Saving all characters:", charactersToSave);

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/stories/${storyId}/updatecharacters`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(charactersToSave),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update characters: ${response.status}`);
      }

      const responseData = await response.json();
      console.log("Characters update response:", responseData);

      if (responseData.characters && Array.isArray(responseData.characters)) {
        setCharacters(responseData.characters);
      }

      toast({
        title: "Success",
        description: "All characters updated successfully",
        variant: "default",
      });

      setIsEditing(false);

    } catch (error: any) {
      console.error("Error updating characters:", error);
      toast({
        title: "Error",
        description: `Failed to update characters: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Character Identity</h2>
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="space-y-4">
                <div className="h-5 w-32 bg-gray-200 rounded" />
                <div className="h-10 w-full bg-gray-200 rounded" />
                <div className="h-5 w-32 bg-gray-200 rounded" />
                <div className="h-32 w-full bg-gray-200 rounded" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchCharacters} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">

      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[20px] md:text-2xl font-bold text-gray-900">Character Identity</h2>

        {!isEditing ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleEditClick}
            disabled={isBatchGenerating || saveLoading}
            className="gap-1"
          >
            <EditIcon className="h-3 w-3" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelEdit}
              disabled={saveLoading}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveAllCharacters}
              disabled={saveLoading}>
              {saveLoading ? "Saving..." : "Save"}
            </Button>

          </div>
        )}
      </div>


      {characters.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No characters found for this story</p>
          <Button onClick={fetchCharacters} variant="outline">
            Refresh
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {characters.map((character, index) => (
            <CharacterCard
              key={character.id || index}
              character={character}
              index={index}
              isEditing={isEditing}
              onUpdate={updateCharacterLocally}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface CharacterCardProps {
  character: Character;
  index: number;
  isEditing: boolean;
  onUpdate: (character: Character) => void;
}

const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  index,
  isEditing,
  onUpdate
}) => {
  const [editedCharacter, setEditedCharacter] = useState(character);

  useEffect(() => {
    setEditedCharacter(character);
  }, [character]);

  const handleNameChange = (value: string) => {
    const updated = { ...editedCharacter, name: value };
    setEditedCharacter(updated);
    onUpdate(updated);
  };

  const handleDescriptionChange = (value: string) => {
    const updated = { ...editedCharacter, description: value };
    setEditedCharacter(updated);
    onUpdate(updated);
  };

  return (
    <Card className="p-6 bg-gray-100 hover:shadow-lg transition-shadow">
      <div className="space-y-4">
        <div className="text-lg font-semibold text-gray-900">
          Character ID #{String(index + 1).padStart(3, '0')}
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Character Name
          </Label>
          {isEditing ? (
            <Input
              value={editedCharacter.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter character name"
              className="w-full"
            />
          ) : (
            <div className="w-full p-3 bg-white border border-gray-200 rounded-md min-h-[40px] flex items-center">
              <span className="text-gray-900">
                {character.name || "Unnamed Character"}
              </span>
            </div>
          )}
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Character Description
          </Label>
          {isEditing ? (
            <Textarea
              value={editedCharacter.description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Enter character description"
              className="w-full min-h-[120px] resize-none"
              rows={5}
            />
          ) : (
            <div className="w-full p-3 bg-white border border-gray-200 rounded-md min-h-[120px]">
              <p className="text-gray-900 text-sm leading-relaxed">
                {character.description || "No description available"}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default CharacterIdentityBox;
