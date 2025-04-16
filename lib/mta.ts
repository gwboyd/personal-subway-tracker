import * as GtfsRealtimeBindings from "gtfs-realtime-bindings"
import { getStationName } from "./station-utils"

export interface Arrival {
  id: string
  line: string
  time: Date
  minutesAway: number
  delayed: boolean
  destination: string
  tripId: string
  stationName?: string
}

// Station IDs for reference:
// A32 = 23rd St (8th Ave - A, C, E)
// D18 = 23rd St (6th Ave - F, M)
// R19 = 23rd St (Broadway - N, R, W)
// 635 = 23rd St (Park Ave - 6)

const FEED_URLS = {
  ACE: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace",
  BDFM: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm",
  NQRW: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-nqrw",
  "1234567": "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs",
  JZ: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-jz",
  G: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g",
  L: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-l",
}

// Map of line to feed URL
const LINE_TO_FEED: Record<string, string> = {
  // Letter lines
  A: FEED_URLS.ACE,
  C: FEED_URLS.ACE,
  E: FEED_URLS.ACE,
  B: FEED_URLS.BDFM,
  D: FEED_URLS.BDFM,
  F: FEED_URLS.BDFM,
  M: FEED_URLS.BDFM,
  N: FEED_URLS.NQRW,
  Q: FEED_URLS.NQRW,
  R: FEED_URLS.NQRW,
  W: FEED_URLS.NQRW,
  // Single digit lines
  "1": FEED_URLS["1234567"],
  "2": FEED_URLS["1234567"],
  "3": FEED_URLS["1234567"],
  "4": FEED_URLS["1234567"],
  "5": FEED_URLS["1234567"],
  "6": FEED_URLS["1234567"],
  "7": FEED_URLS["1234567"],
  // Other lines
  J: FEED_URLS.JZ,
  Z: FEED_URLS.JZ,
  G: FEED_URLS.G,
  L: FEED_URLS.L,
  // Numeric codes for lines
  "101": FEED_URLS["1234567"], // 1 train
  "137": FEED_URLS["1234567"], // 3 train
  "165": FEED_URLS["1234567"], // 6 train
  "228": FEED_URLS["1234567"], // 2 train
  "251": FEED_URLS["1234567"], // 5 train
  "401": FEED_URLS["1234567"], // 4 train
  "726": FEED_URLS["1234567"], // 7 train
  "901": FEED_URLS["1234567"], // 9 train (if it exists)
  "902": FEED_URLS["1234567"], // Grand Central Shuttle
  "SI": FEED_URLS["1234567"], // Staten Island Railway
  // Add more lines as needed
}

// Function to get the feed URL for a line, with fallback for numeric codes
function getFeedUrlForLine(line: string): string | undefined {
  // If the line is directly mapped, return that feed URL
  if (LINE_TO_FEED[line]) {
    return LINE_TO_FEED[line];
  }
  
  // For numeric codes, try to determine the appropriate feed
  // MTA numeric codes: 1xx = 1 train, 2xx = 2 train, etc.
  if (/^\d+$/.test(line)) {
    const firstDigit = line.charAt(0);
    
    // For lines 1-7, use the 1234567 feed
    if (['1', '2', '3', '4', '5', '6', '7'].includes(firstDigit)) {
      return FEED_URLS["1234567"];
    }
    
    // For other numeric codes, make a best guess based on first digit
    if (firstDigit === '9') {
      // Shuttles and special services often start with 9
      return FEED_URLS["1234567"];
    }
  }
  
  // Default to returning undefined if we can't determine the feed
  console.warn(`Could not determine feed URL for line: ${line}`);
  return undefined;
}

