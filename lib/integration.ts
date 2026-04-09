import { prisma } from "./prisma";

export async function getUserIntegration(userId: string) {
  return await prisma.userIntegration.findUnique({
    where: { userId },
  });
}

export async function deleteUserIntegration(userId: string) {
  return await prisma.userIntegration.delete({
    where: { userId },
  });
}
