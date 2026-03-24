import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { Palette, Image, Type, Square, Sparkles, Check, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAppearanceSettings } from "@/hooks/useAppearanceSettings";
import { useLinks } from "@/hooks/useLinks";
import { ThemedProfilePreview } from "@/components/dashboard/ThemedProfilePreview";

export interface Theme {
  id: string;
  name: string;
  background: string;
  buttonStyle: string;
  textColor: string;
  isPro?: boolean;
}

export const themes: Theme[] = [
  // ── Free themes ──────────────────────────────────────────────
  { id: "air", name: "Air", background: "bg-white", buttonStyle: "bg-gray-900", textColor: "text-gray-900" },
  { id: "agate", name: "Agate", background: "bg-gradient-to-br from-purple-500 to-pink-500", buttonStyle: "bg-white", textColor: "text-white" },
  { id: "bliss", name: "Bliss", background: "bg-gradient-to-br from-gray-200 to-gray-400", buttonStyle: "bg-gray-800", textColor: "text-gray-800" },
  { id: "breeze", name: "Breeze", background: "bg-gradient-to-br from-pink-200 to-pink-300", buttonStyle: "bg-white", textColor: "text-pink-900" },
  { id: "encore", name: "Encore", background: "bg-gradient-to-br from-amber-900 to-stone-800", buttonStyle: "bg-amber-100", textColor: "text-amber-100" },
  { id: "grid", name: "Grid", background: "bg-lime-100", buttonStyle: "bg-white", textColor: "text-lime-900" },
  { id: "haven", name: "Haven", background: "bg-gradient-to-br from-stone-200 to-stone-400", buttonStyle: "bg-white", textColor: "text-stone-800" },
  { id: "lake", name: "Lake", background: "bg-slate-900", buttonStyle: "bg-white", textColor: "text-white" },
  { id: "mineral", name: "Mineral", background: "bg-amber-50", buttonStyle: "bg-amber-200", textColor: "text-amber-900" },
  { id: "twilight", name: "Twilight", background: "bg-gradient-to-br from-purple-300 to-pink-300", buttonStyle: "bg-pink-400", textColor: "text-purple-900" },
  { id: "serenity", name: "Serenity", background: "bg-gradient-to-br from-sky-100 to-blue-200", buttonStyle: "bg-blue-600", textColor: "text-blue-900" },
  { id: "midnight", name: "Midnight", background: "bg-gradient-to-br from-gray-900 to-slate-800", buttonStyle: "bg-white", textColor: "text-white" },
  // ── New free themes ──────────────────────────────────────────
  { id: "cloud", name: "Cloud", background: "bg-gradient-to-b from-blue-50 to-white", buttonStyle: "bg-blue-500", textColor: "text-blue-900" },
  { id: "sand", name: "Sand", background: "bg-gradient-to-br from-orange-50 to-amber-100", buttonStyle: "bg-amber-800", textColor: "text-amber-900" },
  { id: "slate", name: "Slate", background: "bg-gradient-to-br from-slate-700 to-slate-900", buttonStyle: "bg-slate-400", textColor: "text-slate-100" },
  { id: "lavender", name: "Lavender", background: "bg-gradient-to-br from-violet-100 to-purple-200", buttonStyle: "bg-violet-600", textColor: "text-violet-900" },
  { id: "mint", name: "Mint", background: "bg-gradient-to-br from-emerald-50 to-teal-100", buttonStyle: "bg-teal-600", textColor: "text-teal-900" },
  { id: "peach", name: "Peach", background: "bg-gradient-to-br from-orange-100 to-rose-100", buttonStyle: "bg-rose-500", textColor: "text-rose-900" },
  // ── Pro themes ───────────────────────────────────────────────
  { id: "blocks", name: "Blocks", background: "bg-gradient-to-br from-violet-600 to-purple-700", buttonStyle: "bg-pink-500", textColor: "text-white", isPro: true },
  { id: "bloom", name: "Bloom", background: "bg-gradient-to-br from-blue-900 to-slate-900", buttonStyle: "bg-pink-400", textColor: "text-white", isPro: true },
  { id: "groove", name: "Groove", background: "bg-gradient-to-br from-cyan-400 to-purple-600", buttonStyle: "bg-lime-400", textColor: "text-white", isPro: true },
  { id: "nourish", name: "Nourish", background: "bg-gradient-to-br from-orange-300 to-yellow-200", buttonStyle: "bg-lime-400", textColor: "text-orange-900", isPro: true },
  { id: "rise", name: "Rise", background: "bg-gradient-to-br from-orange-500 to-red-600", buttonStyle: "bg-lime-400", textColor: "text-white", isPro: true },
  { id: "sweat", name: "Sweat", background: "bg-gradient-to-br from-pink-500 to-blue-600", buttonStyle: "bg-blue-500", textColor: "text-white", isPro: true },
  { id: "ember", name: "Ember", background: "bg-gradient-to-br from-red-600 to-orange-500", buttonStyle: "bg-yellow-400", textColor: "text-white", isPro: true },
  { id: "arctic", name: "Arctic", background: "bg-gradient-to-br from-cyan-200 to-blue-400", buttonStyle: "bg-white", textColor: "text-blue-900", isPro: true },
  { id: "noir", name: "Noir", background: "bg-black", buttonStyle: "bg-white", textColor: "text-white", isPro: true },
  { id: "sunset", name: "Sunset", background: "bg-gradient-to-br from-rose-400 to-amber-400", buttonStyle: "bg-white", textColor: "text-white", isPro: true },
  { id: "forest", name: "Forest", background: "bg-gradient-to-br from-emerald-700 to-green-900", buttonStyle: "bg-lime-300", textColor: "text-lime-100", isPro: true },
  { id: "royal", name: "Royal", background: "bg-gradient-to-br from-indigo-800 to-purple-900", buttonStyle: "bg-amber-400", textColor: "text-amber-100", isPro: true },
  // ── New premium themes (beyond Linktree/Stan) ────────────────
  { id: "aurora", name: "Aurora", background: "bg-gradient-to-br from-green-400 via-cyan-500 to-blue-600", buttonStyle: "bg-white", textColor: "text-white", isPro: true },
  { id: "cosmos", name: "Cosmos", background: "bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-800", buttonStyle: "bg-pink-500", textColor: "text-white", isPro: true },
  { id: "honey", name: "Honey", background: "bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500", buttonStyle: "bg-amber-900", textColor: "text-amber-950" },
  { id: "ocean", name: "Ocean", background: "bg-gradient-to-b from-sky-400 via-blue-500 to-indigo-700", buttonStyle: "bg-white", textColor: "text-white", isPro: true },
  { id: "cherry", name: "Cherry", background: "bg-gradient-to-br from-rose-600 to-pink-800", buttonStyle: "bg-rose-200", textColor: "text-white", isPro: true },
  { id: "neon", name: "Neon", background: "bg-gray-950", buttonStyle: "bg-gradient-to-r from-green-400 to-cyan-400", textColor: "text-green-400", isPro: true },
  { id: "velvet", name: "Velvet", background: "bg-gradient-to-br from-rose-900 via-purple-900 to-indigo-900", buttonStyle: "bg-rose-400", textColor: "text-rose-100", isPro: true },
  { id: "glacier", name: "Glacier", background: "bg-gradient-to-br from-slate-100 via-blue-50 to-cyan-100", buttonStyle: "bg-cyan-700", textColor: "text-cyan-900", isPro: true },
  { id: "sahara", name: "Sahara", background: "bg-gradient-to-br from-amber-200 via-orange-200 to-yellow-100", buttonStyle: "bg-amber-700", textColor: "text-amber-900", isPro: true },
  { id: "matrix", name: "Matrix", background: "bg-black", buttonStyle: "bg-green-500", textColor: "text-green-400", isPro: true },
  { id: "sakura", name: "Sakura", background: "bg-gradient-to-br from-pink-100 via-rose-200 to-pink-300", buttonStyle: "bg-rose-600", textColor: "text-rose-900", isPro: true },
  { id: "thunder", name: "Thunder", background: "bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900", buttonStyle: "bg-yellow-400", textColor: "text-white", isPro: true },
  { id: "tropical", name: "Tropical", background: "bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600", buttonStyle: "bg-yellow-300", textColor: "text-white", isPro: true },
  { id: "wine", name: "Wine", background: "bg-gradient-to-br from-red-950 to-rose-900", buttonStyle: "bg-rose-300", textColor: "text-rose-100", isPro: true },
  { id: "cotton", name: "Cotton", background: "bg-gradient-to-br from-pink-50 via-white to-blue-50", buttonStyle: "bg-pink-400", textColor: "text-gray-800" },
  { id: "obsidian", name: "Obsidian", background: "bg-gradient-to-br from-gray-950 via-zinc-900 to-neutral-950", buttonStyle: "bg-zinc-600", textColor: "text-zinc-300", isPro: true },
  { id: "candy", name: "Candy", background: "bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-400", buttonStyle: "bg-white", textColor: "text-white", isPro: true },
  { id: "earth", name: "Earth", background: "bg-gradient-to-br from-stone-600 via-amber-800 to-stone-700", buttonStyle: "bg-amber-200", textColor: "text-amber-100", isPro: true },
  { id: "prism", name: "Prism", background: "bg-gradient-to-br from-red-500 via-yellow-400 via-green-400 to-blue-500", buttonStyle: "bg-white", textColor: "text-white", isPro: true },
  // ── 200 Unique Premium Themes ──────────────────────────────────
  // Moods & Aesthetics
  { id: "dreamscape", name: "Dreamscape", background: "bg-gradient-to-br from-violet-300 via-fuchsia-200 to-pink-200", buttonStyle: "bg-violet-700", textColor: "text-violet-900", isPro: true },
  { id: "stardust", name: "Stardust", background: "bg-gradient-to-br from-indigo-900 via-purple-800 to-violet-900", buttonStyle: "bg-amber-300", textColor: "text-amber-200", isPro: true },
  { id: "moonlit", name: "Moonlit", background: "bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950", buttonStyle: "bg-indigo-400", textColor: "text-indigo-200", isPro: true },
  { id: "solstice", name: "Solstice", background: "bg-gradient-to-br from-orange-600 via-red-500 to-pink-600", buttonStyle: "bg-yellow-200", textColor: "text-white", isPro: true },
  { id: "equinox", name: "Equinox", background: "bg-gradient-to-br from-teal-700 via-emerald-600 to-lime-500", buttonStyle: "bg-white", textColor: "text-white", isPro: true },
  { id: "mirage", name: "Mirage", background: "bg-gradient-to-br from-amber-300 via-orange-300 to-rose-400", buttonStyle: "bg-rose-700", textColor: "text-rose-900", isPro: true },
  { id: "nebula", name: "Nebula", background: "bg-gradient-to-br from-purple-900 via-blue-800 to-cyan-700", buttonStyle: "bg-cyan-300", textColor: "text-cyan-100", isPro: true },
  { id: "opal", name: "Opal", background: "bg-gradient-to-br from-teal-100 via-pink-100 to-violet-100", buttonStyle: "bg-teal-600", textColor: "text-teal-900", isPro: true },
  { id: "ivory", name: "Ivory", background: "bg-gradient-to-b from-amber-50 to-stone-100", buttonStyle: "bg-stone-700", textColor: "text-stone-800" },
  { id: "dusk", name: "Dusk", background: "bg-gradient-to-br from-orange-400 via-pink-500 to-purple-700", buttonStyle: "bg-white", textColor: "text-white", isPro: true },
  // Nature-Inspired
  { id: "rainforest", name: "Rainforest", background: "bg-gradient-to-br from-green-800 via-emerald-700 to-teal-800", buttonStyle: "bg-lime-400", textColor: "text-lime-100", isPro: true },
  { id: "coral-reef", name: "Coral Reef", background: "bg-gradient-to-br from-cyan-400 via-teal-300 to-emerald-300", buttonStyle: "bg-orange-500", textColor: "text-teal-900", isPro: true },
  { id: "volcano", name: "Volcano", background: "bg-gradient-to-br from-red-900 via-orange-800 to-yellow-700", buttonStyle: "bg-yellow-300", textColor: "text-yellow-100", isPro: true },
  { id: "bamboo", name: "Bamboo", background: "bg-gradient-to-b from-lime-200 via-green-200 to-emerald-200", buttonStyle: "bg-green-800", textColor: "text-green-900" },
  { id: "tundra", name: "Tundra", background: "bg-gradient-to-br from-blue-100 via-gray-200 to-slate-200", buttonStyle: "bg-slate-700", textColor: "text-slate-800" },
  { id: "canyon", name: "Canyon", background: "bg-gradient-to-br from-orange-700 via-red-700 to-stone-700", buttonStyle: "bg-amber-200", textColor: "text-amber-100", isPro: true },
  { id: "meadow", name: "Meadow", background: "bg-gradient-to-br from-green-300 via-yellow-200 to-lime-200", buttonStyle: "bg-green-700", textColor: "text-green-900" },
  { id: "alpine", name: "Alpine", background: "bg-gradient-to-b from-sky-300 via-white to-emerald-200", buttonStyle: "bg-sky-700", textColor: "text-sky-900", isPro: true },
  { id: "savanna", name: "Savanna", background: "bg-gradient-to-br from-amber-400 via-yellow-300 to-orange-300", buttonStyle: "bg-stone-800", textColor: "text-stone-900", isPro: true },
  { id: "lagoon", name: "Lagoon", background: "bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500", buttonStyle: "bg-white", textColor: "text-white", isPro: true },
  // Urban & Modern
  { id: "concrete", name: "Concrete", background: "bg-gradient-to-br from-zinc-400 via-gray-500 to-stone-500", buttonStyle: "bg-white", textColor: "text-white", isPro: true },
  { id: "chrome", name: "Chrome", background: "bg-gradient-to-br from-gray-200 via-zinc-100 to-gray-300", buttonStyle: "bg-gray-900", textColor: "text-gray-800" },
  { id: "blueprint", name: "Blueprint", background: "bg-gradient-to-br from-blue-800 to-blue-950", buttonStyle: "bg-blue-200", textColor: "text-blue-100", isPro: true },
  { id: "graphite", name: "Graphite", background: "bg-gradient-to-br from-neutral-800 via-gray-800 to-zinc-800", buttonStyle: "bg-neutral-400", textColor: "text-neutral-200", isPro: true },
  { id: "neon-tokyo", name: "Neon Tokyo", background: "bg-gradient-to-br from-fuchsia-900 via-purple-950 to-black", buttonStyle: "bg-fuchsia-500", textColor: "text-fuchsia-300", isPro: true },
  { id: "studio", name: "Studio", background: "bg-neutral-100", buttonStyle: "bg-neutral-900", textColor: "text-neutral-900" },
  { id: "warehouse", name: "Warehouse", background: "bg-gradient-to-br from-stone-700 via-stone-600 to-zinc-700", buttonStyle: "bg-orange-400", textColor: "text-orange-100", isPro: true },
  { id: "penthouse", name: "Penthouse", background: "bg-gradient-to-br from-gray-900 to-gray-950", buttonStyle: "bg-amber-400", textColor: "text-amber-200", isPro: true },
  { id: "retro-wave", name: "Retro Wave", background: "bg-gradient-to-b from-purple-900 via-pink-800 to-orange-600", buttonStyle: "bg-cyan-400", textColor: "text-cyan-200", isPro: true },
  { id: "cyberpunk", name: "Cyberpunk", background: "bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-900", buttonStyle: "bg-black", textColor: "text-yellow-300", isPro: true },
  // Artistic & Creative
  { id: "watercolor", name: "Watercolor", background: "bg-gradient-to-br from-pink-200 via-blue-200 to-green-200", buttonStyle: "bg-indigo-600", textColor: "text-indigo-900", isPro: true },
  { id: "mosaic", name: "Mosaic", background: "bg-gradient-to-br from-teal-400 via-purple-400 to-amber-400", buttonStyle: "bg-white", textColor: "text-white", isPro: true },
  { id: "abstract", name: "Abstract", background: "bg-gradient-to-br from-rose-500 via-violet-500 to-cyan-500", buttonStyle: "bg-white", textColor: "text-white", isPro: true },
  { id: "impressionist", name: "Impressionist", background: "bg-gradient-to-br from-blue-300 via-green-300 to-yellow-300", buttonStyle: "bg-indigo-700", textColor: "text-indigo-900", isPro: true },
  { id: "pop-art", name: "Pop Art", background: "bg-gradient-to-br from-yellow-400 via-red-500 to-blue-600", buttonStyle: "bg-yellow-300", textColor: "text-white", isPro: true },
  { id: "origami", name: "Origami", background: "bg-gradient-to-br from-red-100 via-white to-blue-100", buttonStyle: "bg-red-600", textColor: "text-red-900", isPro: true },
  { id: "batik", name: "Batik", background: "bg-gradient-to-br from-indigo-800 via-amber-700 to-emerald-700", buttonStyle: "bg-amber-300", textColor: "text-amber-100", isPro: true },
  { id: "graffiti", name: "Graffiti", background: "bg-gradient-to-br from-lime-500 via-yellow-400 to-orange-500", buttonStyle: "bg-purple-700", textColor: "text-white", isPro: true },
  { id: "calligraphy", name: "Calligraphy", background: "bg-gradient-to-b from-stone-100 to-amber-50", buttonStyle: "bg-stone-800", textColor: "text-stone-800" },
  { id: "renaissance", name: "Renaissance", background: "bg-gradient-to-br from-amber-700 via-yellow-700 to-green-800", buttonStyle: "bg-amber-200", textColor: "text-amber-100", isPro: true },
  // Luxe & Premium
  { id: "gold-rush", name: "Gold Rush", background: "bg-gradient-to-br from-yellow-600 via-amber-500 to-yellow-700", buttonStyle: "bg-black", textColor: "text-yellow-100", isPro: true },
  { id: "platinum", name: "Platinum", background: "bg-gradient-to-br from-slate-200 via-zinc-100 to-gray-200", buttonStyle: "bg-indigo-900", textColor: "text-indigo-900", isPro: true },
  { id: "diamond", name: "Diamond", background: "bg-gradient-to-br from-cyan-100 via-white to-blue-100", buttonStyle: "bg-cyan-800", textColor: "text-cyan-900", isPro: true },
  { id: "ruby", name: "Ruby", background: "bg-gradient-to-br from-red-700 via-rose-700 to-red-800", buttonStyle: "bg-red-200", textColor: "text-red-100", isPro: true },
  { id: "emerald", name: "Emerald", background: "bg-gradient-to-br from-emerald-700 via-green-700 to-emerald-800", buttonStyle: "bg-emerald-200", textColor: "text-emerald-100", isPro: true },
  { id: "sapphire", name: "Sapphire", background: "bg-gradient-to-br from-blue-700 via-indigo-700 to-blue-800", buttonStyle: "bg-blue-200", textColor: "text-blue-100", isPro: true },
  { id: "amethyst", name: "Amethyst", background: "bg-gradient-to-br from-purple-700 via-violet-700 to-purple-800", buttonStyle: "bg-purple-200", textColor: "text-purple-100", isPro: true },
  { id: "onyx", name: "Onyx", background: "bg-gradient-to-br from-zinc-900 via-neutral-900 to-stone-900", buttonStyle: "bg-amber-500", textColor: "text-amber-200", isPro: true },
  { id: "pearl", name: "Pearl", background: "bg-gradient-to-br from-gray-50 via-pink-50 to-purple-50", buttonStyle: "bg-purple-600", textColor: "text-purple-900", isPro: true },
  { id: "champagne", name: "Champagne", background: "bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-50", buttonStyle: "bg-amber-700", textColor: "text-amber-800", isPro: true },
  // Cultural & Regional
  { id: "kyoto", name: "Kyoto", background: "bg-gradient-to-br from-rose-300 via-pink-200 to-red-100", buttonStyle: "bg-red-800", textColor: "text-red-900", isPro: true },
  { id: "marrakech", name: "Marrakech", background: "bg-gradient-to-br from-orange-600 via-red-600 to-amber-700", buttonStyle: "bg-amber-200", textColor: "text-amber-100", isPro: true },
  { id: "santorini", name: "Santorini", background: "bg-gradient-to-br from-blue-400 via-sky-300 to-white", buttonStyle: "bg-blue-800", textColor: "text-blue-900", isPro: true },
  { id: "havana", name: "Havana", background: "bg-gradient-to-br from-yellow-400 via-teal-500 to-pink-500", buttonStyle: "bg-white", textColor: "text-white", isPro: true },
  { id: "nordic", name: "Nordic", background: "bg-gradient-to-br from-slate-200 via-blue-100 to-gray-200", buttonStyle: "bg-indigo-800", textColor: "text-indigo-900", isPro: true },
  { id: "sahel", name: "Sahel", background: "bg-gradient-to-br from-amber-500 via-orange-500 to-red-600", buttonStyle: "bg-white", textColor: "text-white", isPro: true },
  { id: "bali", name: "Bali", background: "bg-gradient-to-br from-emerald-500 via-teal-400 to-cyan-300", buttonStyle: "bg-amber-500", textColor: "text-emerald-950", isPro: true },
  { id: "tuscany", name: "Tuscany", background: "bg-gradient-to-br from-amber-300 via-yellow-200 to-green-200", buttonStyle: "bg-amber-800", textColor: "text-amber-900", isPro: true },
  { id: "rio", name: "Rio", background: "bg-gradient-to-br from-green-500 via-yellow-400 to-blue-500", buttonStyle: "bg-white", textColor: "text-white", isPro: true },
  { id: "cairo", name: "Cairo", background: "bg-gradient-to-br from-yellow-600 via-amber-600 to-stone-500", buttonStyle: "bg-yellow-200", textColor: "text-yellow-100", isPro: true },
  // Season & Weather
  { id: "spring-bloom", name: "Spring Bloom", background: "bg-gradient-to-br from-pink-200 via-green-200 to-yellow-100", buttonStyle: "bg-pink-600", textColor: "text-pink-900" },
  { id: "summer-heat", name: "Summer Heat", background: "bg-gradient-to-br from-yellow-300 via-orange-400 to-red-400", buttonStyle: "bg-white", textColor: "text-red-900", isPro: true },
  { id: "autumn-glow", name: "Autumn Glow", background: "bg-gradient-to-br from-amber-500 via-orange-600 to-red-700", buttonStyle: "bg-amber-100", textColor: "text-amber-100", isPro: true },
  { id: "winter-frost", name: "Winter Frost", background: "bg-gradient-to-br from-blue-200 via-slate-200 to-gray-300", buttonStyle: "bg-blue-800", textColor: "text-blue-900", isPro: true },
  { id: "monsoon", name: "Monsoon", background: "bg-gradient-to-br from-gray-600 via-blue-700 to-cyan-700", buttonStyle: "bg-cyan-300", textColor: "text-cyan-100", isPro: true },
  { id: "rainbow", name: "Rainbow", background: "bg-gradient-to-r from-red-400 via-yellow-300 via-green-400 to-blue-500", buttonStyle: "bg-white", textColor: "text-white", isPro: true },
  { id: "blizzard", name: "Blizzard", background: "bg-gradient-to-br from-white via-blue-50 to-slate-100", buttonStyle: "bg-blue-600", textColor: "text-blue-900" },
  { id: "heatwave", name: "Heatwave", background: "bg-gradient-to-br from-red-500 via-orange-500 to-yellow-400", buttonStyle: "bg-black", textColor: "text-yellow-100", isPro: true },
  { id: "mist", name: "Mist", background: "bg-gradient-to-b from-gray-300 via-gray-200 to-white", buttonStyle: "bg-gray-700", textColor: "text-gray-800" },
  { id: "thunderstorm", name: "Thunderstorm", background: "bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900", buttonStyle: "bg-yellow-300", textColor: "text-yellow-200", isPro: true },
  // Music & Entertainment
  { id: "vinyl", name: "Vinyl", background: "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900", buttonStyle: "bg-orange-500", textColor: "text-orange-300", isPro: true },
  { id: "jazz-club", name: "Jazz Club", background: "bg-gradient-to-br from-amber-900 via-orange-900 to-red-950", buttonStyle: "bg-amber-400", textColor: "text-amber-200", isPro: true },
  { id: "disco", name: "Disco", background: "bg-gradient-to-br from-fuchsia-500 via-purple-500 to-indigo-500", buttonStyle: "bg-yellow-300", textColor: "text-white", isPro: true },
  { id: "acoustic", name: "Acoustic", background: "bg-gradient-to-br from-amber-200 via-stone-200 to-orange-100", buttonStyle: "bg-stone-700", textColor: "text-stone-800" },
  { id: "electro", name: "Electro", background: "bg-gradient-to-br from-blue-900 via-cyan-800 to-teal-700", buttonStyle: "bg-cyan-400", textColor: "text-cyan-100", isPro: true },
  { id: "hip-hop", name: "Hip Hop", background: "bg-gradient-to-br from-yellow-600 via-red-700 to-black", buttonStyle: "bg-yellow-400", textColor: "text-yellow-200", isPro: true },
  { id: "punk", name: "Punk", background: "bg-black", buttonStyle: "bg-red-600", textColor: "text-red-500", isPro: true },
  { id: "reggae", name: "Reggae", background: "bg-gradient-to-br from-green-600 via-yellow-500 to-red-500", buttonStyle: "bg-black", textColor: "text-yellow-200", isPro: true },
  { id: "opera", name: "Opera", background: "bg-gradient-to-br from-red-900 via-rose-800 to-pink-900", buttonStyle: "bg-amber-300", textColor: "text-amber-100", isPro: true },
  { id: "lofi", name: "Lo-Fi", background: "bg-gradient-to-br from-purple-300 via-pink-200 to-orange-200", buttonStyle: "bg-purple-700", textColor: "text-purple-900", isPro: true },
  // Food & Drink
  { id: "espresso", name: "Espresso", background: "bg-gradient-to-br from-amber-900 via-stone-800 to-stone-900", buttonStyle: "bg-amber-200", textColor: "text-amber-200", isPro: true },
  { id: "matcha", name: "Matcha", background: "bg-gradient-to-br from-green-200 via-lime-100 to-green-100", buttonStyle: "bg-green-800", textColor: "text-green-900" },
  { id: "berry", name: "Berry", background: "bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-500", buttonStyle: "bg-white", textColor: "text-white", isPro: true },
  { id: "citrus", name: "Citrus", background: "bg-gradient-to-br from-yellow-300 via-lime-300 to-green-300", buttonStyle: "bg-orange-600", textColor: "text-orange-900" },
  { id: "cocoa", name: "Cocoa", background: "bg-gradient-to-br from-amber-800 via-yellow-800 to-orange-900", buttonStyle: "bg-amber-300", textColor: "text-amber-100", isPro: true },
  { id: "caramel", name: "Caramel", background: "bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-500", buttonStyle: "bg-amber-900", textColor: "text-amber-950", isPro: true },
  { id: "blueberry", name: "Blueberry", background: "bg-gradient-to-br from-indigo-500 via-blue-500 to-violet-500", buttonStyle: "bg-white", textColor: "text-white", isPro: true },
  { id: "pistachio", name: "Pistachio", background: "bg-gradient-to-br from-green-300 via-lime-200 to-yellow-100", buttonStyle: "bg-green-700", textColor: "text-green-900" },
  { id: "rose-tea", name: "Rose Tea", background: "bg-gradient-to-br from-rose-200 via-pink-100 to-red-100", buttonStyle: "bg-rose-700", textColor: "text-rose-900", isPro: true },
  { id: "saffron", name: "Saffron", background: "bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500", buttonStyle: "bg-red-800", textColor: "text-red-100", isPro: true },
  // Space & Sci-Fi
  { id: "supernova", name: "Supernova", background: "bg-gradient-to-br from-orange-600 via-red-700 to-purple-900", buttonStyle: "bg-yellow-300", textColor: "text-yellow-100", isPro: true },
  { id: "black-hole", name: "Black Hole", background: "bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950", buttonStyle: "bg-violet-500", textColor: "text-violet-300", isPro: true },
  { id: "mars", name: "Mars", background: "bg-gradient-to-br from-red-800 via-orange-700 to-amber-600", buttonStyle: "bg-red-200", textColor: "text-red-100", isPro: true },
  { id: "jupiter", name: "Jupiter", background: "bg-gradient-to-br from-amber-600 via-orange-500 to-rose-500", buttonStyle: "bg-amber-100", textColor: "text-amber-100", isPro: true },
  { id: "saturn", name: "Saturn", background: "bg-gradient-to-br from-amber-300 via-yellow-200 to-teal-400", buttonStyle: "bg-teal-800", textColor: "text-teal-900", isPro: true },
  { id: "milky-way", name: "Milky Way", background: "bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-900", buttonStyle: "bg-white", textColor: "text-white", isPro: true },
  { id: "andromeda", name: "Andromeda", background: "bg-gradient-to-br from-violet-900 via-indigo-800 to-cyan-800", buttonStyle: "bg-pink-400", textColor: "text-pink-200", isPro: true },
  { id: "comet", name: "Comet", background: "bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-700", buttonStyle: "bg-cyan-300", textColor: "text-cyan-100", isPro: true },
  { id: "pulsar", name: "Pulsar", background: "bg-gradient-to-br from-blue-950 via-violet-900 to-fuchsia-800", buttonStyle: "bg-fuchsia-400", textColor: "text-fuchsia-200", isPro: true },
  { id: "solar-flare", name: "Solar Flare", background: "bg-gradient-to-br from-yellow-500 via-orange-600 to-red-700", buttonStyle: "bg-yellow-200", textColor: "text-yellow-100", isPro: true },
  // Minimal & Clean
  { id: "paper", name: "Paper", background: "bg-gradient-to-b from-amber-50 to-orange-50", buttonStyle: "bg-stone-600", textColor: "text-stone-700" },
  { id: "snow", name: "Snow", background: "bg-gradient-to-b from-white to-blue-50", buttonStyle: "bg-blue-700", textColor: "text-blue-900" },
  { id: "smoke", name: "Smoke", background: "bg-gradient-to-br from-gray-400 via-gray-300 to-gray-200", buttonStyle: "bg-gray-800", textColor: "text-gray-900" },
  { id: "zen", name: "Zen", background: "bg-gradient-to-b from-stone-200 via-stone-100 to-white", buttonStyle: "bg-stone-600", textColor: "text-stone-700" },
  { id: "porcelain", name: "Porcelain", background: "bg-gradient-to-br from-blue-50 via-white to-pink-50", buttonStyle: "bg-blue-800", textColor: "text-blue-900" },
  { id: "linen", name: "Linen", background: "bg-gradient-to-b from-amber-100 to-orange-50", buttonStyle: "bg-amber-800", textColor: "text-amber-900" },
  { id: "marble", name: "Marble", background: "bg-gradient-to-br from-gray-100 via-white to-gray-200", buttonStyle: "bg-gray-900", textColor: "text-gray-800" },
  { id: "monochrome", name: "Monochrome", background: "bg-gradient-to-br from-neutral-200 to-neutral-400", buttonStyle: "bg-neutral-900", textColor: "text-neutral-900" },
  { id: "whisper", name: "Whisper", background: "bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-50", buttonStyle: "bg-slate-500", textColor: "text-slate-700" },
  { id: "canvas", name: "Canvas", background: "bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50", buttonStyle: "bg-stone-700", textColor: "text-stone-800" },
  // Vibrant & Bold
  { id: "firecracker", name: "Firecracker", background: "bg-gradient-to-br from-red-500 via-orange-500 to-yellow-300", buttonStyle: "bg-black", textColor: "text-white", isPro: true },
  { id: "electric-blue", name: "Electric Blue", background: "bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-400", buttonStyle: "bg-white", textColor: "text-white", isPro: true },
  { id: "magenta-pop", name: "Magenta Pop", background: "bg-gradient-to-br from-fuchsia-600 via-pink-600 to-rose-600", buttonStyle: "bg-white", textColor: "text-white", isPro: true },
  { id: "lime-surge", name: "Lime Surge", background: "bg-gradient-to-br from-lime-400 via-green-400 to-emerald-500", buttonStyle: "bg-black", textColor: "text-white", isPro: true },
  { id: "ultraviolet", name: "Ultraviolet", background: "bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-800", buttonStyle: "bg-violet-300", textColor: "text-violet-100", isPro: true },
  { id: "tangerine", name: "Tangerine", background: "bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500", buttonStyle: "bg-white", textColor: "text-orange-950", isPro: true },
  { id: "hot-pink", name: "Hot Pink", background: "bg-gradient-to-br from-pink-500 via-rose-500 to-fuchsia-500", buttonStyle: "bg-white", textColor: "text-white", isPro: true },
  { id: "acid-green", name: "Acid Green", background: "bg-gradient-to-br from-lime-300 via-green-300 to-yellow-300", buttonStyle: "bg-green-900", textColor: "text-green-900", isPro: true },
  { id: "royal-blue", name: "Royal Blue", background: "bg-gradient-to-br from-blue-700 via-indigo-600 to-violet-600", buttonStyle: "bg-white", textColor: "text-white", isPro: true },
  { id: "crimson", name: "Crimson", background: "bg-gradient-to-br from-red-700 via-rose-700 to-red-900", buttonStyle: "bg-white", textColor: "text-white", isPro: true },
  // Pastel & Soft
  { id: "pastel-dream", name: "Pastel Dream", background: "bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100", buttonStyle: "bg-purple-500", textColor: "text-purple-900" },
  { id: "cotton-candy", name: "Cotton Candy", background: "bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200", buttonStyle: "bg-pink-600", textColor: "text-pink-900", isPro: true },
  { id: "bubblegum", name: "Bubblegum", background: "bg-gradient-to-br from-pink-300 via-rose-200 to-fuchsia-200", buttonStyle: "bg-fuchsia-600", textColor: "text-fuchsia-900", isPro: true },
  { id: "macaroon", name: "Macaroon", background: "bg-gradient-to-br from-yellow-100 via-pink-100 to-green-100", buttonStyle: "bg-pink-500", textColor: "text-pink-800" },
  { id: "soft-serve", name: "Soft Serve", background: "bg-gradient-to-br from-orange-100 via-yellow-50 to-pink-100", buttonStyle: "bg-orange-500", textColor: "text-orange-900" },
  { id: "seashell", name: "Seashell", background: "bg-gradient-to-br from-rose-100 via-amber-50 to-teal-100", buttonStyle: "bg-teal-600", textColor: "text-teal-900" },
  { id: "lilac", name: "Lilac", background: "bg-gradient-to-br from-purple-200 via-violet-100 to-fuchsia-100", buttonStyle: "bg-violet-600", textColor: "text-violet-900" },
  { id: "buttercream", name: "Buttercream", background: "bg-gradient-to-br from-yellow-100 via-amber-100 to-orange-100", buttonStyle: "bg-amber-600", textColor: "text-amber-900" },
  { id: "periwinkle", name: "Periwinkle", background: "bg-gradient-to-br from-indigo-200 via-blue-200 to-violet-200", buttonStyle: "bg-indigo-600", textColor: "text-indigo-900", isPro: true },
  { id: "melon", name: "Melon", background: "bg-gradient-to-br from-green-200 via-lime-100 to-orange-100", buttonStyle: "bg-green-600", textColor: "text-green-900" },
  // Dark & Moody
  { id: "phantom", name: "Phantom", background: "bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950", buttonStyle: "bg-gray-500", textColor: "text-gray-400", isPro: true },
  { id: "shadow", name: "Shadow", background: "bg-gradient-to-br from-gray-900 via-zinc-900 to-neutral-900", buttonStyle: "bg-zinc-500", textColor: "text-zinc-300", isPro: true },
  { id: "raven", name: "Raven", background: "bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950", buttonStyle: "bg-indigo-500", textColor: "text-indigo-300", isPro: true },
  { id: "abyss", name: "Abyss", background: "bg-gradient-to-br from-blue-950 via-indigo-950 to-violet-950", buttonStyle: "bg-blue-400", textColor: "text-blue-300", isPro: true },
  { id: "eclipse", name: "Eclipse", background: "bg-gradient-to-br from-orange-900 via-gray-900 to-blue-950", buttonStyle: "bg-orange-400", textColor: "text-orange-200", isPro: true },
  { id: "charcoal", name: "Charcoal", background: "bg-gradient-to-br from-neutral-800 via-stone-800 to-zinc-800", buttonStyle: "bg-orange-500", textColor: "text-orange-200", isPro: true },
  { id: "gothic", name: "Gothic", background: "bg-gradient-to-br from-gray-950 via-red-950 to-gray-950", buttonStyle: "bg-red-700", textColor: "text-red-400", isPro: true },
  { id: "void", name: "Void", background: "bg-gradient-to-br from-black via-purple-950 to-black", buttonStyle: "bg-purple-500", textColor: "text-purple-400", isPro: true },
  { id: "slate-night", name: "Slate Night", background: "bg-gradient-to-br from-slate-800 via-blue-900 to-slate-800", buttonStyle: "bg-slate-300", textColor: "text-slate-200", isPro: true },
  { id: "iron", name: "Iron", background: "bg-gradient-to-br from-zinc-700 via-gray-700 to-neutral-700", buttonStyle: "bg-zinc-300", textColor: "text-zinc-200", isPro: true },
  // Gradient Duo-tones
  { id: "sunrise", name: "Sunrise", background: "bg-gradient-to-tr from-yellow-200 via-orange-300 to-pink-400", buttonStyle: "bg-orange-700", textColor: "text-orange-900", isPro: true },
  { id: "twilight-zone", name: "Twilight Zone", background: "bg-gradient-to-br from-indigo-600 to-pink-500", buttonStyle: "bg-white", textColor: "text-white", isPro: true },
  { id: "peacock", name: "Peacock", background: "bg-gradient-to-br from-teal-600 to-blue-700", buttonStyle: "bg-teal-200", textColor: "text-teal-100", isPro: true },
  { id: "flamingo", name: "Flamingo", background: "bg-gradient-to-br from-pink-400 to-orange-400", buttonStyle: "bg-white", textColor: "text-white", isPro: true },
  { id: "steel", name: "Steel", background: "bg-gradient-to-br from-gray-400 to-blue-400", buttonStyle: "bg-white", textColor: "text-gray-900", isPro: true },
  { id: "jade", name: "Jade", background: "bg-gradient-to-br from-green-600 to-teal-700", buttonStyle: "bg-green-200", textColor: "text-green-100", isPro: true },
  { id: "coral", name: "Coral", background: "bg-gradient-to-br from-orange-400 to-rose-500", buttonStyle: "bg-white", textColor: "text-white", isPro: true },
  { id: "plum", name: "Plum", background: "bg-gradient-to-br from-purple-800 to-pink-700", buttonStyle: "bg-purple-200", textColor: "text-purple-100", isPro: true },
  { id: "teal-rose", name: "Teal Rose", background: "bg-gradient-to-br from-teal-400 to-rose-400", buttonStyle: "bg-white", textColor: "text-white", isPro: true },
  { id: "indigo-amber", name: "Indigo Amber", background: "bg-gradient-to-br from-indigo-700 to-amber-500", buttonStyle: "bg-white", textColor: "text-white", isPro: true },
  // Festive & Holiday
  { id: "holiday-red", name: "Holiday Red", background: "bg-gradient-to-br from-red-700 via-red-600 to-green-800", buttonStyle: "bg-amber-400", textColor: "text-amber-100", isPro: true },
  { id: "festive-gold", name: "Festive Gold", background: "bg-gradient-to-br from-yellow-500 via-amber-500 to-red-500", buttonStyle: "bg-white", textColor: "text-white", isPro: true },
  { id: "halloween", name: "Halloween", background: "bg-gradient-to-br from-orange-600 via-black to-purple-900", buttonStyle: "bg-orange-400", textColor: "text-orange-300", isPro: true },
  { id: "valentines", name: "Valentine's", background: "bg-gradient-to-br from-red-500 via-pink-500 to-rose-400", buttonStyle: "bg-white", textColor: "text-white", isPro: true },
  { id: "spring-fest", name: "Spring Festival", background: "bg-gradient-to-br from-red-600 via-amber-500 to-yellow-400", buttonStyle: "bg-red-800", textColor: "text-yellow-100", isPro: true },
  // Tech & Digital
  { id: "terminal", name: "Terminal", background: "bg-gray-950", buttonStyle: "bg-green-600", textColor: "text-green-500", isPro: true },
  { id: "circuit", name: "Circuit", background: "bg-gradient-to-br from-green-900 via-teal-900 to-cyan-900", buttonStyle: "bg-green-400", textColor: "text-green-300", isPro: true },
  { id: "hologram", name: "Hologram", background: "bg-gradient-to-br from-cyan-400 via-fuchsia-400 to-yellow-300", buttonStyle: "bg-white", textColor: "text-white", isPro: true },
  { id: "pixel", name: "Pixel", background: "bg-gradient-to-br from-purple-600 via-blue-500 to-green-400", buttonStyle: "bg-black", textColor: "text-white", isPro: true },
  { id: "binary", name: "Binary", background: "bg-gradient-to-br from-green-950 via-black to-green-950", buttonStyle: "bg-green-500", textColor: "text-green-400", isPro: true },
];

