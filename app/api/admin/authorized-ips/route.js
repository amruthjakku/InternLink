import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getDatabase } from '../../../../utils/database.js';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle demo mode
    if (!process.env.MONGODB_URI || process.env.DEMO_MODE === 'true') {
      const demoIPs = [
        {
          _id: 'demo_ip_1',
          ip: '192.168.1.100',
          description: 'Main Office Wi-Fi',
          location: 'Office Building A',
          addedBy: 'admin@demo.com',
          addedAt: new Date(),
          isActive: true,
          source: 'admin'
        },
        {
          _id: 'demo_ip_2',
          ip: '203.192.217.10',
          description: 'Branch Office Network',
          location: 'Branch Office',
          addedBy: 'admin@demo.com',
          addedAt: new Date(),
          isActive: true,
          source: 'admin'
        }
      ];
      
      // Add environment IPs
      const envIPs = process.env.AUTHORIZED_IPS?.split(',').map(ip => ({
        ip: ip.trim(),
        description: 'Environment IP',
        addedBy: 'System',
        addedAt: new Date(),
        isActive: true,
        source: 'environment'
      })) || [];
      
      return NextResponse.json({ authorizedIPs: [...demoIPs, ...envIPs] });
    }

    const db = await getDatabase();
    
    // Get authorized IPs from database
    const authorizedIPs = await db.collection('authorized_ips').find({}).toArray();
    
    // Also get from environment as fallback
    const envIPs = process.env.AUTHORIZED_IPS?.split(',').map(ip => ({
      ip: ip.trim(),
      description: 'Environment IP',
      addedBy: 'System',
      addedAt: new Date(),
      isActive: true,
      source: 'environment'
    })) || [];
    
    // Combine and deduplicate
    const allIPs = [...authorizedIPs, ...envIPs];
    const uniqueIPs = allIPs.filter((ip, index, self) => 
      index === self.findIndex(i => i.ip === ip.ip)
    );
    
    return NextResponse.json({ authorizedIPs: uniqueIPs });
    
  } catch (error) {
    console.error('Error fetching authorized IPs:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch authorized IPs' 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ip, description, location } = await request.json();
    
    // Handle demo mode
    if (!process.env.MONGODB_URI || process.env.DEMO_MODE === 'true') {
      return NextResponse.json({ 
        success: true, 
        message: 'IP address added successfully (Demo Mode)',
        ipId: 'demo_new_ip'
      });
    }
    
    // Validate IP address format
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(ip)) {
      return NextResponse.json({ 
        error: 'Invalid IP address format' 
      }, { status: 400 });
    }

    const db = await getDatabase();
    
    // Check if IP already exists
    const existingIP = await db.collection('authorized_ips').findOne({ ip });
    if (existingIP) {
      return NextResponse.json({ 
        error: 'IP address already exists' 
      }, { status: 400 });
    }
    
    // Add new authorized IP
    const newIP = {
      ip,
      description: description || 'No description',
      location: location || null,
      addedBy: session.user.email,
      addedAt: new Date(),
      isActive: true,
      source: 'admin'
    };
    
    const result = await db.collection('authorized_ips').insertOne(newIP);
    
    return NextResponse.json({ 
      success: true, 
      message: 'IP address added successfully',
      ipId: result.insertedId
    });
    
  } catch (error) {
    console.error('Error adding authorized IP:', error);
    return NextResponse.json({ 
      error: 'Failed to add authorized IP' 
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ipId = searchParams.get('id');
    
    if (!ipId) {
      return NextResponse.json({ 
        error: 'IP ID is required' 
      }, { status: 400 });
    }

    const db = await getDatabase();
    
    // Delete the IP
    const result = await db.collection('authorized_ips').deleteOne({ 
      _id: new ObjectId(ipId) 
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ 
        error: 'IP address not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'IP address removed successfully'
    });
    
  } catch (error) {
    console.error('Error removing authorized IP:', error);
    return NextResponse.json({ 
      error: 'Failed to remove authorized IP' 
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ipId, isActive, description, location } = await request.json();
    
    if (!ipId) {
      return NextResponse.json({ 
        error: 'IP ID is required' 
      }, { status: 400 });
    }

    const db = await getDatabase();
    
    // Update the IP
    const updateData = {
      updatedBy: session.user.email,
      updatedAt: new Date()
    };
    
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }
    
    if (description !== undefined) {
      updateData.description = description;
    }
    
    if (location !== undefined) {
      updateData.location = location;
    }
    
    const result = await db.collection('authorized_ips').updateOne(
      { _id: new ObjectId(ipId) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        error: 'IP address not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'IP address updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating authorized IP:', error);
    return NextResponse.json({ 
      error: 'Failed to update authorized IP' 
    }, { status: 500 });
  }
}