import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { 
  createCollege, 
  getAllColleges, 
  getCollegesByMentor,
  getUserByGitLabId 
} from "../../../utils/database";

export async function POST(request) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserByGitLabId(session.user.gitlabId);
    
    if (!user || user.role !== 'mentor') {
      return NextResponse.json({ error: "Only mentors can create colleges" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, location, website } = body;

    if (!name) {
      return NextResponse.json({ error: "College name is required" }, { status: 400 });
    }

    const collegeData = {
      name,
      description,
      location,
      website,
      createdBy: user._id.toString()
    };

    const collegeId = await createCollege(collegeData);
    
    return NextResponse.json({ 
      success: true, 
      message: "College created successfully",
      collegeId: collegeId 
    });

  } catch (error) {
    console.error("Create college error:", error);
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

    const { searchParams } = new URL(request.url);
    const mentorOnly = searchParams.get('mentorOnly') === 'true';

    let colleges;
    
    if (mentorOnly) {
      const user = await getUserByGitLabId(session.user.gitlabId);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      colleges = await getCollegesByMentor(user._id.toString());
    } else {
      colleges = await getAllColleges();
    }
    
    return NextResponse.json({ colleges });

  } catch (error) {
    console.error("Get colleges error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}