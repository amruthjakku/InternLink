import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { 
  createCohort, 
  getCohortsByCollege,
  getUserByGitLabId,
  getCollegeById
} from "../../../utils/database";

export async function POST(request) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserByGitLabId(session.user.gitlabId);
    
    if (!user || user.role !== 'mentor') {
      return NextResponse.json({ error: "Only mentors can create cohorts" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, collegeId, startDate, endDate, maxInterns } = body;

    if (!name || !collegeId) {
      return NextResponse.json({ error: "Cohort name and college are required" }, { status: 400 });
    }

    // Verify the mentor owns the college
    const college = await getCollegeById(collegeId);
    if (!college || college.createdBy !== user._id.toString()) {
      return NextResponse.json({ error: "You can only create cohorts for your colleges" }, { status: 403 });
    }

    const cohortData = {
      name,
      description,
      collegeId,
      createdBy: user._id.toString(),
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      maxInterns: maxInterns || 20
    };

    const cohortId = await createCohort(cohortData);
    
    return NextResponse.json({ 
      success: true, 
      message: "Cohort created successfully",
      cohortId: cohortId 
    });

  } catch (error) {
    console.error("Create cohort error:", error);
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
    const collegeId = searchParams.get('collegeId');

    if (!collegeId) {
      return NextResponse.json({ error: "College ID is required" }, { status: 400 });
    }

    const cohorts = await getCohortsByCollege(collegeId);
    
    return NextResponse.json({ cohorts });

  } catch (error) {
    console.error("Get cohorts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}