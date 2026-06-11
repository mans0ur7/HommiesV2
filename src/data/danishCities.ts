// List of valid Danish cities for search validation
export const danishCities = [
  // Major cities
  "København",
  "Aarhus",
  "Odense",
  "Aalborg",
  "Esbjerg",
  "Randers",
  "Kolding",
  "Horsens",
  "Vejle",
  "Roskilde",
  
  // Copenhagen areas and suburbs
  "Frederiksberg",
  "Amager",
  "Østerbro",
  "Nørrebro",
  "Vesterbro",
  "Valby",
  "Vanløse",
  "Brønshøj",
  "Hellerup",
  "Gentofte",
  "Charlottenlund",
  "Lyngby",
  "Gladsaxe",
  "Hvidovre",
  "Tårnby",
  "Dragør",
  "Søborg",
  "Bagsværd",
  "Klampenborg",
  "Skodsborg",
  "Vedbæk",
  "Holte",
  "Birkerød",
  "Hørsholm",
  "Rungsted",
  "Kokkedal",
  "Nivå",
  "Humlebæk",
  "Espergærde",
  "Snekkersten",
  "Albertslund",
  "Ballerup",
  "Brøndby",
  "Glostrup",
  "Herlev",
  "Ishøj",
  "Rødovre",
  "Taastrup",
  "Kastrup",
  "Vallensbæk",
  "Greve",
  "Solrød",
  "Hundige",
  "Tune",
  "Ølstykke",
  "Stenløse",
  "Farum",
  "Værløse",
  "Måløv",
  "Skovlunde",
  "Smørum",
  "Allerød",
  "Fredensborg",
  "Græsted",
  "Gilleleje",
  "Hornbæk",
  "Tikøb",
  
  // Aarhus areas
  "Viby J",
  "Brabrand",
  "Åbyhøj",
  "Risskov",
  "Skejby",
  "Trige",
  "Lystrup",
  "Hjortshøj",
  "Egå",
  "Skødstrup",
  "Hasselager",
  "Mårslet",
  "Tranbjerg",
  "Højbjerg",
  "Holme",
  
  // Odense areas
  "Bolbro",
  "Dalum",
  "Højby",
  "Bellinge",
  "Seden",
  "Bullerup",
  
  // Other student cities
  "Herning",
  "Silkeborg",
  "Næstved",
  "Fredericia",
  "Viborg",
  "Køge",
  "Holstebro",
  "Slagelse",
  "Hillerød",
  "Helsingør",
  "Sønderborg",
  "Svendborg",
  "Hjørring",
  "Frederikshavn",
  "Holbæk",
  "Haderslev",
  "Skive",
  "Ringsted",
  "Thisted",
  "Nykøbing F",
  "Nykøbing M",
  "Nykøbing S",
  "Varde",
  "Nyborg",
  "Middelfart",
  "Skanderborg",
  "Aabenraa",
  "Tønder",
  "Frederikssund",
  "Ribe",
  "Sorø",
  "Faaborg",
  "Assens",
  "Kerteminde",
  "Bogense",
  "Mariager",
  "Hobro",
  "Løgstør",
  "Nørresundby",
  "Svenstrup",
  "Gistrup",
  "Klarup",
  "Vodskov",
  "Brønderslev",
  "Dronninglund",
  "Hirtshals",
  "Skagen",
  "Sæby",
  "Lemvig",
  "Struer",
  "Ikast",
  "Brande",
  "Billund",
  "Grindsted",
  "Vejen",
  "Bramming",
  "Ølgod",
  "Varde",
  "Skjern",
  "Ringkøbing",
  "Hvide Sande",
  "Nørre Nebel",
  "Oksbøl",
  "Blåvand",
  "Give",
  "Jelling",
  "Børkop",
  "Hedensted",
  "Løsning",
  "Odder",
  "Hadsten",
  "Hinnerup",
  "Hammel",
  "Galten",
  "Grenaa",
  "Ebeltoft",
  "Rønde",
  "Hornslet",
  "Hadbjerg",
  "Beder",
  "Malling",
  "Solbjerg",
];

// Normalize text for search (lowercase, remove accents variations)
export const normalizeCity = (text: string): string => {
  return text.toLowerCase().trim();
};

// Check if a city is valid (case-insensitive)
export const isValidCity = (query: string): boolean => {
  const normalized = normalizeCity(query);
  return danishCities.some(city => normalizeCity(city) === normalized);
};

// DAWA's officielle postnrnavne for centrale bydele — "Nørrebro" findes ikke som
// postdistrikt; adressen får city "København N". Bruges til at oversætte brugerens
// by-valg til et prefix der matcher properties.city (som altid er DAWA-postnrnavn).
const dawaDistrictByCity: Record<string, string> = {
  "nørrebro": "København N",
  "østerbro": "København Ø",
  "vesterbro": "København V",
  "amager": "København S",
};

// Prefix til ilike-søgninger mod properties.city ("København" → matcher "København N/Ø/…")
export const dawaCityQueryPrefix = (city: string): string => {
  return dawaDistrictByCity[normalizeCity(city)] ?? city.trim();
};

// DAWA-postdistrikter som "København N", "Aarhus C", "Odense SV", "Aalborg Øst" er
// gyldige annonce-byer, selvom de ikke står i danishCities-listen.
const postalDistrictSuffix = /\s+(n|s|ø|v|k|c|m|nv|nø|sv|sø|øst|vest|nord|syd)$/i;
export const isValidListingCity = (query: string): boolean => {
  if (isValidCity(query)) return true;
  const base = query.replace(postalDistrictSuffix, "");
  return base !== query && isValidCity(base);
};

// Get matching cities for autocomplete
export const getMatchingCities = (query: string): string[] => {
  if (!query.trim()) return [];
  const normalized = normalizeCity(query);
  return danishCities.filter(city => 
    normalizeCity(city).includes(normalized)
  );
};

// Get the properly cased city name
export const getProperCityName = (query: string): string | null => {
  const normalized = normalizeCity(query);
  return danishCities.find(city => normalizeCity(city) === normalized) || null;
};
