# S3 Bucket CORS Configuration

For the media upload functionality to work with mobile apps, you need to configure CORS on your S3 bucket.

## AWS Console Setup

1. Go to AWS S3 Console
2. Select your bucket: `friendsleague-uploads`
3. Go to **Permissions** tab
4. Scroll down to **Cross-origin resource sharing (CORS)**
5. Click **Edit** and add this configuration:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "DELETE",
            "HEAD"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": [
            "ETag"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

## Alternative: AWS CLI

```bash
aws s3api put-bucket-cors --bucket friendsleague-uploads --cors-configuration file://cors.json
```

Where `cors.json` contains the above JSON configuration.

## Environment Variables

Make sure these are set in your `.env` file:

```env
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="friendsleague-uploads"
AWS_S3_CLOUDFRONT_URL="https://your-cloudfront-url.com"  # Optional
```

## Testing

After setup, test the presigned URL endpoint:

```bash
curl -X POST http://localhost:3000/upload/presigned-url \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test.jpg",
    "fileType": "image/jpeg",
    "fileSize": 1024000
  }'
```

Expected response:
```json
{
  "uploadUrl": "https://friendsleague-uploads.s3.us-east-1.amazonaws.com/media/images/...",
  "mediaUrl": "https://friendsleague-uploads.s3.us-east-1.amazonaws.com/media/images/...",
  "key": "media/images/..."
}
```