async function fetchFeed(url: string): Promise<any> {
  try {
    console.log("Fetching MTA feed from:", url);
    // Include MTA API key if provided in environment
    const headers: Record<string, string> = {}
    if (process.env.MTA_API_KEY) {
      headers['x-api-key'] = process.env.MTA_API_KEY
    }
    const response = await fetch(url, {
      next: { revalidate: 30 }, // Revalidate every 30 seconds
      headers,
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch MTA data: ${response.status} ${response.statusText}`)
    }

    const buffer = await response.arrayBuffer()
    console.log("Successfully fetched feed, buffer size:", buffer.byteLength);
    
    try {
      const decoded = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buffer))
      console.log("Successfully decoded feed, entity count:", decoded.entity?.length || 0);
      return decoded;
    } catch (decodeError) {
      console.error("Error decoding feed:", decodeError);
      throw decodeError;
    }
  } catch (error) {
    console.error("Error fetching or parsing feed:", error)
    throw error
  }
}

export async function getAvailableLines(
  stationId: string,
  direction: "N" | "S",
  possibleLines: string[],
): Promise<string[]> {
  try {
    const allArrivals = await getSubwayArrivals(stationId, direction, possibleLines)
    
    // Get unique lines that have arrivals
    const availableLines = [...new Set(allArrivals.map(arrival => arrival.line))]
    return availableLines
  } catch (error) {
    console.error('Error fetching available lines:', error)
    return []
  }
}

export async function getSubwayArrivals(stationId: string, direction: "N" | "S", lines: string[]): Promise<Arrival[]> {
  try {
    console.log(`Getting subway arrivals for station ${stationId}, direction ${direction}, lines:`, lines);
    
    // Determine which feeds to fetch based on the lines, using the new function
    const feedUrls = [...new Set(lines.map(line => getFeedUrlForLine(line)))].filter(Boolean) as string[]
    
    if (feedUrls.length === 0) {
      throw new Error(`No feed URLs found for lines: ${lines.join(', ')}`)
    }
    
    console.log(`Found ${feedUrls.length} feed URLs:`, feedUrls);
    
    // Fetch all required feeds
    const feedPromises = feedUrls.map(url => fetchFeed(url))
    const feeds = await Promise.all(feedPromises)
    
    console.log(`Successfully fetched ${feeds.length} feeds`);
    
    const arrivals: Arrival[] = []
    const now = Math.floor(Date.now() / 1000)
    
    for (const feed of feeds) {
      if (!feed.entity || feed.entity.length === 0) {
        console.log("Feed has no entities");
        continue;
      }
      
      console.log(`Processing feed with ${feed.entity.length} entities`);
      let matchCount = 0;
      
      for (const entity of feed.entity) {
        if (entity.tripUpdate && entity.tripUpdate.trip) {
          const trip = entity.tripUpdate.trip
          const routeId = trip.routeId
          
          // Skip if not one of the requested lines
          if (!lines.includes(routeId)) continue
          
          // Check if this trip has a stop at our station in the right direction
          if (entity.tripUpdate.stopTimeUpdate) {
            // Find the last stop to use as destination
            let lastStop = null;
            let lastStopId = '';
            
            // First, find the last stop in this trip
            for (const update of entity.tripUpdate.stopTimeUpdate) {
              if (update.arrival && update.arrival.time) {
                lastStop = update;
                lastStopId = update.stopId.slice(0, -1); // Remove direction character
              }
            }
            
            // Now find our station stop
            for (const update of entity.tripUpdate.stopTimeUpdate) {
              const stopId = update.stopId;
              const expectedStopId = `${stationId}${direction}`;
              
              if (stopId === expectedStopId) {
                matchCount++;
                if (update.arrival && update.arrival.time) {
                  const arrivalTime = new Date(update.arrival.time.low * 1000)
                  const minutesAway = Math.floor((update.arrival.time.low - now) / 60)
                  
                  // Only include future arrivals within the next hour
                  if (minutesAway > 0 && minutesAway <= 60) {
                    // Get the destination from the last stop or fall back to tripHeadsign
                    const destination = lastStopId ? getStationName(lastStopId) || trip.tripHeadsign || 'Unknown' : trip.tripHeadsign || 'Unknown';
                    
                    console.log(`Found arrival: Line ${routeId}, ${minutesAway} minutes away, destination: ${destination}`);
                    
                    arrivals.push({
                      id: `${trip.tripId}-${stationId}`,
                      line: routeId,
                      time: arrivalTime,
                      minutesAway,
                      delayed: update.arrival.delay ? update.arrival.delay > 300 : false, // Delayed if > 5 minutes
                      destination: destination,
                      tripId: trip.tripId,
                      stationName: getStationName(stationId), // Add the station name using our utility function
                    })
                  } else {
                    console.log(`Skipping arrival: Line ${routeId}, ${minutesAway} minutes away (outside 1-60 minute window)`);
                  }
                } else {
                  console.log(`Stop matched but no arrival time found for line ${routeId}`);
                }
                break
              }
            }
          } else {
            console.log(`Trip ${trip.tripId} for line ${routeId} has no stopTimeUpdate`);
          }
        }
      }
      
      console.log(`Found ${matchCount} matching stops for station ${stationId} in this feed`);
    }
    
    console.log(`Total arrivals found: ${arrivals.length}`);
    return arrivals.sort((a, b) => a.minutesAway - b.minutesAway)
  } catch (error) {
    console.error('Error fetching subway arrivals:', error)
    // Return empty array on error
    return []
  }
}

export async function getDestinationTimes(tripId: string, line: string): Promise<Arrival[]> {
  try {
    const feedUrl = getFeedUrlForLine(line)
    if (!feedUrl) {
      throw new Error(`No feed URL found for line: ${line}`)
    }
    
    const feed = await fetchFeed(feedUrl)
    const destinations: Arrival[] = []
    const now = Math.floor(Date.now() / 1000)
    
    for (const entity of feed.entity) {
      if (entity.tripUpdate && entity.tripUpdate.trip && entity.tripUpdate.trip.tripId === tripId) {
        // Find the last stop to use as destination
        let lastStopId = '';
        
        // First, find the last stop in this trip
        if (entity.tripUpdate.stopTimeUpdate && entity.tripUpdate.stopTimeUpdate.length > 0) {
          const lastUpdate = entity.tripUpdate.stopTimeUpdate[entity.tripUpdate.stopTimeUpdate.length - 1];
          if (lastUpdate) {
            lastStopId = lastUpdate.stopId.slice(0, -1); // Remove direction character
          }
        }
        
        // Get the destination from the last stop or fall back to tripHeadsign
        const finalDestination = lastStopId 
          ? getStationName(lastStopId) || entity.tripUpdate.trip.tripHeadsign || 'Unknown' 
          : entity.tripUpdate.trip.tripHeadsign || 'Unknown';
        
        if (entity.tripUpdate.stopTimeUpdate) {
          for (const update of entity.tripUpdate.stopTimeUpdate) {
            if (update.arrival && update.arrival.time) {
              const arrivalTime = new Date(update.arrival.time.low * 1000)
              const minutesAway = Math.floor((update.arrival.time.low - now) / 60)
              
              // Only include future arrivals
              if (minutesAway > 0) {
                const stationId = update.stopId.slice(0, -1) // Remove direction character
                
                destinations.push({
                  id: `${tripId}-${stationId}`,
                  line,
                  time: arrivalTime,
                  minutesAway,
                  delayed: update.arrival.delay ? update.arrival.delay > 300 : false,
                  destination: finalDestination,
                  tripId,
                  stationName: getStationName(stationId), // Use our utility function to get the station name
                })
              }
            }
          }
        }
        break
      }
    }
    
    return destinations.sort((a, b) => a.minutesAway - b.minutesAway)
  } catch (error) {
    console.error('Error fetching destination times:', error)
    return []
  }
}
