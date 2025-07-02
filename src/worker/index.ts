import { Hono } from "hono";
import { cors } from "hono/cors";
import { createClient } from '@supabase/supabase-js';

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for all API endpoints
app.use('/api/*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST'],
}));

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

// S3 Upload endpoint with Supabase authentication
app.post("/api/upload", async (c) => {
  try {
    // Get authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: "Authentication required" }, 401);
    }

    const token = authHeader.replace('Bearer ', '');

    // Initialize Supabase client
    const supabaseUrl = c.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = c.env.SERVICE_ROLE_KEY; // Service role key for server-side auth
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return c.json({ error: "Supabase configuration missing" }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return c.json({ error: "Invalid authentication token" }, 401);
    }

    const body = await c.req.json();
    const { fileName, data } = body;

    // Validate required fields
    if (!fileName || !data) {
      return c.json({ error: "Missing fileName or data" }, 400);
    }

    // Get S3 config from environment variables
    const bucketName = c.env.CLOUDFLARE_BUCKET_NAME;
    const region = 'auto'; // Cloudflare R2 uses 'auto' region
    const accessKeyId = c.env.CLOUDFLARE_ACCESS_KEY_ID;
    const secretAccessKey = c.env.CLOUDFLARE_SECRET_ACCESS_KEY;
    const endpoint = c.env.CLOUDFLARE_S3_API_URL;

    if (!bucketName || !accessKeyId || !secretAccessKey || !endpoint) {
      return c.json({ error: "S3 configuration missing in environment variables" }, 500);
    }

    // Ensure fileName ends with .json
    const finalFileName = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
    
    // Check if filename already exists for this user
    const { data: existingUpload, error: checkError } = await supabase
      .from('uploads')
      .select('id')
      .eq('user_id', user.id)
      .eq('filename', finalFileName)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Database check error:', checkError);
      return c.json({ error: "Database error while checking filename" }, 500);
    }

    if (existingUpload) {
      return c.json({ 
        error: "Filename already exists",
        message: `A file named "${finalFileName}" already exists. Please choose a different name.`
      }, 409);
    }
    
    // For Cloudflare R2, the URL should be: https://accountid.r2.cloudflarestorage.com/bucketname/filename
    // But your endpoint already includes the account ID, so we construct it properly
    const url = `${endpoint}/${bucketName}/${finalFileName}`;

    // Create date for AWS signature
    const now = new Date();
    const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStamp = now.toISOString().slice(0, 19).replace(/[-:]/g, '') + 'Z';
    
    // Convert data to bytes
    const dataBytes = new TextEncoder().encode(JSON.stringify(data));
    const contentSha256 = await sha256(JSON.stringify(data));
    
    // Create canonical request for Cloudflare R2
    const host = new URL(endpoint).host;
    const canonicalUri = `/${bucketName}/${finalFileName}`;
    const canonicalQueryString = '';
    const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${contentSha256}\nx-amz-date:${timeStamp}\n`;
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
    
    const canonicalRequest = [
      'PUT',
      canonicalUri,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      contentSha256
    ].join('\n');

    // Create string to sign
    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
    const stringToSign = [
      algorithm,
      timeStamp,
      credentialScope,
      await sha256(canonicalRequest)
    ].join('\n');

    // Calculate signature
    const signature = await getSignature(secretAccessKey, dateStamp, region, 's3', stringToSign);

    // Create authorization header
    const authorization = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    console.log('Upload URL:', url);
    console.log('Authorization:', authorization);

    // Make the upload request
    const uploadResponse = await fetch(url, {
      method: 'PUT',
      headers: {
        'Host': host,
        'x-amz-content-sha256': contentSha256,
        'x-amz-date': timeStamp,
        'Authorization': authorization,
        'Content-Type': 'application/json'
      },
      body: dataBytes
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('S3 upload failed:', errorText);
      console.error('Response status:', uploadResponse.status);
      console.error('Response headers:', Object.fromEntries(uploadResponse.headers.entries()));
      return c.json({ 
        error: 'Upload failed', 
        details: errorText,
        status: uploadResponse.status
      }, 500);
    }

    // Generate the CDN URL if available
    const cdnUrl = c.env.CLOUDFLARE_CDN_URL;
    const publicUrl = cdnUrl ? `${cdnUrl}/${finalFileName}` : `${cdnUrl}/${bucketName}/${finalFileName}`;

    // Calculate file size
    const fileSize = new TextEncoder().encode(JSON.stringify(data)).length;

    // Save upload record to database
    const { data: uploadRecord, error: dbError } = await supabase
      .from('uploads')
      .insert({
        user_id: user.id,
        filename: finalFileName,
        file_url: publicUrl,
        file_size: fileSize,
        metadata: {
          snapshot_type: 'tldraw',
          upload_timestamp: new Date().toISOString(),
          original_filename: fileName
        }
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Don't fail the upload if DB save fails, but log it
      return c.json({ 
        success: true, 
        message: 'Snapshot uploaded successfully (database record failed)',
        url: publicUrl,
        fileName: finalFileName,
        warning: 'Upload record could not be saved to database'
      });
    }

    return c.json({ 
      success: true, 
      message: 'Snapshot uploaded successfully',
      url: publicUrl,
      fileName: finalFileName,
      uploadId: uploadRecord.id
    });

  } catch (error) {
    console.error('Upload error:', error);
    return c.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Helper functions for AWS signature
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmac(key: Uint8Array, message: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message));
  return new Uint8Array(signature);
}

async function getSignature(
  secretAccessKey: string,
  dateStamp: string,
  region: string,
  service: string,
  stringToSign: string
): Promise<string> {
  const kDate = await hmac(new TextEncoder().encode(`AWS4${secretAccessKey}`), dateStamp);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, service);
  const kSigning = await hmac(kService, 'aws4_request');
  const signature = await hmac(kSigning, stringToSign);
  
  return Array.from(signature).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default app;
