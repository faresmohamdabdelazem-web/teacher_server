-- Create the UserRole enum type
CREATE TYPE "UserRole" AS ENUM ('teacher', 'assistant', 'student', 'parent');

-- Create the User table
CREATE TABLE "User" (
    "id" SERIAL PRIMARY KEY,
    "email" VARCHAR UNIQUE NOT NULL,
    "name" VARCHAR NOT NULL,
    "password" VARCHAR NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX "IDX_User_email" ON "User" ("email");
CREATE INDEX "IDX_User_role" ON "User" ("role"); 