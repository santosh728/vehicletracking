import { MongoClient, ObjectId } from "mongodb";

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not configured.");
  process.exit(1);
}

const client = await MongoClient.connect(process.env.MONGODB_URI);
try {
  const db = client.db(process.env.MONGODB_DB || "vehicle_tracking");

  // Get the admin user id
  const admin = await db.collection("users").findOne({ username: "santosh" });
  if (!admin) {
    console.error("Admin user not found. Run seed-admin.mjs first.");
    process.exit(1);
  }
  const ownerId = String(admin._id);

  // Clear existing vehicles
  await db.collection("vehicles").deleteMany({});

  const today = new Date().toISOString().slice(0, 10);
  const future = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };
  const past = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  };

  const vehicles = [
    {
      vehicleNumber: "MH12AB1234",
      driverName: "Ramesh Kumar",
      billNumber: "123456789012",
      origin: "Mumbai",
      destination: "Pune",
      departedFrom: today,
      validUntil: future(5),
      notes: "Fresh vegetables cargo",
      ownerId,
      createdAt: new Date()
    },
    {
      vehicleNumber: "DL01CD5678",
      driverName: "Suresh Sharma",
      billNumber: "234567890123",
      origin: "Delhi",
      destination: "Jaipur",
      departedFrom: today,
      validUntil: future(3),
      notes: "Electronics goods",
      ownerId,
      createdAt: new Date()
    },
    {
      vehicleNumber: "KA05EF9012",
      driverName: "Mahesh Reddy",
      billNumber: "345678901234",
      origin: "Bangalore",
      destination: "Chennai",
      departedFrom: past(1),
      validUntil: future(2),
      notes: "Textile products",
      ownerId,
      createdAt: new Date()
    },
    {
      vehicleNumber: "GJ03GH3456",
      driverName: "Dinesh Patel",
      billNumber: "456789012345",
      origin: "Ahmedabad",
      destination: "Surat",
      departedFrom: past(2),
      validUntil: future(1),
      notes: "Chemical goods",
      ownerId,
      createdAt: new Date()
    },
    {
      vehicleNumber: "TN09IJ7890",
      driverName: "Vijay Murugan",
      billNumber: "567890123456",
      origin: "Chennai",
      destination: "Coimbatore",
      departedFrom: past(3),
      validUntil: today,
      notes: "Machinery parts",
      ownerId,
      createdAt: new Date()
    },
    {
      vehicleNumber: "UP32KL2345",
      driverName: "Anil Yadav",
      billNumber: "678901234567",
      origin: "Lucknow",
      destination: "Kanpur",
      departedFrom: past(1),
      validUntil: future(7),
      notes: "Food grains",
      ownerId,
      createdAt: new Date()
    },
    {
      vehicleNumber: "RJ14MN6789",
      driverName: "Bharat Singh",
      billNumber: "789012345678",
      origin: "Jaipur",
      destination: "Jodhpur",
      departedFrom: today,
      validUntil: future(4),
      notes: "Marble blocks",
      ownerId,
      createdAt: new Date()
    },
    {
      vehicleNumber: "WB24OP0123",
      driverName: "Sanjay Das",
      billNumber: "890123456789",
      origin: "Kolkata",
      destination: "Bhubaneswar",
      departedFrom: past(2),
      validUntil: future(6),
      notes: "Steel rods",
      ownerId,
      createdAt: new Date()
    }
  ];

  await db.collection("vehicles").insertMany(vehicles);
  console.log(`Inserted ${vehicles.length} dummy vehicles successfully.`);
} finally {
  await client.close();
}
