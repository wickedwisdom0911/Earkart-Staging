"use client";
import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { VideoCall } from "./video-call";
import { useOtoscopy } from "@/providers/otoscopy-provider";
import { useDevice } from "@/providers/device-provider";
import { ShareScreenButton } from "./share-screen-button";
import { User, HelpCircle, Link } from "lucide-react";
import { ROUTES } from "@/lib/routes";

// ── Delayed video call (for otoscopy) ────────────────────────────────────────
interface DelayedVideoCallProps {
  channel: string;
  patientName: string;
  isFullscreen: boolean;
  hideLocalUser: boolean;
  onBeforeLeaveCall?: () => Promise<void>;
  delay: number;
  showOtoscopyOnly?: boolean;
}

const DelayedVideoCall: React.FC<DelayedVideoCallProps> = ({
  delay,
  hideLocalUser,
  showOtoscopyOnly = false,
  ...props
}) => {
  const [shouldRender, setShouldRender] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setShouldRender(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  if (!shouldRender) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#232931]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white text-sm">Connecting to otoscope stream…</p>
          <p className="text-gray-400 text-xs mt-1">Please wait while the audiometer camera initialises</p>
        </div>
      </div>
    );
  }
  return <VideoCall {...props} hideLocalUser={hideLocalUser} showOtoscopyOnly={showOtoscopyOnly} />;
};

// ── Tab definitions ───────────────────────────────────────────────────────────
const TABS = [
  {
    label: "Patients Info",
    Icon: User,
    href: (id: string) => `/consultation/${id}`,
    match: (p: string, id: string) => p === `/consultation/${id}`,
  },
  {
    label: "Questionnaire",
    Icon: HelpCircle,
    href: (id: string) => ROUTES.ANSWER_QUESTIONNAIRE(id),
    match: (p: string) => p?.includes("answer-questionnaire") ?? false,
  },
  {
    label: "Tests",
    Icon: Link,
    href: (id: string) => ROUTES.CONSULTATION_TEST_SELECTION(id),
    match: (p: string) => p?.includes("test-selection") ?? false,
  },
] as const;

// ── ConsultationContent ───────────────────────────────────────────────────────
interface ConsultationContentProps {
  consultationId: string;
  patientName: string;
  children: React.ReactNode;
  onBeforeLeaveCall?: () => Promise<void>;
}

export const ConsultationContent: React.FC<ConsultationContentProps> = ({
  consultationId,
  patientName,
  children,
  onBeforeLeaveCall,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isOtoscopyActive } = useOtoscopy();
  const { deviceState } = useDevice();
  const isCameraOpen = deviceState.r15c.isCameraOpen;

  React.useEffect(() => {
    if (isOtoscopyActive) console.log("🔬 [OTOSCOPY] State:", { isOtoscopyActive, isCameraOpen });
  }, [isOtoscopyActive, isCameraOpen]);

  return (
    <div className="flex h-full w-full overflow-hidden relative">

      {/* ── Left: dark video panel ── */}
      <div className="flex-none w-[46%] min-w-[340px] max-w-[799px] min-h-0 bg-[#232931] relative overflow-hidden rounded-[20px]">
        <VideoCall
          channel={consultationId}
          patientName={patientName}
          isFullscreen={true}
          onBeforeLeaveCall={onBeforeLeaveCall}
          hideLocalUser={false}
          showOtoscopyOnly={false}
          excludeOtoscopyStream={isOtoscopyActive}
        />
      </div>

      {/* ── Right: tabbed patient panel ── */}
      {/*
        White background, tabs at top, scrollable content below.
        Tab active state: light mint bg (#e8f8e9 / bg-[#edf7ee]) with slightly
        darker border-bottom, matching the screenshot's teal-tinted active tab.
        Inactive tabs: plain text, hover gray.
        Tab row has a bottom border-b separating it from content.
      */}
      <main className="flex-1 flex flex-col overflow-hidden bg-white border-l border-gray-100 relative">

        {/* Share Screen button – absolute inside right panel */}
        <div className="absolute top-2 right-2 z-20">
          <ShareScreenButton />
        </div>

        {/* Tab strip — centered like Figma: active = light green bg, dark green text/icon, green underline */}
        <div className="flex flex-shrink-0 border-b border-gray-200 bg-white justify-center">
          {TABS.map(({ label, Icon, href, match }) => {
            const isActive = match(pathname ?? "", consultationId);
            return (
              <button
                key={label}
                onClick={() => router.push(href(consultationId))}
                className={[
                  "flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors focus:outline-none whitespace-nowrap",
                  isActive
                    ? "border-[#2e7d32] text-[#2e7d32] bg-[#e8f8e9]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50",
                ].join(" ")}
              >
                <Icon
                  className={[
                    "w-4 h-4 flex-shrink-0",
                    isActive ? "text-[#2e7d32]" : "text-gray-400",
                  ].join(" ")}
                />
                {label}
              </button>
            );
          })}
        </div>

        {/* Content area — px/py handled inside each child page */}
        <div className="flex-1 overflow-y-auto min-h-0 w-full">
          {children}
        </div>
      </main>
    </div>
  );
};