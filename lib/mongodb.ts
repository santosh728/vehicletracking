import { MongoClient, Db } from "mongodb";

const globalForMongo = globalThis as unknown as {
  mongoClientPromise?: Promise<MongoClient>;
};

export async function getDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not configured.");
  const clientPromise =
    globalForMongo.mongoClientPromise ??
    new MongoClient(uri).connect();
  if (process.env.NODE_ENV !== "production") {
    globalForMongo.mongoClientPromise = clientPromise;
  }
  return (await clientPromise).db(process.env.MONGODB_DB || "vehicle_tracking");
}
