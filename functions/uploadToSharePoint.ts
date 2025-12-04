import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// HARDCODED VALUES - same as sharepoint function
const TENANT_ID = "31adb05b-e471-4daf-8831-4d46014be9b8";
const CLIENT_ID = "1291551b-48b1-4e33-beff-d3cb64fa888a";
const CLIENT_SECRET = "vTQ8Q~uhNn1dsGeHfGr3VZvLnQmkYZQ54~gcXcim";
const DRIVE_ID = "b!bS8k36WRSEKjpEG35EBzonsdkmTo4p5MvX4xFGWq8w1fkwthDsxdQL8_MK0t_B3b";

async function getAccessToken() {
  const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
  
  const bodyString = `grant_type=client_credentials&client_id=${encodeURIComponent(CLIENT_ID)}&client_secret=${encodeURIComponent(CLIENT_SECRET)}&scope=${encodeURIComponent('https://graph.microsoft.com/.default')}`;

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { 
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json"
    },
    body: bodyString,
  });

  const data = await response.json();
  console.log("Token response status:", response.status);
  
  if (!response.ok) {
    console.error("Token error:", JSON.stringify(data));
    throw new Error(`Token error: ${data.error_description || data.error}`);
  }
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