import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getDatabase } from '../../../../utils/database';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get request data
    const { internId, cohortId } = await request.json();

    if (!internId || !cohortId) {
      return NextResponse.json({ 
        error: 'Intern ID and Cohort ID are required' 
      }, { status: 400 });
    }

    console.log(`Assigning intern ${internId} to cohort ${cohortId}`);

    // 3. Connect to database using MongoDB driver directly
    const db = await getDatabase();

    // 4. Validate IDs
    console.log(`Validating IDs - internId: ${internId} (${typeof internId}), cohortId: ${cohortId} (${typeof cohortId})`);
    
    // Ensure IDs are strings
    const internIdStr = String(internId);
    const cohortIdStr = String(cohortId);
    
    let internObjectId, cohortObjectId;
    try {
      internObjectId = new ObjectId(internIdStr);
      cohortObjectId = new ObjectId(cohortIdStr);
      console.log(`Valid ObjectIds - intern: ${internObjectId}, cohort: ${cohortObjectId}`);
    } catch (error) {
      console.error(`Invalid ID format: ${error.message}`);
      return NextResponse.json({ 
        error: `Invalid ID format: ${error.message}` 
      }, { status: 400 });
    }

    // 5. Find the cohort using MongoDB driver
    console.log(`Looking for cohort with ID: ${cohortObjectId}`);
    
    // First, list all cohorts to debug
    const allCohorts = await db.collection('cohorts').find({}).toArray();
    console.log(`Found ${allCohorts.length} cohorts in database`);
    allCohorts.forEach(c => console.log(`Cohort: ${c.name}, ID: ${c._id}`));
    
    // Now try to find the specific cohort
    const cohort = await db.collection('cohorts').findOne({ 
      _id: cohortObjectId
    });
    
    if (!cohort) {
      console.error(`Cohort with ID ${cohortObjectId} not found`);
      return NextResponse.json({ 
        error: `Cohort with ID ${cohortId} not found` 
      }, { status: 404 });
    }

    console.log(`Found cohort: ${cohort.name}`);

    // 6. Find the intern using MongoDB driver
    console.log(`Looking for intern with ID: ${internObjectId}`);
    
    // Try different approaches to find the intern
    let intern = null;
    
    // First try with the ObjectId
    intern = await db.collection('users').findOne({
      _id: internObjectId
    });
    
    // If not found, try with the string ID
    if (!intern) {
      console.log(`Intern not found with ObjectId, trying string ID: ${internIdStr}`);
      
      // List all interns to debug
      const allInterns = await db.collection('users').find({ role: 'intern' }).toArray();
      console.log(`Found ${allInterns.length} interns in database`);
      allInterns.forEach(i => console.log(`Intern: ${i.name}, ID: ${i._id}`));
      
      // Try again with the exact ID from the database
      const matchingIntern = allInterns.find(i => i._id.toString() === internIdStr);
      if (matchingIntern) {
        console.log(`Found matching intern by string comparison: ${matchingIntern.name}`);
        intern = matchingIntern;
      }
    }
    
    if (!intern) {
      console.error(`Intern with ID ${internObjectId} not found`);
      return NextResponse.json({ 
        error: `Intern with ID ${internId} not found` 
      }, { status: 404 });
    }

    if (intern.role !== 'AI developer Intern') {
      return NextResponse.json({ 
        error: 'User is not an intern' 
      }, { status: 400 });
    }

    console.log(`Found intern: ${intern.name}`);

    // 7. Check if the intern is already assigned to this cohort
    if (intern.cohortId && intern.cohortId.toString() === cohortId) {
      return NextResponse.json({ 
        success: true,
        message: 'Intern is already assigned to this cohort'
      });
    }

    // 8. Check cohort capacity
    if (cohort.maxInterns && cohort.currentInterns >= cohort.maxInterns) {
      return NextResponse.json({ 
        error: 'Cohort is at maximum capacity' 
      }, { status: 400 });
    }

    // 9. Update the intern's cohort assignment
    try {
      // Store previous cohort ID for updating counts
      const previousCohortId = intern.cohortId;
      
      // Update the intern using MongoDB driver
      console.log(`Updating intern ${intern.name} with cohort ID ${cohortId}`);
      
      const updateResult = await db.collection('users').updateOne(
        { _id: internObjectId },
        { 
          $set: { 
            cohortId: cohortId,
            updatedAt: new Date()
          }
        }
      );
      
      if (updateResult.matchedCount === 0) {
        return NextResponse.json({ 
          error: 'Failed to update intern record' 
        }, { status: 500 });
      }
      
      console.log(`Updated intern ${intern.name} with cohort ${cohort.name}`);

      // 10. Update cohort intern counts
      // Increment the new cohort's intern count
      const currentInterns = (cohort.currentInterns || 0) + 1;
      console.log(`Updating cohort ${cohort.name} intern count to ${currentInterns}`);
      
      await db.collection('cohorts').updateOne(
        { _id: cohortObjectId },
        { 
          $set: { 
            currentInterns: currentInterns,
            updatedAt: new Date()
          }
        }
      );
      
      // If the intern was previously in a different cohort, decrement that cohort's count
      if (previousCohortId) {
        try {
          const previousCohort = await db.collection('cohorts').findOne({
            _id: new ObjectId(previousCohortId)
          });
          
          if (previousCohort) {
            const prevCount = Math.max(0, (previousCohort.currentInterns || 1) - 1);
            await db.collection('cohorts').updateOne(
              { _id: new ObjectId(previousCohortId) },
              { 
                $set: { 
                  currentInterns: prevCount,
                  updatedAt: new Date()
                }
              }
            );
            console.log(`Updated previous cohort count`);
          }
        } catch (err) {
          console.error('Error updating previous cohort count:', err);
          // Non-critical error, continue
        }
      }

      return NextResponse.json({ 
        success: true,
        message: 'Intern assigned to cohort successfully'
      });
    } catch (saveError) {
      console.error('Error updating intern or cohort:', saveError);
      return NextResponse.json({ 
        error: `Failed to save changes: ${saveError.message}` 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error assigning intern to cohort:', error);
    return NextResponse.json({ 
      error: `Failed to assign intern to cohort: ${error.message}` 
    }, { status: 500 });
  }
}