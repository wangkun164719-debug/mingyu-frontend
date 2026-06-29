export default function PageSection({ className = "", children, ...props }) {
  return (
    <section {...props} className={`mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </section>
  );
}
