-- DropForeignKey
ALTER TABLE "Receipt" DROP CONSTRAINT "Receipt_createdByUserId_fkey";

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
