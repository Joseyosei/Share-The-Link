import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Link = Tables<"links">;
export type LinkInsert = TablesInsert<"links">;
export type LinkUpdate = TablesUpdate<"links">;

export const useLinks = () => {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("links")
        .select("*")
        .eq("user_id", session.user.id)
        .order("position", { ascending: true });

      if (error) {
        console.error("Error fetching links:", error);
        setError(error.message);
      } else {
        setLinks(data || []);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Failed to fetch links");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const addLink = async (link: Omit<LinkInsert, "user_id">) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    // Get max position
    const maxPosition = links.length > 0 
      ? Math.max(...links.map(l => l.position || 0)) + 1 
      : 0;

    const { data, error } = await supabase
      .from("links")
      .insert({
        ...link,
        user_id: session.user.id,
        position: link.position ?? maxPosition,
      })
      .select()
      .single();

    if (error) throw error;
    setLinks(prev => [...prev, data]);
    return data;
  };

  const updateLink = async (id: string, updates: LinkUpdate) => {
    const { data, error } = await supabase
      .from("links")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    setLinks(prev => prev.map(l => l.id === id ? data : l));
    return data;
  };

  const deleteLink = async (id: string) => {
    const { error } = await supabase
      .from("links")
      .delete()
      .eq("id", id);

    if (error) throw error;
    setLinks(prev => prev.filter(l => l.id !== id));
  };

  const toggleLink = async (id: string) => {
    const link = links.find(l => l.id === id);
    if (!link) return;

    return updateLink(id, { is_active: !link.is_active });
  };

  const reorderLinks = async (reorderedLinks: Link[]) => {
    // Update positions locally first for instant feedback
    setLinks(reorderedLinks);

    // Then update in database
    const updates = reorderedLinks.map((link, index) => 
      supabase
        .from("links")
        .update({ position: index })
        .eq("id", link.id)
    );

    try {
      await Promise.all(updates);
    } catch (err) {
      console.error("Error reordering links:", err);
      // Refetch to get correct order on error
      fetchLinks();
    }
  };

  const stats = {
    totalLinks: links.length,
    totalClicks: links.reduce((acc, link) => acc + (link.clicks || 0), 0),
    activeLinks: links.filter((link) => link.is_active).length,
  };

  return {
    links,
    loading,
    error,
    stats,
    addLink,
    updateLink,
    deleteLink,
    toggleLink,
    reorderLinks,
    refetch: fetchLinks,
  };
};
