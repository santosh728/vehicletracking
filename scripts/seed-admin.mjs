import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";

const [username, password] = process.argv.slice(2);
if (!username || !password || password.length < 6) {
  console.error("Usage: node scripts/seed-admin.mjs <username> <password>");
  process.exit(1);
}
if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not configured.");
  process.exit(1);
}

const client = await MongoClient.connect(process.env.MONGODB_URI);
try {
  const db = client.db(process.env.MONGODB_DB || "vehicle_tracking");
  await db.collection("users").updateOne(
    { username },
    {
      $set: {
        username,
        passwordHash: await bcrypt.hash(password, 12),
        role: "super_admin",
        fullName: "RouteWatch Administrator",
        email: "",
        mobile: "",
        address: "",
        updatedAt: new Date()
      },
      $setOnInsert: { createdAt: new Date() }
    },
    { upsert: true }
  );
  await db.collection("users").createIndex({ username: 1 }, { unique: true });
  await db.collection("users").createIndex({ email: 1 }, { unique: true, sparse: true });
  await db.collection("vehicles").createIndex({ ownerId: 1, validUntil: 1 });
  console.log(`Administrator ${username} is ready.`);
} finally {
  await client.close();
}
