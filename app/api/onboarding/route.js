import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { createUser, updateUser, getUserByGitLabId } from "../../../utils/database";

export async function POST(request) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { role, onboardingData } = body;

    // Check if user already exists
    let user = await getUserByGitLabId(session.user.gitlabId);
    
    const userData = {
      name: session.user.name,
      email: session.user.email,
      gitlabId: session.user.gitlabId,
      gitlabUsername: session.user.gitlabUsername,
      avatarUrl: session.user.image,
      role: role,
      onboardingComplete: true,
      ...onboardingData
    };

    if (user) {
      // Update existing user
      await updateUser(user._id, userData);
      return NextResponse.json({ 
        success: true, 
        message: "User updated successfully",
        userId: user._id 
      });
    } else {
      // Create new user
      const userId = await createUser(userData);
      return NextResponse.json({ 
        success: true, 
        message: "User created successfully",
        userId: userId 
      });
    }

  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's onboarding status
    const user = await getUserByGitLabId(session.user.gitlabId);
    
    return NextResponse.json({
      onboardingComplete: user?.onboardingComplete || false,
      role: user?.role || null,
      user: user
    });

  } catch (error) {
    console.error("Get onboarding status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}