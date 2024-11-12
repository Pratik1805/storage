"use server";

// **CREATE ACCOUNT FLOW***
/*
 * 1. USERS enters full name and Email
 * 2. Check if the user already exist using the email
 * 3. Send OTP to user's email
 * 4. This will send a secret key for creating a session
 * 5. Create a new user document if the user is a new user
 * 6. Return the user's accountId that will be used to complete the login
 * 7. Verify the OTP and authenticate to login
 *
 * */

import { createAdminClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { ID, Query } from "node-appwrite";
import { parseStringify } from "@/lib/utils";

const getUserByEmail = async (email: string) => {
  const { databases } = await createAdminClient();

  const result = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.usersCollectionId,
    [Query.equal("email", [email])],
  );

  return result.total > 0 ? result.documents[0] : null;
};

const handleError = (error: unknown, message: string) => {
  console.log(error, message);
  throw error;
};

const sendEmailOTP = async (email: string) => {
  const { account } = await createAdminClient();

  try {
    const session = await account.createEmailToken(ID.unique(), email); // docs:  https://appwrite.io/docs/references/cloud/client-web/account#createSession

    return session.userId;
  } catch (error) {
    handleError(error, "Failed to send email OTP");
  }
};

export const createAccount = async ({
  fullName,
  email,
}: {
  fullName: string;
  email: string;
}) => {
  const existingUser = await getUserByEmail(email);

  const accountId = await sendEmailOTP(email);

  if (!accountId) throw new Error("Failed to send an OTP");

  if (!existingUser) {
    const { databases } = await createAdminClient();

    await databases.createDocument(
      // docs: https://appwrite.io/docs/references/cloud/server-nodejs/databases#databasesCreateCollection
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      ID.unique(),
      {
        fullName,
        email,
        avatar:
          "https://w7.pngwing.com/pngs/717/24/png-transparent-computer-icons-user-profile-user-account-avatar-heroes-silhouette-black-thumbnail.png",
        accountId,
      },
    );
  }

  return parseStringify({ accountId });
};
