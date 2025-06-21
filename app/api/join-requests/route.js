import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { 
  createJoinRequest, 
  getJoinRequestsByMentor,
  getJoinRequestsByIntern,
  updateJoinRequest,
  getUserByGitLabId,
  getCollegeById,
  getCohortById,
  updateCohort
} from "../../../utils/database";

export async function POST(request) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserByGitLabId(session.user.gitlabId);
    
    if (!user || user.role !== 'intern') {
      return NextResponse.json({ error: "Only interns can submit join requests" }, { status: 403 });
    }

    const body = await request.json();
    const { collegeId, cohortId, message } = body;

    if (!collegeId || !cohortId) {
      return NextResponse.json({ error: "College and cohort are required" }, { status: 400 });
    }

    // Get college and cohort info
    const college = await getCollegeById(collegeId);
    const cohort = await getCohortById(cohortId);

    if (!college || !cohort) {
      return NextResponse.json({ error: "Invalid college or cohort" }, { status: 400 });
    }

    const requestData = {
      internId: user._id.toString(),
      collegeId,
      cohortId,
      mentorId: college.createdBy,
      message: message || '',
      internName: user.name,
      internEmail: user.email,
      collegeName: college.name,
      cohortName: cohort.name
    };

    const requestId = await createJoinRequest(requestData);
    
    return NextResponse.json({ 
      success: true, 
      message: "Join request submitted successfully",
      requestId: requestId 
    });

  } catch (error) {
    console.error("Create join request error:", error);
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

    const user = await getUserByGitLabId(session.user.gitlabId);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let joinRequests;
    
    if (user.role === 'mentor') {
      joinRequests = await getJoinRequestsByMentor(user._id.toString());
    } else if (user.role === 'intern') {
      joinRequests = await getJoinRequestsByIntern(user._id.toString());
    } else {
      return NextResponse.json({ error: "Invalid user role" }, { status: 400 });
    }
    
    return NextResponse.json({ joinRequests });

  } catch (error) {
    console.error("Get join requests error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserByGitLabId(session.user.gitlabId);
    
    if (!user || user.role !== 'mentor') {
      return NextResponse.json({ error: "Only mentors can update join requests" }, { status: 403 });
    }

    const body = await request.json();
    const { requestId, status, response } = body;

    if (!requestId || !status) {
      return NextResponse.json({ error: "Request ID and status are required" }, { status: 400 });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updateData = {
      status,
      mentorResponse: response || '',
      reviewedBy: user._id.toString()
    };

    const updated = await updateJoinRequest(requestId, updateData);
    
    if (!updated) {
      return NextResponse.json({ error: "Failed to update join request" }, { status: 400 });
    }

    // If approved, increment cohort intern count
    if (status === 'approved') {
      // Get the join request to find the cohort
      const joinRequests = await getJoinRequestsByMentor(user._id.toString());
      const joinRequest = joinRequests.find(req => req._id.toString() === requestId);
      
      if (joinRequest) {
        const cohort = await getCohortById(joinRequest.cohortId);
        if (cohort) {
          await updateCohort(joinRequest.cohortId, {
            currentInterns: (cohort.currentInterns || 0) + 1
          });
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Join request ${status} successfully`
    });

  } catch (error) {
    console.error("Update join request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}