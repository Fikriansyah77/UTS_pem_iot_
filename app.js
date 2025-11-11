class SensorDashboard {
  constructor() {
    this.API_BASE = "/api/sensor";
    this.init();
  }

  async init() {
    await this.checkSystemStatus();
    await this.loadAllData();
    this.startAutoRefresh();
  }

  async checkSystemStatus() {
    try {
      // Check API health
      const healthResponse = await fetch("/api/health");
      const healthData = await healthResponse.json();

      document.getElementById("api-status").textContent =
        healthData.status === "healthy" ? "✅ Online" : "❌ Offline";
      document.getElementById("api-status").className =
        healthData.status === "healthy" ? "status-online" : "status-offline";

      document.getElementById("db-status").textContent =
        healthData.database === "connected"
          ? "✅ Connected"
          : "❌ Disconnected";
      document.getElementById("db-status").className =
        healthData.database === "connected"
          ? "status-online"
          : "status-offline";
    } catch (error) {
      console.error("Error checking system status:", error);
      document.getElementById("api-status").textContent = "❌ Error";
      document.getElementById("api-status").className = "status-offline";
      document.getElementById("db-status").textContent = "❌ Error";
      document.getElementById("db-status").className = "status-offline";
    }
  }

  async fetchData(endpoint) {
    try {
      const response = await fetch(`${this.API_BASE}${endpoint}`);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      return null;
    }
  }

  async loadCurrentData() {
    const data = await this.fetchData("/data/latest");
    if (data) {
      document.getElementById("current-temp").textContent = `${data.suhu} °C`;
      document.getElementById(
        "current-humidity"
      ).textContent = `${data.humidity} %`;
      document.getElementById("current-light").textContent = `${data.lux} lux`;
      document.getElementById(
        "last-update"
      ).textContent = `Terakhir update: ${new Date(
        data.timestamp
      ).toLocaleString("id-ID")}`;
    } else {
      document.getElementById("current-temp").textContent = "-- °C";
      document.getElementById("current-humidity").textContent = "-- %";
      document.getElementById("current-light").textContent = "-- lux";
      document.getElementById("last-update").textContent =
        "Terakhir update: --";
    }
  }

  async loadSummary() {
    const data = await this.fetchData("/data/summary");
    if (data) {
      document.getElementById("max-temp").textContent = `${data.suhu_max} °C`;
      document.getElementById("min-temp").textContent = `${data.suhu_min} °C`;
      document.getElementById("avg-temp").textContent = `${
        data.suhu_avg ? data.suhu_avg.toFixed(2) : 0
      } °C`;
      document.getElementById("total-data").textContent =
        data.total_records || 0;
    }
  }

  async loadHistoricalData() {
    const data = await this.fetchData("/data/recent?limit=10");
    const tbody = document.getElementById("data-table-body");

    if (data && data.length > 0) {
      tbody.innerHTML = data
        .map(
          (item) => `
                <tr>
                    <td>${new Date(item.timestamp).toLocaleString("id-ID")}</td>
                    <td>${item.suhu}</td>
                    <td>${item.humidity}</td>
                    <td>${item.lux}</td>
                </tr>
            `
        )
        .join("");
    } else {
      tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; color: #666;">
                        Tidak ada data sensor
                    </td>
                </tr>
            `;
    }
  }

  async loadAllData() {
    await Promise.all([
      this.loadCurrentData(),
      this.loadSummary(),
      this.loadHistoricalData(),
    ]);

    // Update system time
    document.getElementById("system-time").textContent =
      new Date().toLocaleString("id-ID");
  }

  startAutoRefresh() {
    // Refresh current data setiap 3 detik
    setInterval(async () => {
      await this.loadCurrentData();
      document.getElementById("system-time").textContent =
        new Date().toLocaleString("id-ID");
    }, 3000);

    // Refresh summary dan historical data setiap 10 detik
    setInterval(async () => {
      await this.loadSummary();
      await this.loadHistoricalData();
    }, 10000);

    // Refresh system status setiap 30 detik
    setInterval(async () => {
      await this.checkSystemStatus();
    }, 30000);
  }
}

// Initialize dashboard when page loads
document.addEventListener("DOMContentLoaded", () => {
  new SensorDashboard();

  // Add some visual feedback
  console.log("🌡️ IoT Sensor Dashboard initialized");
});
