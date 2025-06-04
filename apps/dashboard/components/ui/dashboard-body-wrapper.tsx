export default function DashboardBodyWrapper({
  children,
  className,
  pageTitle,
  button,
}: {
  children: React.ReactNode;
  className?: string;
  pageTitle?: string;
  button?: React.ReactNode;
}) {
  return (
    <div
      className={`p-4 flex flex-col gap-6 overflow-y-scroll border w-full h-full  rounded-lg ${className}`}
    >
      <div className="flex justify-between items-center w-full">
        {pageTitle && <h1 className="text-3xl font-semibold">{pageTitle}</h1>}
        {button && button}
      </div>
      {children}
    </div>
  );
}
