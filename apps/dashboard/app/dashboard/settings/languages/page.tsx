"use client";
import { Button } from "@/components/ui/button";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { Edit, PlusIcon, Trash } from "lucide-react";
import HandleLanguageDialog from "./_components/handle-language-dialog";
import useGetAllLanguages from "@/hooks/languages/use-get-all-languages";
import DeleteLanguageDialog from "./_components/delete-language-dialog";
import { useGetUser } from "@/hooks/auth/use-get-user";
import { Role } from "@/models/enums";

export default function LanguagesPage() {
  const { data, isLoading, isError } = useGetAllLanguages();
  const { data: user } = useGetUser();
  const isAdmin = user?.role === Role.ADMIN || user?.role === Role.SUPER_ADMIN;
  return (
    <DashboardBodyWrapper
      pageTitle="Languages"
      button={
        <HandleLanguageDialog
          trigger={
            <Button className="bg-primary-500 cursor-pointer text-white">
              <PlusIcon />
              Add Language
            </Button>
          }
        />
      }
    >
      {isLoading && <div>Loading...</div>}
      {isError && <div>Error</div>}
      <div className="grid grid-cols-3 gap-4">
        {data &&
          data.data?.map((language) => (
            <div
              key={language.id}
              className="p-4 bg-primary-100 rounded-md  gap-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-2">
                  <h3 className="text-lg font-bold">{language.name}</h3>
                  <p className="text-sm text-gray-500">{language.code}</p>
                  <p className="text-sm text-gray-500">{language.status}</p>
                </div>

                <div className="flex items-center gap-2">
                  <HandleLanguageDialog
                    trigger={
                      <Edit className="w-4 h-4 cursor-pointer stroke-1" />
                    }
                    language={language}
                  />
                  {!isAdmin && (
                    <DeleteLanguageDialog
                      trigger={
                        <Trash className="w-4 h-4 cursor-pointer stroke-1" />
                      }
                      language={language}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
    </DashboardBodyWrapper>
  );
}
