import React from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import FileUploader from "@/components/FileUploader";
import { sigOutUser } from "@/lib/actions/users.action";
import Search from "@/components/Search";

const Header = ({
  userId,
  accountId,
}: {
  userId: string;
  accountId: string;
}) => {
  return (
    <header className={"header"}>
      <Search />
      <div className={"header-wrapper"}>
        <FileUploader ownerId={userId} accountId={accountId} />
        <form
          action={async () => {
            "use server"; // new React-19 functionality
            await sigOutUser();
          }}
        >
          <Button type={"submit"} className="sign-out-button">
            <Image
              src={"/assets/icons/logout.svg"}
              alt={"sign-out"}
              width={24}
              height={24}
              className={"w-6"}
            />
          </Button>
        </form>
      </div>
    </header>
  );
};
export default Header;
