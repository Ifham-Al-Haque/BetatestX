// src/components/ui/avatar.jsx
export function Avatar({ children }) {
  return <div className="rounded-full overflow-hidden w-10 h-10">{children}</div>;
}

export function AvatarImage({ src, alt }) {
  return <img src={src} alt={alt} className="w-full h-full object-cover" />;
}

export function AvatarFallback({ children }) {
  return (
    <div className="w-full h-full bg-gray-300 text-center text-white flex items-center justify-center">
      {children}
    </div>
  );
}
