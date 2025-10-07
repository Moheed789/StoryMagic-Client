import React, { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";

const MyStories = () => {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStories = async () => {
      try {
        const session: any = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();

        const res = await fetch(
          "https://keigr6djr2.execute-api.us-east-1.amazonaws.com/dev/stories",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch stories");
        const data = await res.json();
        if (Array.isArray(data)) {
          const extractedStories = data.map((item) => item.story);
          setStories(extractedStories);
        } else if (data.story) {
          setStories([data.story]);
        } else {
          setStories([]);
        }
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    loadStories();
  }, []);

  if (loading) return <p>Loading stories...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Stories</h1>
      {stories.length === 0 ? (
        <p>No stories found.</p>
      ) : (
        <ul className="space-y-3">
          {stories.map((story: any) => (
            <li
              key={story.id}
              className="border rounded p-4 shadow-sm hover:bg-gray-50 cursor-pointer"
            >
              <h2 className="text-lg font-semibold">{story.title}</h2>
              <p className="text-sm text-gray-600">{story.description}</p>
              <p className="text-xs text-gray-500">Status: {story.status}</p>
              <p className="text-xs text-gray-500">
                Total Pages: {story.totalPages}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MyStories;
