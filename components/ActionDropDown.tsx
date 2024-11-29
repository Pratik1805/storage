"use client";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Models } from "node-appwrite";
import { actionsDropdownItems } from "@/constants";
import { constructDownloadUrl } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  deleteFile,
  renameFile,
  updateFileUsers,
} from "@/lib/actions/file.actions";
import { usePathname } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { FileDetails, ShareInput } from "@/components/ActionModalContent";

const ActionDropDown = ({
  file,
  currentUserEmail,
}: {
  file: Models.Document;
  currentUserEmail: string;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [action, setAction] = useState<ActionType | null>(null);
  const [name, setName] = useState(file.name);
  const [isLoading, setIsLoading] = useState(false);
  const [emails, setEmails] = useState<string[]>([]);

  const path = usePathname();
  const { toast } = useToast();

  const closeAllModals = () => {
    setIsModalOpen(false);
    setIsDropdownOpen(false);
    setAction(null);
    setName(file.name);
    // setEmails([]);
  };

  const handleAction = async () => {
    if (!action) return;
    setIsLoading(true);
    let success = false;

    const actions = {
      rename: () =>
        renameFile({ fileId: file.$id, name, extension: file.extension, path }),

      share: () => updateFileUsers({ fileId: file.$id, emails, path }),

      delete: () =>
        deleteFile({
          fileId: file.$id,
          bucketFileId: file.bucketFileId,
          path,
        }), // path is passed to revalidate cache for that path
      // so that updated information is displayed accordingly
    };

    success = await actions[action.value as keyof typeof actions](); // action.value as keyof typeof actions => key value  will we of type actions

    if (success) {
      closeAllModals();
      toast({
        description: (
          <p className={"body-2 text-white"}>
            {action.label} successfully done
          </p>
        ),
        className: "success-toast",
      });
    }
    setIsLoading(false);
  };

  const handleRemoveUser = async (email: string) => {
    const updatedEmails = emails.filter((e) => e !== email);
    const success = await updateFileUsers({
      fileId: file.$id,
      emails: updatedEmails,
      path,
    });

    if (success) setEmails(updatedEmails);
  };
  const renderDialogContent = () => {
    if (!action) return null;

    const { value, label } = action;

    return (
      <DialogContent className={"shad-dialog button"}>
        <DialogHeader className={"flex flex-col gap-3"}>
          <DialogTitle className={"text-center text-light-100"}>
            {label}
          </DialogTitle>
          {value === "rename" && (
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}

          {value === "details" && <FileDetails file={file} />}

          {value === "share" && (
            <ShareInput
              file={file}
              onInputChange={setEmails}
              onRemove={handleRemoveUser}
              currentUserEmail={currentUserEmail}
            />
          )}

          {value === "delete" && (
            <p className={"delete-confirmation"}>
              Are you sure you want to delete{" "}
              <span className={"delete-file-name"}>{file.name}</span>?
            </p>
          )}
        </DialogHeader>
        {["rename", "delete", "share"].includes(value) && (
          <DialogFooter className={"flex flex-col gap-3 md:flex-row"}>
            <Button onClick={closeAllModals} className={"modal-cancel-button"}>
              Cancel
            </Button>

            <Button onClick={handleAction} className={"modal-submit-button"}>
              <p className={"capitalize"}>{value}</p>
              {isLoading && (
                <Image
                  src={"/assets/icons/loader.svg"}
                  alt={"loader"}
                  width={24}
                  height={24}
                  className={"animate-spin"}
                />
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    );
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger className={"shad-no-focus"}>
          <Image
            src={"/assets/icons/dots.svg"}
            alt={"dots"}
            width={34}
            height={24}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel className={"max-w-[200px] truncate"}>
            {file.name}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {actionsDropdownItems
            .filter(
              (actionItem) =>
                (actionItem.value !== "delete" &&
                  actionItem.value !== "rename") ||
                file.owner.email === currentUserEmail,
              // TODO: check if the currentUser has admin privileges
            )
            .map((actionItem) => (
              <DropdownMenuItem
                key={actionItem.value}
                className={"shad-dropdown-item"}
                onClick={() => {
                  setAction(actionItem);

                  if (
                    ["rename", "share", "delete", "details"].includes(
                      actionItem.value,
                    )
                  ) {
                    setIsModalOpen(true);
                  }
                }}
              >
                {actionItem.value === "download" ? (
                  <Link
                    href={constructDownloadUrl(file.bucketFileId)}
                    download={file.name}
                    className="flex items-center gap-2"
                  >
                    <Image
                      src={actionItem.icon}
                      alt={actionItem.label}
                      width={30}
                      height={30}
                    />
                    {actionItem.label}
                  </Link>
                ) : (
                  <div className="flex items-center gap-2">
                    <Image
                      src={actionItem.icon}
                      alt={actionItem.label}
                      width={30}
                      height={30}
                    />
                    {actionItem.label}
                  </div>
                )}
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {renderDialogContent()}
    </Dialog>
  );
};
export default ActionDropDown;
