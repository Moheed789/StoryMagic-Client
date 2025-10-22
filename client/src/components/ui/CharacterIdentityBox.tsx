"use client";

import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const API_BASE = import.meta.env.VITE_BASE_URL;

type Props = {
  storyId: string;
  className?: string;
};

async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const session: any = await fetchAuthSession();
    const token = session?.tokens?.idToken?.toString();
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export default function CharacterIdentityBox({ storyId, className }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const fetchCharacters = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeader();

      const res = await fetch(
        `${API_BASE}/stories/${encodeURIComponent(storyId)}/characters`,
        { headers: { ...headers } }
      );

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Characters API failed with ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e?.message || "Failed to load characters");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storyId) fetchCharacters();
  }, [storyId]);

  return (
    <Card
      className={
        "p-3 text-xs leading-relaxed shadow-sm border bg-white " +
        (className || "")
      }
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <h4 className="font-semibold text-sm">Character Identity</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchCharacters}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {error ? (
        <div className="text-red-600">Error: {error}</div>
      ) : loading ? (
        <div className="text-muted-foreground">Fetching characters…</div>
      ) : data ? (
        <pre className="whitespace-pre-wrap break-words max-h-56 overflow-auto">
{JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        <div className="text-muted-foreground">No data</div>
      )}
    </Card>
  );
}
