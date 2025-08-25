import axios, { AxiosInstance } from "axios";
import { GeoLocation } from "../types/index.js";
import { getConfig } from "../config/index.js";
import { retry } from "../utils/index.js";

export class GeoIPService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: "http://ip-api.com",
      timeout: getConfig().get("timeout"),
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 429) {
          throw new Error(
            "GeoIP API rate limit exceeded. Please try again later."
          );
        }
        if (error.code === "ECONNABORTED") {
          throw new Error(
            "GeoIP request timeout. Please check your internet connection and try again."
          );
        }
        throw new Error(`GeoIP API error: ${error.message}`);
      }
    );
  }

  async getCurrentLocation(): Promise<GeoLocation> {
    try {
      const response = await retry(
        () => this.client.get("/json"),
        getConfig().get("retries")
      );

      const data = response.data;

      if (!data.city || !data.country || !data.lat || !data.lon) {
        throw new Error("Invalid location data received from GeoIP service");
      }

      return {
        city: data.city,
        country: data.country,
        region: data.regionName || data.region || "",
        lat: data.lat,
        lon: data.lon,
        timezone: data.timezone || "UTC",
      };
    } catch (error) {
      throw new Error(
        `Failed to get current location: ${(error as Error).message}`
      );
    }
  }

  async getLocationByIP(ip: string): Promise<GeoLocation> {
    try {
      const response = await retry(
        () => this.client.get(`/json/${ip}`),
        getConfig().get("retries")
      );

      const data = response.data;

      if (data.status === "fail") {
        throw new Error(`IP lookup failed: ${data.message || "Unknown error"}`);
      }

      if (!data.city || !data.country || !data.lat || !data.lon) {
        throw new Error("Invalid location data received from GeoIP service");
      }

      return {
        city: data.city,
        country: data.country,
        region: data.regionName || data.region || "",
        lat: data.lat,
        lon: data.lon,
        timezone: data.timezone || "UTC",
      };
    } catch (error) {
      throw new Error(
        `Failed to get location for IP ${ip}: ${(error as Error).message}`
      );
    }
  }

  async getLocationByCoordinates(
    lat: number,
    lon: number
  ): Promise<GeoLocation> {
    try {
      const response = await retry(
        () => this.client.get(`/json?lat=${lat}&lon=${lon}`),
        getConfig().get("retries")
      );

      const data = response.data;

      if (!data.city || !data.country || !data.lat || !data.lon) {
        throw new Error("Invalid location data received from GeoIP service");
      }

      return {
        city: data.city,
        country: data.country,
        region: data.regionName || data.region || "",
        lat: data.lat,
        lon: data.lon,
        timezone: data.timezone || "UTC",
      };
    } catch (error) {
      throw new Error(
        `Failed to get location for coordinates (${lat}, ${lon}): ${(error as Error).message}`
      );
    }
  }

  isValidLocation(location: Partial<GeoLocation>): location is GeoLocation {
    return !!(
      location.city &&
      location.country &&
      typeof location.lat === "number" &&
      typeof location.lon === "number"
    );
  }

  formatLocation(location: GeoLocation): string {
    const parts = [location.city];

    if (location.region && location.region !== location.city) {
      parts.push(location.region);
    }

    parts.push(location.country);

    return parts.join(", ");
  }
}

export const geoIPService = new GeoIPService();
