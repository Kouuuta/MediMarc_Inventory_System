function AuthLayout({ children }) {
  return (
    <div className="from-indigo-100 relative flex min-h-dvh items-center justify-center overflow-hidden bg-gradient-to-br via-white to-violet-100 p-4">
      <div className="pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 size-72 rounded-full bg-violet-200/40 blur-3xl" />
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}

export default AuthLayout;