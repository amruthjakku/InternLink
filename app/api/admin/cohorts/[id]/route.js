import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import Cohort from '../../../../../models/Cohort';
import User from '../../../../../models/User';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cohort = await Cohort.findById(params.id).populate('techLead college members');
    if (!cohort) {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, cohort });

  } catch (error) {
    console.error('Error fetching cohort:', error);
    return NextResponse.json({ error: 'Failed to fetch cohort' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const updatedCohort = await Cohort.findByIdAndUpdate(params.id, body, { new: true });
    if (!updatedCohort) {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, cohort: updatedCohort });

  } catch (error) {
    console.error('Error updating cohort:', error);
    return NextResponse.json({ error: 'Failed to update cohort' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deletedCohort = await Cohort.findByIdAndUpdate(params.id, { isActive: false });
    if (!deletedCohort) {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    }

    await User.updateMany({ cohortId: params.id }, { $unset: { cohortId: '' } });
    return NextResponse.json({ success: true, message: 'Cohort deactivated' });

  } catch (error) {
    console.error('Error deleting cohort:', error);
    return NextResponse.json({ error: 'Failed to delete cohort' }, { status: 500 });
  }
}
