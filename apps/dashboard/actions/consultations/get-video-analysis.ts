"use server";

import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { verifySession } from "@/lib/session";

const BUCKET = process.env.AWS_S3_BUCKET_NAME || "omni-two";
const PREFIX = "audiometry-test-evaluation/";
const MAX_PAGES = 20; // guard against infinite loops (covers up to 20,000 objects)

/**
 * Fetches the video call AI analysis .txt file for a consultation from S3.
 * Files are named: {timestamp}-consultation-{consultationId}-{suffix}.txt
 * Paginates through ListObjectsV2 results so files beyond the first 1000 are found.
 */
export async function getVideoAnalysis(
  consultationId: string
): Promise<string | null> {
  const user = await verifySession();
  if (!user?.token) {
    throw new Error("Unauthorized");
  }

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error("[VideoAnalysis] AWS credentials not configured");
    throw new Error("AWS credentials not configured");
  }

  const region = process.env.AWS_REGION || "ap-south-1";
  const s3 = new S3Client({
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    requestHandler: {
      requestTimeout: 10_000, // 10 s per S3 request
    } as any,
  });

  const searchKey = `consultation-${consultationId}`;

  try {
    let continuationToken: string | undefined;
    let pages = 0;

    do {
      const listResult = await s3.send(
        new ListObjectsV2Command({
          Bucket: BUCKET,
          Prefix: PREFIX,
          MaxKeys: 1000,
          ContinuationToken: continuationToken,
        })
      );

      const match = (listResult.Contents ?? []).find((obj) =>
        obj.Key?.includes(searchKey)
      );

      if (match?.Key) {
        const getResult = await s3.send(
          new GetObjectCommand({ Bucket: BUCKET, Key: match.Key })
        );
        const body = getResult.Body;
        if (!body) return null;
        return await body.transformToString();
      }

      continuationToken = listResult.NextContinuationToken;
      pages++;
    } while (continuationToken && pages < MAX_PAGES);

    console.warn(`[VideoAnalysis] No analysis found for consultation ${consultationId} after ${pages} page(s)`);
    return null;
  } catch (err) {
    console.error("[VideoAnalysis] Failed to fetch from S3:", err);
    throw err; // re-throw so the UI shows "Failed to load analysis" with the real error
  }
}