const categories = [
  { id: "theme", name: "Theme", icon: Palette },
  { id: "wallpaper", name: "Wallpaper", icon: Image },
  { id: "text", name: "Text", icon: Type },
  { id: "buttons", name: "Buttons", icon: Square },
  { id: "features", name: "Features", icon: Sparkles },
];

const LAYOUT_MODES = [
  { id: "list", label: "Classic List", description: "Vertical stacked links" },
  { id: "bento", label: "Bento Grid", description: "Magazine-style card grid" },
];

const LINK_ANIMATIONS = [
  { id: "none", label: "None", description: "No animation" },
  { id: "pulse", label: "Pulse", description: "Gentle scale throb" },
  { id: "shake", label: "Shake", description: "Attention-grabbing wiggle" },
  { id: "bounce", label: "Bounce", description: "Playful vertical bounce" },
  { id: "glow", label: "Glow", description: "Pulsing glow effect" },
  { id: "slide-in", label: "Slide In", description: "Entrance from left" },
];

const DIVIDER_STYLES = [
  { id: "gradient", label: "Gradient" },
  { id: "bold", label: "Bold" },
  { id: "dotted", label: "Dotted" },
];

const FONT_OPTIONS = [
  "Inter", "Roboto", "Open Sans", "Playfair Display", "Montserrat", "Lato",
  "Poppins", "Raleway", "Merriweather", "Oswald", "Nunito", "Source Sans Pro",
];

