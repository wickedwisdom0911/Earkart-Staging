"use server";

import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { verifySession } from "@/lib/session";

const BUCKET = process.env.AWS_S3_BUCKET_NAME || "omni-two";
const PREFIX = "audiometry-test-evaluation/";

/**
 * Fetches the video call AI analysis .txt file for a consultation from S3.
 * Files are in audiometry-test-evaluation/ with naming: {timestamp}-consultation-{consultationId}-{suffix}.txt
 */
export async function getVideoAnalysis(
  consultationId: string
): Promise<string | null> {
  const user = await verifySession();
  if (!user?.token) {
    throw new Error("Unauthorized");
  }

  const region = process.env.AWS_REGION || "ap-south-1";
  const s3 = new S3Client({
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
  });

  try {
    const listResult = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: PREFIX,
      })
    );

    const objects = listResult.Contents ?? [];

    const match = objects.find((obj) =>
      obj.Key?.includes(`consultation-${consultationId}`)
    );

    if (!match?.Key) return null;

    const getResult = await s3.send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: match.Key,
      })
    );

    const body = getResult.Body;
    if (!body) return null;

    return await body.transformToString();
  } catch (err) {
    console.error("Failed to fetch video analysis from S3:", err);
    return null;
  }
}
