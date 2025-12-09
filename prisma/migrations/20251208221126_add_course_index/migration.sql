-- CreateTable
CREATE TABLE "CourseIndex" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rootPath" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "CourseIndex_rootPath_key" ON "CourseIndex"("rootPath");
