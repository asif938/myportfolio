-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "aboutMe" TEXT NOT NULL,
    "aboutPhotoUrl" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "resumeUrl" TEXT,
    "githubUrl" TEXT,
    "linkedinUrl" TEXT,
    "facebookUrl" TEXT,
    "heroPhotoUrl" TEXT,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "imageUrl" TEXT,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Education" (
    "id" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "startYear" TEXT NOT NULL,
    "endYear" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "mainTechStack" TEXT[],
    "description" TEXT NOT NULL,
    "liveLink" TEXT,
    "githubLink" TEXT,
    "challenges" TEXT NOT NULL,
    "futurePlans" TEXT NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

