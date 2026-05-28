const path = require("path");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    path.join(__dirname, "./app/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(__dirname, "./components/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(__dirname, "./pages/**/*.{js,ts,jsx,tsx,mdx}"),
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
      },
    },
  },
  safelist: [
    // Layout
    "fixed", "static", "relative", "absolute",
    "w-60", "h-screen", "ml-60", "min-h-screen",
    "z-20", "z-50",
    // Flex / Grid
    "flex", "flex-1", "flex-col", "flex-shrink-0", "flex-wrap",
    "items-center", "items-end", "items-start",
    "justify-between", "justify-center", "justify-end",
    "gap-2", "gap-2.5", "gap-3", "gap-4", "gap-6",
    "grid", "grid-cols-2", "xl:grid-cols-2", "xl:grid-cols-4",
    "lg:grid-cols-4", "lg:grid-cols-2",
    "space-y-0.5", "space-y-3", "space-y-4",
    // Spacing
    "p-3", "p-4", "p-5", "p-6", "p-8",
    "px-3", "px-4", "px-5", "px-6",
    "py-2", "py-2.5", "py-3", "py-3.5", "py-4", "py-5", "py-10", "py-12",
    "mt-1", "mt-2", "mt-3", "mt-5", "mt-6", "mt-8",
    "mb-1", "mb-2", "mb-6", "mb-8",
    "ml-4",
    "w-4", "w-7", "w-8", "w-full", "h-2", "h-full",
    "h-4", "h-7", "h-8",
    "max-w-xs", "max-w-sm", "max-w-md", "max-w-2xl",
    "max-h-\\[80vh\\]", "overflow-y-auto", "overflow-hidden",
    "rounded-lg", "rounded-xl", "rounded-2xl", "rounded-full",
    "border", "border-b", "border-t", "border-r",
    "divide-y",
    // Typography
    "text-xs", "text-sm", "text-2xl", "text-3xl",
    "font-medium", "font-semibold", "font-bold",
    "leading-none", "leading-tight",
    "capitalize", "uppercase", "truncate",
    "tracking-wide",
    // Colors
    "text-white", "text-gray-200", "text-gray-300", "text-gray-400", "text-gray-500", "text-gray-600",
    "text-indigo-300", "text-indigo-400", "text-green-400", "text-yellow-400", "text-red-400", "text-blue-400", "text-orange-400",
    "text-green-300",
    "bg-gray-950", "bg-gray-900", "bg-gray-800", "bg-gray-700",
    "border-gray-700", "border-gray-800",
    "border-indigo-600/30", "border-indigo-600/40",
    "border-green-500/30", "border-yellow-500/30", "border-red-500/30", "border-blue-500/30", "border-gray-500/30", "border-orange-500/30",
    "bg-indigo-600", "bg-indigo-600/20", "bg-indigo-600/15", "bg-indigo-600/30",
    "bg-green-500/15", "bg-yellow-500/15", "bg-red-500/15", "bg-blue-500/15", "bg-gray-500/15", "bg-orange-500/15",
    "bg-green-600", "bg-red-700", "bg-red-900/20",
    "bg-red-900/80", "bg-green-900/80",
    "border-green-700", "border-red-700", "border-red-800",
    "text-red-200", "text-red-300", "text-red-400", "text-green-200",
    "antialiased",
    // Transitions
    "transition-colors", "transition-all", "duration-700",
    "hover:bg-gray-800", "hover:bg-gray-700", "hover:text-gray-200", "hover:bg-indigo-600/30", "hover:bg-indigo-500", "hover:bg-green-500", "hover:bg-red-600",
    "hover:bg-indigo-600/25", "hover:bg-red-900/20", "hover:text-indigo-300", "hover:text-gray-300",
    // Disabled
    "disabled:opacity-50",
    // Interactive
    "cursor-pointer",
    // Misc
    "inset-0", "top-4", "right-4",
    "resize-none",
    "font-mono",
  ],
  plugins: [],
};
