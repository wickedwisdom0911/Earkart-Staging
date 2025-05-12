export default function DashboardBodyWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`p-4  border w-full h-full rounded-lg ${className}`}>
      {children}
    </div>
  );
}
