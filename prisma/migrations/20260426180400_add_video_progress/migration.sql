-- CreateTable
CREATE TABLE "VideoProgress" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "videoPath" TEXT NOT NULL,
    "lastTime" REAL NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VideoProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "VideoProgress_userId_videoPath_key" ON "VideoProgress"("userId", "videoPath");

-- CreateIndex
CREATE INDEX "VideoProgress_userId_idx" ON "VideoProgress"("userId");

-- CreateIndex
CREATE INDEX "VideoProgress_videoPath_idx" ON "VideoProgress"("videoPath");
