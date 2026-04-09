// Test script for cron job
// Run with: node test-cron.js

const CRON_SECRET = process.env.CRON_SECRET || "carebite_cron_secret_2024_secure_key_xyz789";
const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

async function testCron() {
  console.log("Testing cron endpoint...");
  console.log("URL:", `${BASE_URL}/api/auto-order/cron`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/auto-order/cron`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${CRON_SECRET}`,
      },
    });

    const data = await response.json();
    
    console.log("\n=== Response ===");
    console.log("Status:", response.status);
    console.log("Data:", JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log("\n✓ Cron endpoint is working!");
      if (data.activeWindow) {
        console.log(`✓ Active window: ${data.activeWindow}`);
        console.log(`✓ Processed: ${data.processed} orders`);
      } else {
        console.log("ℹ No active time window (this is normal outside meal times)");
      }
    } else {
      console.log("\n✗ Cron endpoint returned an error");
    }
  } catch (error) {
    console.error("\n✗ Error testing cron:", error.message);
    console.log("\nMake sure your dev server is running: npm run dev");
  }
}

testCron();
