import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const TENANT_ID = Deno.env.get("MICROSOFT_TENANT_ID");
const CLIENT_ID = Deno.env.get("MICROSOFT_CLIENT_ID");
const CLIENT_SECRET = Deno.env.get("MICROSOFT_CLIENT_SECRET");
const SITE_ID = Deno.env.get("SHAREPOINT_SITE_ID");
const DRIVE_ID = Deno.env.get("SHAREPOINT_DRIVE_ID");

async function getAccessToken() {
  const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await response.json();
  return data.access_token;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { folderPath, fileName, fileContent, contentType } = await req.json();

    if (!folderPath || !fileName || !fileContent) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const accessToken = await getAccessToken();

    // Convert base64 to binary
    const binaryContent = Uint8Array.from(atob(fileContent), c => c.charCodeAt(0));

    // Upload file to SharePoint
    const fullPath = `${folderPath}/${fileName}`;
    const uploadUrl = `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root:/${fullPath}:/content`;
    
    console.log("Uploading to:", uploadUrl);

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": contentType || "application/octet-stream"
      },
      body: binaryContent
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      console.error("SharePoint upload error:", errorData);
      return Response.json({ error: 'Upload failed', details: errorData }, { status: uploadResponse.status });
    }

    const result = await uploadResponse.json();

    return Response.json({ 
      success: true, 
      file: {
        id: result.id,
        name: result.name,
        size: result.size,
        webUrl: result.webUrl
      }
    });

  } catch (error) {
    console.error("Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});