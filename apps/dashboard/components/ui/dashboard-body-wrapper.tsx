export default function DashboardBodyWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="p-4  border w-full h-full rounded-lg">{children}</div>;
}
