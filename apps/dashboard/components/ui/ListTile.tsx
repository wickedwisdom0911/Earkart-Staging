import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default function ListTile({
  title,
  leadingIcon,
  path,
}: {
  title: string;
  leadingIcon?: React.ReactNode;
  path: string;
}) {
  return (
    <Link
      href={path}
      className=" w-1/2 hover:bg-primary-100 duration-300  px-6 py-2 rounded-lg bg-primary-200 border border-primary-400"
    >
      <div className="flex justify-between cursor-pointer items-center">
        <div className="flex items-center gap-2">
          {leadingIcon && leadingIcon}
          <div>{title}</div>
        </div>
        <div>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}
