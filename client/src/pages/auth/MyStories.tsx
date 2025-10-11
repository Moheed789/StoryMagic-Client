// import React, { useEffect, useState } from "react";
// import { fetchAuthSession } from "aws-amplify/auth";

// const MyStories = () => {
//   const [stories, setStories] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const loadStories = async () => {
//       try {
//         const session: any = await fetchAuthSession();
//         const token = session.tokens?.idToken?.toString();

//         const res = await fetch(
//           "https://keigr6djr2.execute-api.us-east-1.amazonaws.com/dev/stories",
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//               "Content-Type": "application/json",
//             },
//           }
//         );

//         if (!res.ok) throw new Error("Failed to fetch stories");
//         const data = await res.json();
//         if (Array.isArray(data)) {
//           const extractedStories = data.map((item) => item.story);
//           setStories(extractedStories);
//         } else if (data.story) {
//           setStories([data.story]);
//         } else {
//           setStories([]);
//         }
//       } catch (err: any) {
//         setError(err.message || "Something went wrong");
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadStories();
//   }, []);

//   if (loading) return <p>Loading stories...</p>;
//   if (error) return <p className="text-red-500">{error}</p>;

//   return (
//     <div className="p-6">
//       <h1 className="text-2xl font-bold mb-4">My Stories</h1>
//       {stories.length === 0 ? (
//         <p>No stories found.</p>
//       ) : (
//         <ul className="space-y-3">
//           {stories.map((story: any) => (
//             <li
//               key={story.id}
//               className="border rounded p-4 shadow-sm hover:bg-gray-50 cursor-pointer"
//             >
//               <h2 className="text-lg font-semibold">{story.title}</h2>
//               <p className="text-sm text-gray-600">{story.description}</p>
//               <p className="text-xs text-gray-500">Status: {story.status}</p>
//               <p className="text-xs text-gray-500">
//                 Total Pages: {story.totalPages}
//               </p>
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );
// };

// export default MyStories;




import React, { useEffect, useMemo, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { Link } from "wouter";

type Story = {
  id: string;
  title: string;
  description?: string | null;
  status?: string;
  totalPages?: number;
  coverImageUrl?: string | null;
};

const MyStories: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const loadStories = async () => {
      try {
        const session: any = await fetchAuthSession();
        const token = session?.tokens?.idToken?.toString();
        setIsAuthed(Boolean(token));

        const res = await fetch(
          "https://keigr6djr2.execute-api.us-east-1.amazonaws.com/dev/stories",
          {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              "Content-Type": "application/json",
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch stories");
        const data = await res.json();

        if (Array.isArray(data)) {
          setStories(data.map((item: any) => item.story ?? item).filter(Boolean));
        } else if (data?.story) {
          setStories([data.story]);
        } else {
          setStories([]);
        }
      } catch (err: any) {
        setError(err?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    loadStories();
  }, []);

  const heading = useMemo(
    () => (
      <div className="text-center mb-8 md:mb-10 mt-[105px]">
        <h1 className="inline-flex items-baseline gap-2 text-3xl md:text-[40px] font-black tracking-tight">
          <span className="text-[#24212C] font-display text-[64px] font-[400]">Your Magical</span>
          <span className="text-[#8C5AF2] font-display text-[64px] font-[400]">Stories</span>
        </h1>
        <p className="text-[#6F677E] font-[500] text-[24px] font-story mt-[16px]">
          Browse, download, or relive the stories you’ve created with AI.
        </p>
      </div>
    ),
    []
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        {heading}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-pulse"
            >
              <div className="bg-slate-200 aspect-[16/9]" />
              <div className="p-4">
                <div className="h-5 w-40 bg-slate-200 rounded mb-2" />
                <div className="h-3 w-56 bg-slate-200 rounded mb-4" />
                <div className="h-10 w-full bg-slate-200 rounded mb-2" />
                <div className="h-10 w-full bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        {heading}
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {heading}

      {/* Print styles scoped here */}
      <style>
        {`
          @media print {
            .no-print { display: none !important; }
            .print-grid {
              display: grid !important;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
            }
            @page { margin: 12mm; }
            .print-card {
              break-inside: avoid;
              page-break-inside: avoid;
              border: 1px solid #e5e7eb; /* ensure border visible on print */
              box-shadow: none !important;
            }
          }
        `}
      </style>

      {/* Print All button (hidden on print) */}
      <div className="no-print flex justify-end mb-4">
        <button
          onClick={() => window.print()}
          className="h-10 px-4 rounded-md bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition"
        >
          Print All
        </button>
      </div>

      {stories.length === 0 ? (
        <p className="text-center text-slate-500">No stories found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 print-grid">
          {stories.map((story) => {
            const img = story.coverImageUrl || "/placeholder-cover.jpg"; // change to your fallback
            return (
              <div
                key={story.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print-card"
              >
                {/* Cover */}
                <div className="aspect-[16/9] w-full overflow-hidden">
                  <img
                    src={img}
                    alt={story.title}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Body */}
                <div className="p-4">
                  <h3 className="font-semibold text-slate-800">
                    {story.title || "Untitled Story"}
                  </h3>

                  {!isAuthed && (
                    <p className="mt-1 text-xs text-slate-500">
                      You need to be signed in to Create a Story.
                      <br />
                      Please log in to continue.
                    </p>
                  )}

                  {/* Buttons (hidden on print with no-print) */}
                  <div className="mt-4 space-y-2">
                    <Link href={`/stories/${story.id}/download`} className="block no-print">
                      <button className="w-full h-10 rounded-md bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition">
                        Download
                      </button>
                    </Link>

                    <Link href={`/stories/${story.id}`} className="block no-print">
                      <button className="w-full h-10 rounded-md bg-violet-100 text-violet-700 text-sm font-medium hover:bg-violet-200 transition">
                        Preview
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyStories;

