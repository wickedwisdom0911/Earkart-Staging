import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";

export default function DashboardPage() {
  return (
    <DashboardBodyWrapper>
      <div className="w-full mb-8">
        <div className="rounded-2xl bg-gradient-to-r from-primary-100 to-blue-100 dark:from-primary-900 dark:to-blue-900 p-6 flex items-center gap-4 shadow-md border border-primary-200 dark:border-primary-800">
          <span className="text-3xl">💬🩺🏥</span>
          <div className="flex flex-col">
            <span className="text-lg md:text-xl font-semibold text-primary-800 dark:text-primary-100">
              You will see all the{" "}
              <span className="text-primary-600 dark:text-primary-300 font-bold">
                Active Consultation Rooms
              </span>{" "}
              and requests here
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Stay tuned for your next patient! 🚀
            </span>
          </div>
        </div>
      </div>
      <div>Active Consultation Rooms</div>
    </DashboardBodyWrapper>
  );
}
