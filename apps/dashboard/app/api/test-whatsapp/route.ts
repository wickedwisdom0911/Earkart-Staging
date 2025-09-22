import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ 
    message: "Test endpoint working",
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('🧪 Test API called with:', body);
    
    return NextResponse.json({ 
      success: true,
      message: "Test API working",
      receivedData: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
