import { NextResponse } from "next/server"
import { getFeedUrlForLine, fetchFeed } from "@/lib/mta"

export async function GET() {
  try {
    // Test fetching data for a common line like the A train
    const testLine = "A"
    const feedUrl = getFeedUrlForLine(testLine)
    
    if (!feedUrl) {
      return NextResponse.json({ 
        error: "No feed URL found for line", 
        line: testLine 
      }, { status: 400 })
    }
    
    // Log the attempt
    console.log(`DEBUG: Attempting to fetch feed for line ${testLine} from ${feedUrl}`)
    
    // Try to fetch the feed
    const result = await fetchFeed(feedUrl)
    
    // Return basic stats about what we got
    return NextResponse.json({
      success: true,
      line: testLine,
      url: feedUrl,
      entityCount: result?.entity?.length || 0,
      timestamp: new Date().toISOString(),
      headers: {
        // Include some headers we're sending for debugging
        accept: 'application/x-protobuf',
        userAgent: 'personal-subway-tracker/1.0.0'
      }
    })
  } catch (error: any) {
    console.error("DEBUG API error:", error)
    
    return NextResponse.json({ 
      error: "Failed to fetch subway data", 
      message: error?.message || "Unknown error",
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 })
  }
}
