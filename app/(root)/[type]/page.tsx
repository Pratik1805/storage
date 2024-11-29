import React from "react";
import Sort from "@/components/Sort";
import { getFiles } from "@/lib/actions/file.actions";
import { Models } from "node-appwrite";
import Card from "@/components/Card";
import { getCurrentUser } from "@/lib/actions/users.action";
import { getFileTypesParams } from "@/lib/utils";

const Page = async ({ searchParams, params }: SearchParamProps) => {
  const type = ((await params)?.type as string) || "";
  const searchText = ((await searchParams)?.query as string) || "";
  const sort = ((await searchParams)?.sort as string) || "";
  const types = getFileTypesParams(type) as FileType[];
  const files = await getFiles({ types, searchText, sort });
  const currentUser = await getCurrentUser();
  return (
    <div className={"page-container"}>
      <section className={"w-full"}>
        <h1 className={"h1 capitalize"}>{type}</h1>

        <div className={"total-size-section"}>
          <p className={"body-1"}>
            Total: <span className={"h5"}>0 MB</span>
          </p>

          <div className={"sort-container"}>
            <p className={"body-1 hidden text-light-200 sm:block"}>Sort by:</p>

            <Sort />
          </div>
        </div>
      </section>

      {/*  Render Files */}

      {files.total > 0 ? (
        <section className={"file-list"}>
          {files.documents.map((file: Models.Document) => (
            <Card key={file.$id} file={file} currentUser={currentUser} />
          ))}
        </section>
      ) : (
        <p className={"empty-list"}>No files Uploaded</p>
      )}
    </div>
  );
};
export default Page;
