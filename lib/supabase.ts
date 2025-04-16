import type { User } from "@/types"

// User authentication functions
export async function getUserByPhone(phoneNumber: string) {
  try {
    const response = await fetch("/api/users/phone", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumber,
      }),
    })

    if (!response.ok) {
      console.error("Error fetching user:", await response.text())
      return null
    }

    const userData = await response.json()
    return userData as User | null
  } catch (error) {
    console.error("Error in getUserByPhone:", error)
    return null
  }
}

export async function createUser(phoneNumber: string, firstName: string, lastName: string) {
  try {
    // Use the server-side API to create the user
    const response = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone_number: phoneNumber,
        first_name: firstName,
        last_name: lastName,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Error creating user:", errorData)
      return null
    }

    const userData = await response.json()
    return userData as User
  } catch (error) {
    console.error("Error in createUser:", error)
    return null
  }
}

export async function saveUserStations(userId: string, stationIds: string[]) {
  try {
    // Use the server-side API to save user stations
    const response = await fetch("/api/user-stations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        stationIds,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Error saving user stations:", errorData)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in saveUserStations:", error)
    return false
  }
}

export async function getUserStations(userId: string) {
  try {
    const response = await fetch(`/api/user-stations/${userId}`)

    if (!response.ok) {
      console.error("Error fetching user stations:", await response.text())
      return []
    }

    const stationIds = await response.json()
    return stationIds
  } catch (error) {
    console.error("Error in getUserStations:", error)
    return []
  }
}

// Local storage functions
export function saveUserToLocalStorage(user: User) {
  if (typeof window !== "undefined") {
    localStorage.setItem("subway_user", JSON.stringify(user))
  }
}

export function getUserFromLocalStorage(): User | null {
  if (typeof window !== "undefined") {
    const userJson = localStorage.getItem("subway_user")
    if (userJson) {
      try {
        return JSON.parse(userJson)
      } catch (error) {
        console.error("Error parsing user from localStorage:", error)
      }
    }
  }
  return null
}

export function clearUserFromLocalStorage() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("subway_user")
  }
}

