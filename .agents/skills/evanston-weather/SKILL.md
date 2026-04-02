---
name: evanston-weather-skill
description: Use this skill to retrieve the latest weather observation for Evanston, Illinois.
---

## Usage

To get the raw GeoJSON weather data:

```bash
curl -H "Accept: application/geo+json" \
     -H "User-Agent: (maxwell-weather-skill, your-email@example.com)" \
     "https://api.weather.gov/stations/KORD/observations/latest"
```

**Important:** The NWS API requires a `User-Agent` header. Please replace `your-email@example.com` with your actual email address or a suitable identifier.

To extract specific values like temperature and conditions using `jq`:

```bash
curl -s -H "User-Agent: (maxwell-weather-skill, your-email@example.com)" \
     "https://api.weather.gov/stations/KORD/observations/latest" | \
     jq '.properties | {temp: .temperature.value, unit: .temperature.unitCode, description: .textDescription}'
```

## Dependencies

*   `curl`
*   `jq` (for extracting specific values)
