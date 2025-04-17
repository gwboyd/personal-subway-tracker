import { Switch } from "@/components/ui/switch"

interface LineToggleProps {
  line: string
  color: string
  enabled: boolean
  onToggle: () => void
}

// Map numeric line codes to their actual subway line designations
const lineCodeMap: Record<string, string> = {
  // Single digit lines
  "1": "1",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  // Letter lines
  "A": "A",
  "B": "B",
  "C": "C",
  "D": "D",
  "E": "E",
  "F": "F",
  "G": "G",
  "J": "J",
  "L": "L",
  "M": "M",
  "N": "N",
  "Q": "Q",
  "R": "R",
  "S": "S",
  "W": "W",
  "Z": "Z",
  // Numeric codes
  "101": "1",
  "137": "3",
  "165": "6",
  "228": "2",
  "251": "5",
  "401": "4",
  "726": "7",
  "901": "9",
  "902": "GS", // Grand Central Shuttle
  "SI": "SI", // Staten Island Railway
}

export default function LineToggle({ line, color, enabled, onToggle }: LineToggleProps) {
  const bgColor = getBackgroundColor(color)
  const textColor = getTextColor(color)
  
  // Get the display line name from the map, or use the original if not found
  const displayLine = lineCodeMap[line] || line

  // Use inline style for hex colors
  const style = color.startsWith('#') && enabled ? { backgroundColor: color } : {}

  return (
    <div className="flex items-center space-x-2">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
          enabled ? bgColor : "bg-gray-200"
        } ${enabled ? textColor : "text-gray-500"}`}
        style={style}
      >
        {displayLine}
      </div>
      <Switch checked={enabled} onCheckedChange={onToggle} />
    </div>
  )
}

function getBackgroundColor(color: string): string {
  // Handle custom hex colors using style attribute instead of className
  if (color.startsWith('#')) {
    // Return empty string as we'll use inline style instead
    return ''
  }
  
  switch (color) {
    case "blue":
      return "bg-blue-600"
    case "red":
      return "bg-red-600"
    case "orange":
    case "#ff5d0d":
      return "bg-orange-500"
    case "yellow":
    case "#f9c506":
      return ""  // Use inline style for consistent yellow
    case "green":
      return "bg-green-600"
    case "purple":
      return "bg-purple-600"
    case "brown":
      return "bg-amber-800"
    case "gray":
      return "bg-gray-600"
    default:
      return "bg-gray-600"
  }
}

function getTextColor(color: string): string {
  switch (color) {
    case "yellow":
    case "#f9c506":
      return "text-black"
    default:
      return "text-white"
  }
}