const WALLPAPER_OPTIONS = [
  { id: "none", label: "None", preview: "bg-card" },
  { id: "gradient", label: "Gradient", preview: "bg-gradient-to-br from-purple-500 to-pink-500" },
  { id: "pattern", label: "Pattern", preview: "bg-card bg-[radial-gradient(circle,_rgba(0,0,0,0.05)_1px,_transparent_1px)] bg-[size:16px_16px]" },
  { id: "animated", label: "Animated", preview: "bg-gradient-to-br from-violet-600 to-cyan-500" },
  { id: "image", label: "Image", preview: "bg-card" },
];

const ANIMATION_OPTIONS = [
  { id: "aurora", label: "Aurora", description: "Flowing northern lights effect" },
  { id: "gradient-shift", label: "Gradient Shift", description: "Smooth color transitions" },
  { id: "particles", label: "Particles", description: "Floating particle effect" },
  { id: "waves", label: "Waves", description: "Gentle wave motion" },
  { id: "spotlight", label: "Spotlight", description: "Moving light beam" },
  { id: "mesh", label: "Mesh Gradient", description: "Organic color blending" },
];

const GRADIENT_OPTIONS = [
  { id: "purple-pink", label: "Purple Sunset", value: "from-purple-500 to-pink-500" },
  { id: "blue-cyan", label: "Ocean Blue", value: "from-blue-500 to-cyan-400" },
  { id: "green-teal", label: "Forest Green", value: "from-green-500 to-teal-400" },
  { id: "orange-red", label: "Warm Fire", value: "from-orange-400 to-red-500" },
  { id: "pink-rose", label: "Rose Pink", value: "from-pink-400 to-rose-300" },
  { id: "slate-gray", label: "Dark Slate", value: "from-slate-700 to-gray-900" },
  { id: "amber-yellow", label: "Golden Hour", value: "from-amber-400 to-yellow-300" },
  { id: "indigo-violet", label: "Deep Indigo", value: "from-indigo-500 to-violet-500" },
];

