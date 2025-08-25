import axios, { AxiosInstance } from "axios";

/**
 * Weather API service that connects to deployed Nimbus server
 * Users don't need API keys - they use the cloud service
 */
export class WeatherApiService {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor() {
    // Auto-detect environment: localhost for dev, deployed URL for production
    this.baseUrl =
      process.env["NIMBUS_API_URL"] ||
      (process.env["NODE_ENV"] === "development"
        ? "http://localhost:3000"
        : "https://nimbus-mauve.vercel.app");

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "nimbus-cli/1.2.0",
      },
    });

    // Simple error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const message =
            error.response.data?.message || error.response.statusText;
          throw new Error(`API Error: ${message}`);
        } else if (error.request) {
          throw new Error(
            "Network Error: Unable to connect to weather service. Please check your internet connection."
          );
        } else {
          throw new Error(`Request Error: ${error.message}`);
        }
      }
    );
  }

  /**
   * Process any weather query via the API
   */
  async processWeatherQuery(
    query: string,
    units: string = "imperial"
  ): Promise<any> {
    try {
      const response = await this.client.post("/api/weather", {
        query,
        units,
        summary: true,
      });

      return response.data?.data || response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check API server health
   */
  async checkHealth(): Promise<any> {
    try {
      const response = await this.client.get("/health");
      return response.data?.data || response.data;
    } catch (error) {
      throw error;
    }
  }
}

// Export singleton instance
export const weatherApi = new WeatherApiService();
