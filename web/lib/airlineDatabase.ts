// Comprehensive airline database with IATA and ICAO code support
export interface Airline {
  name: string
  iata: string
  icao: string
  callsign: string
  country: string
  active: boolean
}

// Import the comprehensive airline data
import airlineData from './airlines.json'

// Create lookup objects for fast searching
const airlinesByIata: Record<string, any> = airlineData.byIata
const airlinesByIcao: Record<string, any> = airlineData.byIcao

// Debug logging
console.log('🛩️ Comprehensive airline database loaded:', {
  totalAirlines: airlineData.all.length,
  iataCodes: Object.keys(airlinesByIata).length,
  icaoCodes: Object.keys(airlinesByIcao).length,
  hasDL: !!airlinesByIata['DL'],
  hasDAL: !!airlinesByIcao['DAL'],
  dlInfo: airlinesByIata['DL'] || 'Not found',
  dalInfo: airlinesByIcao['DAL'] || 'Not found'
})

/**
 * Get airline information by IATA code
 */
export function getAirlineByIATA(iata: string): any | null {
  const upperIATA = iata.toUpperCase()
  return airlinesByIata[upperIATA] || null
}

/**
 * Get airline name by IATA code
 */
export function getAirlineNameByIATA(iata: string): string | null {
  const airline = getAirlineByIATA(iata)
  return airline ? airline.name : null
}

/**
 * Get airline information by ICAO code
 */
export function getAirlineByICAO(icao: string): any | null {
  const upperICAO = icao.toUpperCase()
  return airlinesByIcao[upperICAO] || null
}

/**
 * Get airline name by ICAO code
 */
export function getAirlineNameByICAO(icao: string): string | null {
  const airline = getAirlineByICAO(icao)
  return airline ? airline.name : null
}

/**
 * Get airline information by callsign (extracts first 3 characters as ICAO)
 */
export function getAirlineByCallsign(callsign: string): any | null {
  if (!callsign || callsign.length < 3) return null
  
  const icao = callsign.substring(0, 3).toUpperCase()
  return getAirlineByICAO(icao)
}

/**
 * Get airline name by callsign (extracts first 3 characters as ICAO)
 */
export function getAirlineNameByCallsign(callsign: string): string {
  if (!callsign) return 'Unknown'
  
  const airline = getAirlineByCallsign(callsign)
  if (airline) {
    return airline.name
  }
  
  // Fallback: extract ICAO code and return generic name
  const icao = callsign.substring(0, 3).toUpperCase()
  return `${icao} Airlines`
}

/**
 * Get airline information by either IATA or ICAO code
 */
export function getAirlineByCode(code: string): any | null {
  const upperCode = code.toUpperCase()
  
  // Try IATA first (2-3 characters)
  if (upperCode.length === 2 || upperCode.length === 3) {
    const iataAirline = airlinesByIata[upperCode]
    if (iataAirline) return iataAirline
    
    // Try ICAO if IATA not found
    const icaoAirline = airlinesByIcao[upperCode]
    if (icaoAirline) return icaoAirline
  }
  
  return null
}

/**
 * Get airline name by either IATA or ICAO code
 */
export function getAirlineNameByCode(code: string): string | null {
  const airline = getAirlineByCode(code)
  return airline ? airline.name : null
}

/**
 * Get all airlines in the database
 */
export function getAllAirlines(): any[] {
  return airlineData.all
}

/**
 * Get database metadata
 */
export function getDatabaseMetadata() {
  return {
    totalAirlines: airlineData.all.length,
    iataCodes: Object.keys(airlinesByIata).length,
    icaoCodes: Object.keys(airlinesByIcao).length,
    source: "Comprehensive airline database from IATA/ICAO data",
    convertedAt: new Date().toISOString(),
    description: "Complete airline database with IATA and ICAO code support"
  }
}
