import { prisma } from "./prisma";
import { Platform } from "./platforms";

export async function getUserIntegrations(userId: string) {
  return await prisma.userIntegration.findMany({
    where: { userId },
  });
}

export async function getUserIntegration(userId: string, platform: Platform) {
  return await prisma.userIntegration.findUnique({
    where: { 
      userId_platform: {
        userId,
        platform
      }
    },
  });
}

export async function deleteUserIntegration(userId: string, platform: Platform) {
  return await prisma.userIntegration.delete({
    where: { 
      userId_platform: {
        userId,
        platform
      }
    },
  });
}