const BUTTON_STYLES = [
  { id: "rounded", label: "Rounded", className: "rounded-lg" },
  { id: "sharp", label: "Sharp", className: "rounded-none" },
  { id: "pill", label: "Pill", className: "rounded-full" },
  { id: "outline", label: "Outline", className: "rounded-lg bg-transparent border-2 border-foreground" },
];

const DashboardAppearance = () => {
  const { toast } = useToast();
  const { profile } = useUserProfile();
  const { settings, updateSettings } = useAppearanceSettings();
  const { links } = useLinks();
  const [selectedTheme, setSelectedTheme] = useState("air");
  const [activeCategory, setActiveCategory] = useState("theme");
  const [isSaving, setIsSaving] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Appearance state
  const [wallpaperType, setWallpaperType] = useState("none");
  const [backgroundGradient, setBackgroundGradient] = useState("from-purple-500 to-pink-500");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [backgroundAnimation, setBackgroundAnimation] = useState("aurora");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [titleColor, setTitleColor] = useState("#1a1a2e");
  const [bioColor, setBioColor] = useState("#6b7280");
  const [buttonStyle, setButtonStyle] = useState("rounded");
  const [buttonColor, setButtonColor] = useState("#1a1a2e");

  // New feature state
  const [layoutMode, setLayoutMode] = useState("list");
  const [linkAnimation, setLinkAnimation] = useState("none");
  const [verifiedBadge, setVerifiedBadge] = useState(false);
  const [showMemberSince, setShowMemberSince] = useState(false);
  const [showFollowerCount, setShowFollowerCount] = useState(false);
  const [sectionDividersEnabled, setSectionDividersEnabled] = useState(false);
  const [sectionDividerStyle, setSectionDividerStyle] = useState("gradient");

  // Load settings from DB
  useEffect(() => {
    if (settings) {
      if (settings.theme) setSelectedTheme(settings.theme);
      if (settings.background_type) setWallpaperType(settings.background_type);
      if (settings.background_gradient) setBackgroundGradient(settings.background_gradient);
      if (settings.background_color) setBackgroundColor(settings.background_color);
      if (settings.font_family) setFontFamily(settings.font_family);
      if (settings.title_color) setTitleColor(settings.title_color);
      if (settings.bio_color) setBioColor(settings.bio_color);
      if (settings.button_style) setButtonStyle(settings.button_style);
      if (settings.button_color) setButtonColor(settings.button_color);
      if ((settings as any).background_animation) setBackgroundAnimation((settings as any).background_animation);
      // New feature settings
      if (settings.layout_mode) setLayoutMode(settings.layout_mode);
      if (settings.link_animation) setLinkAnimation(settings.link_animation);
      if (settings.verified_badge !== null && settings.verified_badge !== undefined) setVerifiedBadge(!!settings.verified_badge);
      if (settings.show_member_since !== null && settings.show_member_since !== undefined) setShowMemberSince(!!settings.show_member_since);
      if (settings.show_follower_count !== null && settings.show_follower_count !== undefined) setShowFollowerCount(!!settings.show_follower_count);
      if (settings.section_dividers_enabled !== null && settings.section_dividers_enabled !== undefined) setSectionDividersEnabled(!!settings.section_dividers_enabled);
      if (settings.section_divider_style) setSectionDividerStyle(settings.section_divider_style);
    }
  }, [settings]);

  const saveSettings = async (updates: Record<string, string>) => {
    setIsSaving(true);
    try {
      await updateSettings(updates as any);
      toast({ title: "Saved!", description: "Appearance updated." });
    } catch (error) {
      console.error("Error saving:", error);
      toast({ title: "Error", description: "Failed to save. Try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectTheme = async (themeId: string, isPro?: boolean) => {
    if (isPro) {
      toast({ title: "Pro Feature", description: "Upgrade to Pro to unlock this theme!" });
      return;
    }
    setSelectedTheme(themeId);
    await saveSettings({ theme: themeId });
  };

  const handleWallpaperType = async (type: string) => {
    setWallpaperType(type);
    await saveSettings({ background_type: type });
  };

  const handleGradient = async (gradient: string) => {
    setBackgroundGradient(gradient);
    await saveSettings({ background_gradient: gradient });
  };

  const handleBackgroundColor = async (color: string) => {
    setBackgroundColor(color);
    await saveSettings({ background_color: color });
  };

  const handleFontFamily = async (font: string) => {
    setFontFamily(font);
    await saveSettings({ font_family: font });
  };

  const handleTitleColor = async (color: string) => {
    setTitleColor(color);
    await saveSettings({ title_color: color });
  };

  const handleBioColor = async (color: string) => {
    setBioColor(color);
    await saveSettings({ bio_color: color });
  };

  const handleButtonStyle = async (style: string) => {
    setButtonStyle(style);
    await saveSettings({ button_style: style });
  };

  const handleButtonColor = async (color: string) => {
    setButtonColor(color);
    await saveSettings({ button_color: color });
  };

  const handleAnimation = async (animation: string) => {
    setBackgroundAnimation(animation);
    await saveSettings({ background_animation: animation });
  };

  // ── New feature handlers ──
  const handleLayoutMode = async (mode: string) => {
    setLayoutMode(mode);
    await saveSettings({ layout_mode: mode });
  };

  const handleLinkAnimation = async (anim: string) => {
    setLinkAnimation(anim);
    await saveSettings({ link_animation: anim });
  };

  const handleVerifiedBadge = async (checked: boolean) => {
    setVerifiedBadge(checked);
    await updateSettings({ verified_badge: checked } as any);
    toast({ title: "Saved!", description: "Appearance updated." });
  };

  const handleShowMemberSince = async (checked: boolean) => {
    setShowMemberSince(checked);
    await updateSettings({ show_member_since: checked } as any);
    toast({ title: "Saved!", description: "Appearance updated." });
  };

  const handleShowFollowerCount = async (checked: boolean) => {
    setShowFollowerCount(checked);
    await updateSettings({ show_follower_count: checked } as any);
    toast({ title: "Saved!", description: "Appearance updated." });
  };

  const handleSectionDividers = async (checked: boolean) => {
    setSectionDividersEnabled(checked);
    await updateSettings({ section_dividers_enabled: checked } as any);
    toast({ title: "Saved!", description: "Appearance updated." });
  };

  const handleSectionDividerStyle = async (style: string) => {
    setSectionDividerStyle(style);
    await saveSettings({ section_divider_style: style });
  };

  // Enhance button -- auto-pick appealing settings based on profile
  const handleEnhance = async () => {
    setIsEnhancing(true);
    try {
      const bio = profile?.bio?.toLowerCase() || "";
      const name = profile?.full_name?.toLowerCase() || "";
      const combined = `${bio} ${name}`;

      // Detect category and auto-apply a matching theme + settings
      let enhancedSettings: Record<string, string> = {};

      if (/pastor|church|ministry|faith|worship|sermon|gospel|prayer/i.test(combined)) {
        enhancedSettings = {
          theme: "twilight",
          background_type: "gradient",
          background_gradient: "from-indigo-500 to-violet-500",
          font_family: "Playfair Display",
          title_color: "#4c1d95",
          bio_color: "#6d28d9",
          button_style: "rounded",
          button_color: "#7c3aed",
        };
      } else if (/music|artist|dj|singer|rapper|producer/i.test(combined)) {
        enhancedSettings = {
          theme: "lake",
          background_type: "gradient",
          background_gradient: "from-slate-700 to-gray-900",
          font_family: "Montserrat",
          title_color: "#ffffff",
          bio_color: "#94a3b8",
          button_style: "pill",
          button_color: "#e11d48",
        };
      } else if (/fitness|coach|trainer|health|wellness|gym/i.test(combined)) {
        enhancedSettings = {
          theme: "grid",
          background_type: "gradient",
          background_gradient: "from-green-500 to-teal-400",
          font_family: "Poppins",
          title_color: "#064e3b",
          bio_color: "#047857",
          button_style: "pill",
          button_color: "#059669",
        };
      } else if (/photo|video|creative|film|camera/i.test(combined)) {
        enhancedSettings = {
          theme: "bloom",
          background_type: "gradient",
          background_gradient: "from-slate-700 to-gray-900",
          font_family: "Inter",
          title_color: "#f8fafc",
          bio_color: "#94a3b8",
          button_style: "rounded",
          button_color: "#f472b6",
        };
      } else if (/shop|store|product|fashion|boutique/i.test(combined)) {
        enhancedSettings = {
          theme: "mineral",
          background_type: "gradient",
          background_gradient: "from-amber-400 to-yellow-300",
          font_family: "Raleway",
          title_color: "#78350f",
          bio_color: "#92400e",
          button_style: "rounded",
          button_color: "#d97706",
        };
      } else if (/tech|developer|engineer|code|startup|saas/i.test(combined)) {
        enhancedSettings = {
          theme: "lake",
          background_type: "none",
          font_family: "Inter",
          title_color: "#f8fafc",
          bio_color: "#94a3b8",
          button_style: "sharp",
          button_color: "#3b82f6",
        };
      } else {
        // Default professional enhance
        enhancedSettings = {
          theme: "agate",
          background_type: "gradient",
          background_gradient: "from-purple-500 to-pink-500",
          font_family: "Poppins",
          title_color: "#ffffff",
          bio_color: "#e2e8f0",
          button_style: "pill",
          button_color: "#8b5cf6",
        };
      }

      // Apply all at once
      await updateSettings(enhancedSettings as any);

      // Update local state
      if (enhancedSettings.theme) setSelectedTheme(enhancedSettings.theme);
      if (enhancedSettings.background_type) setWallpaperType(enhancedSettings.background_type);
      if (enhancedSettings.background_gradient) setBackgroundGradient(enhancedSettings.background_gradient);
      if (enhancedSettings.font_family) setFontFamily(enhancedSettings.font_family);
      if (enhancedSettings.title_color) setTitleColor(enhancedSettings.title_color);
      if (enhancedSettings.bio_color) setBioColor(enhancedSettings.bio_color);
      if (enhancedSettings.button_style) setButtonStyle(enhancedSettings.button_style);
      if (enhancedSettings.button_color) setButtonColor(enhancedSettings.button_color);

      toast({ title: "Enhanced!", description: "Your profile has been auto-styled based on your niche." });
    } catch (error) {
      console.error("Enhance error:", error);
      toast({ title: "Error", description: "Failed to enhance. Try again.", variant: "destructive" });
    } finally {
      setIsEnhancing(false);
    }
  };

  const selectedThemeData = themes.find((t) => t.id === selectedTheme);
  const username = profile?.username || "username";
  const fullName = profile?.full_name || "Your Name";
  const bio = profile?.bio || "Creator & Entrepreneur";
  const previewLinks = links.map((link: { id: string; title: string; url: string; is_active?: boolean | null }) => ({
    id: link.id,
    title: link.title,
    url: link.url,
    isActive: link.is_active ?? true,
  }));

  return (
    <div className="min-h-screen bg-muted">
      <Sidebar />
      <MobileSidebar />

      <main className="lg:ml-64 px-3 sm:px-6 lg:px-8 pb-8 pt-20 lg:pt-8 overflow-x-hidden">
        <div className="max-w-6xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">Appearance</h1>
              <p className="text-muted-foreground">Customize your profile's look and feel.</p>
            </div>
            <Button
              className="gradient-button text-primary-foreground hover:opacity-90 gap-2"
              disabled={isEnhancing || isSaving}
              onClick={handleEnhance}
            >
              {isEnhancing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isEnhancing ? "Enhancing..." : "Enhance"}
            </Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Categories & Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Categories */}
              <div className="bg-card rounded-2xl p-3 sm:p-4 shadow-lg">
                <div className="flex gap-1.5 sm:gap-2 overflow-x-auto">
                  {categories.map((cat) => {
                    const IconComponent = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-medium transition-all whitespace-nowrap text-sm sm:text-base flex-shrink-0 ${
                          activeCategory === cat.id
                            ? "bg-foreground text-background"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* THEME TAB */}
              {activeCategory === "theme" && (
                <div className="bg-card rounded-2xl p-6 shadow-lg">
                  <h2 className="text-xl font-bold text-foreground mb-6">Theme</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                    {themes.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => handleSelectTheme(theme.id, theme.isPro)}
                        className={`relative group rounded-xl overflow-hidden aspect-[3/4] ${theme.background} border-2 transition-all ${
                          selectedTheme === theme.id
                            ? "border-primary ring-2 ring-primary ring-offset-2"
                            : "border-transparent hover:border-border"
                        }`}
                      >
                        <div className="absolute inset-0 p-3 flex flex-col items-center justify-center gap-2">
                          <span className={`text-lg font-bold ${theme.textColor}`}>Aa</span>
                          <div className={`w-3/4 h-6 rounded-lg ${theme.buttonStyle}`} />
                        </div>
                        {theme.isPro && (
                          <div className="absolute top-2 right-2">
                            <Sparkles className="w-4 h-4 text-yellow-400" />
                          </div>
                        )}
                        {selectedTheme === theme.id && (
                          <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-2 text-center">
                          <span className={`text-xs font-medium ${theme.textColor}`}>{theme.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* WALLPAPER TAB */}
              {activeCategory === "wallpaper" && (
                <div className="bg-card rounded-2xl p-6 shadow-lg space-y-6">
                  <h2 className="text-xl font-bold text-foreground">Wallpaper</h2>

                  {/* Wallpaper Type Selection */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {WALLPAPER_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleWallpaperType(option.id)}
                        className={`aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all border-2 ${option.preview} ${
                          wallpaperType === option.id
                            ? "border-primary ring-2 ring-primary ring-offset-2"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {wallpaperType === option.id && (
                          <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <span className="text-muted-foreground">{option.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Gradient Picker */}
                  {wallpaperType === "gradient" && (
                    <div>
                      <label className="text-sm font-medium text-foreground mb-3 block">Choose Gradient</label>
                      <div className="grid grid-cols-4 gap-3">
                        {GRADIENT_OPTIONS.map((grad) => (
                          <button
                            key={grad.id}
                            onClick={() => handleGradient(grad.value)}
                            className={`h-16 rounded-xl bg-gradient-to-br ${grad.value} border-2 transition-all ${
                              backgroundGradient === grad.value
                                ? "border-primary ring-2 ring-primary ring-offset-2"
                                : "border-transparent hover:border-border"
                            }`}
                            title={grad.label}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Animation Picker */}
                  {wallpaperType === "animated" && (
                    <div className="space-y-4">
                      <label className="text-sm font-medium text-foreground block">Choose Animation</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {ANIMATION_OPTIONS.map((anim) => (
                          <button
                            key={anim.id}
                            onClick={() => handleAnimation(anim.id)}
                            className={`relative p-4 rounded-xl border-2 transition-all overflow-hidden ${
                              backgroundAnimation === anim.id
                                ? "border-primary ring-2 ring-primary ring-offset-2"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            {/* Mini animation preview */}
                            <div className={`absolute inset-0 opacity-30 ${
                              anim.id === "aurora" ? "bg-gradient-to-br from-green-400 via-cyan-500 to-blue-600 animate-pulse" :
                              anim.id === "gradient-shift" ? "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400" :
                              anim.id === "particles" ? "bg-gradient-to-br from-gray-900 to-gray-800" :
                              anim.id === "waves" ? "bg-gradient-to-br from-blue-400 to-cyan-300" :
                              anim.id === "spotlight" ? "bg-gradient-to-br from-gray-950 to-gray-900" :
                              "bg-gradient-to-br from-violet-500 via-fuchsia-400 to-pink-500"
                            }`} />
                            <div className="relative text-center">
                              <p className="text-sm font-semibold text-foreground">{anim.label}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{anim.description}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                      {/* Gradient picker for animated background base */}
                      <div>
                        <label className="text-sm font-medium text-foreground mb-3 block">Base Colors</label>
                        <div className="grid grid-cols-4 gap-3">
                          {GRADIENT_OPTIONS.map((grad) => (
                            <button
                              key={grad.id}
                              onClick={() => handleGradient(grad.value)}
                              className={`h-12 rounded-xl bg-gradient-to-br ${grad.value} border-2 transition-all ${
                                backgroundGradient === grad.value
                                  ? "border-primary ring-2 ring-primary ring-offset-2"
                                  : "border-transparent hover:border-border"
                              }`}
                              title={grad.label}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Solid Color Picker */}
                  {wallpaperType === "none" && (
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Background Color</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          onBlur={(e) => handleBackgroundColor(e.target.value)}
                          className="w-14 h-14 rounded-xl border border-border cursor-pointer"
                        />
                        <span className="text-sm text-muted-foreground">{backgroundColor}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TEXT TAB */}
              {activeCategory === "text" && (
                <div className="bg-card rounded-2xl p-6 shadow-lg space-y-6">
                  <h2 className="text-xl font-bold text-foreground">Text</h2>

                  {/* Font Family */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Font Family</label>
                    <select
                      value={fontFamily}
                      onChange={(e) => handleFontFamily(e.target.value)}
                      className="w-full p-3 rounded-xl border border-border bg-background text-foreground"
                    >
                      {FONT_OPTIONS.map((font) => (
                        <option key={font} value={font}>{font}</option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily }}>
                      Preview: The quick brown fox jumps over the lazy dog.
                    </p>
                  </div>

                  {/* Title Color */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Title Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={titleColor}
                        onChange={(e) => setTitleColor(e.target.value)}
                        onBlur={(e) => handleTitleColor(e.target.value)}
                        className="w-full h-12 rounded-xl border border-border cursor-pointer"
                      />
                    </div>
                    <div className="mt-2 p-3 rounded-lg bg-muted">
                      <span style={{ color: titleColor, fontFamily }} className="font-bold text-lg">
                        {profile?.full_name || "Your Name"}
                      </span>
                    </div>
                  </div>

                  {/* Bio Color */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Bio / Description Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={bioColor}
                        onChange={(e) => setBioColor(e.target.value)}
                        onBlur={(e) => handleBioColor(e.target.value)}
                        className="w-full h-12 rounded-xl border border-border cursor-pointer"
                      />
                    </div>
                    <div className="mt-2 p-3 rounded-lg bg-muted">
                      <span style={{ color: bioColor, fontFamily }} className="text-sm">
                        {profile?.bio || "Your bio text will appear like this."}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* BUTTONS TAB */}
              {activeCategory === "buttons" && (
                <div className="bg-card rounded-2xl p-6 shadow-lg space-y-6">
                  <h2 className="text-xl font-bold text-foreground">Buttons</h2>

                  {/* Button Shape */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-3 block">Button Shape</label>
                    <div className="grid grid-cols-2 gap-4">
                      {BUTTON_STYLES.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => handleButtonStyle(style.id)}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            buttonStyle === style.id
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div
                            className={`w-full h-10 ${style.className} ${
                              style.id === "outline" ? "" : "bg-foreground"
                            }`}
                          />
                          <p className="text-sm font-medium text-center mt-2 text-foreground">{style.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Button Color */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Button Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={buttonColor}
                        onChange={(e) => setButtonColor(e.target.value)}
                        onBlur={(e) => handleButtonColor(e.target.value)}
                        className="w-14 h-14 rounded-xl border border-border cursor-pointer"
                      />
                      <span className="text-sm text-muted-foreground">{buttonColor}</span>
                    </div>
                    <div className="mt-3">
                      <div
                        className={`w-full py-3 px-4 text-center text-white font-medium ${
                          buttonStyle === "pill" ? "rounded-full" :
                          buttonStyle === "sharp" ? "rounded-none" :
                          buttonStyle === "outline" ? "rounded-lg bg-transparent border-2" :
                          "rounded-lg"
                        }`}
                        style={{
                          backgroundColor: buttonStyle === "outline" ? "transparent" : buttonColor,
                          borderColor: buttonColor,
                          color: buttonStyle === "outline" ? buttonColor : "#ffffff",
                        }}
                      >
                        Button Preview
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* FEATURES TAB */}
              {activeCategory === "features" && (
                <div className="bg-card rounded-2xl p-6 shadow-lg space-y-8">
                  <h2 className="text-xl font-bold text-foreground">Features</h2>

                  {/* Layout Mode */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-3 block">Layout Mode</label>
                    <div className="grid grid-cols-2 gap-4">
                      {LAYOUT_MODES.map((mode) => (
                        <button
                          key={mode.id}
                          onClick={() => handleLayoutMode(mode.id)}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            layoutMode === mode.id
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {mode.id === "list" ? (
                              <div className="flex flex-col gap-1">
                                <div className="w-16 h-2 rounded-full bg-foreground/30" />
                                <div className="w-16 h-2 rounded-full bg-foreground/30" />
                                <div className="w-16 h-2 rounded-full bg-foreground/30" />
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-1">
                                <div className="w-7 h-7 rounded bg-foreground/30" />
                                <div className="w-7 h-7 rounded bg-foreground/30" />
                                <div className="w-14 h-4 rounded bg-foreground/30 col-span-2" />
                              </div>
                            )}
                          </div>
                          <p className="text-sm font-medium text-foreground">{mode.label}</p>
                          <p className="text-xs text-muted-foreground">{mode.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Link Animations */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-3 block">Link Animations</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {LINK_ANIMATIONS.map((anim) => (
                        <button
                          key={anim.id}
                          onClick={() => handleLinkAnimation(anim.id)}
                          className={`p-3 rounded-xl border-2 transition-all text-left ${
                            linkAnimation === anim.id
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <p className="text-sm font-medium text-foreground">{anim.label}</p>
                          <p className="text-[11px] text-muted-foreground">{anim.description}</p>
                        </button>
                      ))}
                    </div>
                    {/* Live preview of selected animation */}
                    {linkAnimation !== "none" && (
                      <div className="mt-4">
                        <div
                          className={`w-full py-3 px-4 text-center text-white font-medium rounded-xl bg-foreground/80 ${
                            linkAnimation === "pulse" ? "stl-link-pulse" :
                            linkAnimation === "shake" ? "stl-link-shake" :
                            linkAnimation === "bounce" ? "stl-link-bounce" :
                            linkAnimation === "glow" ? "stl-link-glow" :
                            linkAnimation === "slide-in" ? "stl-link-slide-in" : ""
                          }`}
                        >
                          Animation Preview
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Verified Badge & Social Proof */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-3 block">Verified Badge & Social Proof</label>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/50 transition-all cursor-pointer">
                        <input
                          type="checkbox"
                          checked={verifiedBadge}
                          onChange={(e) => handleVerifiedBadge(e.target.checked)}
                          className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                        />
                        <div>
                          <p className="text-sm font-medium text-foreground">Verified Badge</p>
                          <p className="text-xs text-muted-foreground">Show a gold verified checkmark on your profile</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/50 transition-all cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showMemberSince}
                          onChange={(e) => handleShowMemberSince(e.target.checked)}
                          className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                        />
                        <div>
                          <p className="text-sm font-medium text-foreground">Member Since</p>
                          <p className="text-xs text-muted-foreground">Display when you joined Share The Link</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/50 transition-all cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showFollowerCount}
                          onChange={(e) => handleShowFollowerCount(e.target.checked)}
                          className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                        />
                        <div>
                          <p className="text-sm font-medium text-foreground">Follower Count</p>
                          <p className="text-xs text-muted-foreground">Show your subscriber/follower count publicly</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Section Dividers */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-3 block">Section Dividers</label>
                    <label className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/50 transition-all cursor-pointer mb-3">
                      <input
                        type="checkbox"
                        checked={sectionDividersEnabled}
                        onChange={(e) => handleSectionDividers(e.target.checked)}
                        className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">Enable Section Dividers</p>
                        <p className="text-xs text-muted-foreground">Color-coded dividers between link groups with icons</p>
                      </div>
                    </label>
                    {sectionDividersEnabled && (
                      <div className="grid grid-cols-3 gap-3">
                        {DIVIDER_STYLES.map((ds) => (
                          <button
                            key={ds.id}
                            onClick={() => handleSectionDividerStyle(ds.id)}
                            className={`p-3 rounded-xl border-2 transition-all ${
                              sectionDividerStyle === ds.id
                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <div className="mb-2">
                              <hr
                                className={
                                  ds.id === "bold"
                                    ? "h-[3px] border-none rounded bg-foreground/30"
                                    : ds.id === "dotted"
                                      ? "border-t-2 border-dotted border-foreground/30"
                                      : "h-[2px] border-none rounded bg-gradient-to-r from-transparent via-foreground/30 to-transparent"
                                }
                              />
                            </div>
                            <p className="text-xs font-medium text-center text-foreground">{ds.label}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Live Preview */}
            <div className="hidden lg:block">
              <ThemedProfilePreview
                username={username}
                fullName={fullName}
                bio={bio}
                avatarUrl={profile?.avatar_url || undefined}
                theme={selectedThemeData}
                links={previewLinks}
                socialLinks={profile?.social_links as any}
                customAppearance={{
                  wallpaperType,
                  backgroundGradient,
                  backgroundColor,
                  backgroundAnimation,
                  fontFamily,
                  titleColor,
                  bioColor,
                  buttonStyle,
                  buttonColor,
                }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardAppearance;
