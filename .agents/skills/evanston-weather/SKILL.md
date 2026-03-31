# Evanston Weather Skill

This skill retrieves the latest weather observation for Evanston, Illinois, using the National Weather Service (NWS) API, specifically from the KORD (Chicago O'Hare) station.

## Usage

To get the raw GeoJSON weather data:

```bash
curl -H "Accept: application/geo+json" \
     -H "User-Agent: (nanobot-weather-skill, your-email@example.com)" \
     "https://api.weather.gov/stations/KORD/observations/latest"
```

**Important:** The NWS API requires a `User-Agent` header. Please replace `your-email@example.com` with your actual email address or a suitable identifier.

To extract specific values like temperature and conditions using `jq`:

```bash
curl -s -H "User-Agent: (nanobot-weather-skill, your-email@example.com)" \
     "https://api.weather.gov/stations/KORD/observations/latest" | \
     jq '.properties | {temp: .temperature.value, unit: .temperature.unitCode, description: .textDescription}'
```

## Dependencies

*   `curl`
*   `jq` (for extracting specific values)
