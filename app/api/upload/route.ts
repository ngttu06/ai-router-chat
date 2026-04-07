import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { fileContents } from '@/server/file-store';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export async function POST(request: NextRequest) {
  try {
    // Ensure upload directory exists
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const uploadedFiles = [];

    for (const file of files) {
      const fileId = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = uniqueSuffix + '-' + file.name;
      const filepath = path.join(UPLOAD_DIR, filename);

      // Write file to disk
      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(filepath, buffer);

      // Read file content and store in memory
      try {
        const content = buffer.toString('utf-8');
        fileContents.set(fileId, {
          name: file.name,
          content,
          mimeType: file.type,
        });
      } catch (e) {
        fileContents.set(fileId, {
          name: file.name,
          content: `[Binary file: ${file.name}, size: ${file.size} bytes]`,
          mimeType: file.type,
        });
      }

      uploadedFiles.push({
        id: fileId,
        name: file.name,
        size: file.size,
        mimeType: file.type,
      });
    }

    return NextResponse.json({ files: uploadedFiles });
  } catch (error: any) {
    console.error('Error uploading files:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload files' }, { status: 500 });
  }
}
