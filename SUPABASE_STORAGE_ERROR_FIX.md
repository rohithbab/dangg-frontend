# Analysis & Fix: Configuring Cloudflare R2 Storage on Self-Hosted Supabase

If the images are supposed to be stored on **Cloudflare R2** (which is an S3-compatible storage service), then seeing a local filesystem **extended attributes (`xattr`)** error indicates one of two issues:

1. **Fallback to Local File Storage (Most Likely):** 
   The Supabase Storage container did not successfully connect to Cloudflare R2 (due to missing, misconfigured, or unapplied environment variables). As a result, it fell back to its default local `file` storage engine, attempting to write uploads to a local bind-mounted volume on your Mac which does not support `xattrs`.
   
2. **Local TUS Cache Bind-Mount:**
   Even when configured with an S3-compatible backend (like Cloudflare R2), the Storage service still runs a **Tus server** locally to handle multipart/resumable uploads. It uses a local directory inside the container (`/var/lib/storage`) as a temporary cache. If this cache directory is bind-mounted to a folder on your macOS host (e.g. `./volumes/storage`), the Tus server will still try to write metadata with `xattrs` to the host directory and throw the error.

---

## 🛠️ How to Fix it (S3/Cloudflare R2 Setup)

To fix this, the self-hosted Supabase stack needs to be configured to use **S3-compatible storage** and the local cache volume must use a **named Docker volume** instead of a host bind-mount.

### 1. Update `docker-compose.yml` for Cloudflare R2
In the `docker-compose.yml` file, configure the `storage` service with the following S3-compatible environment variables to point directly to Cloudflare R2:

```yaml
storage:
  image: supabase/storage-api:vX.Y.Z
  environment:
    # 1. Set backend to S3
    - STORAGE_BACKEND=s3
    
    # 2. Cloudflare R2 Credentials
    - AWS_ACCESS_KEY_ID=your_cloudflare_r2_access_key_id
    - AWS_SECRET_ACCESS_KEY=your_cloudflare_r2_secret_access_key
    - AWS_DEFAULT_REGION=auto
    
    # 3. Cloudflare R2 Bucket Details
    - AWS_S3_BUCKET=your_r2_bucket_name
    
    # 4. R2 endpoint format: https://<account-id>.r2.cloudflarestorage.com
    - AWS_S3_ENDPOINT=https://your_cloudflare_account_id.r2.cloudflarestorage.com
    
    # 5. R2 force path style
    - AWS_S3_FORCE_PATH_STYLE=true
    
    # 6. TUS Upload Path configuration to bypass local path conflicts
    - TUS_URL_PATH=/storage/v1/upload/resumable
```

### 2. Update Volume Mounts for Cache
Ensure the local cache directory does not use a host bind-mount. 

**Change this:**
```yaml
    volumes:
      - ./volumes/storage:/var/lib/storage
```
**To a named volume:**
```yaml
    volumes:
      - supabase_storage_cache:/var/lib/storage
```
And declare the named volume at the bottom of the `docker-compose.yml`:
```yaml
volumes:
  supabase_storage_cache:
```

---

## 📋 Prompt to give your Backend AI Assistant

Copy and paste the prompt below to your backend developer assistant/AI to get the exact files updated:

```markdown
Our self-hosted Supabase stack on macOS is throwing a filesystem "extended attributes" (xattr) error during image uploads because it is writing to local host bind mounts. 

The images are supposed to be stored on Cloudflare R2 (S3-compatible backend). 

Please update our docker-compose configuration (`docker-compose.yml` or related configurations) to point the Supabase Storage service to Cloudflare R2 and resolve the xattr error:

1. Configure the `storage` service environment variables:
   - Set `STORAGE_BACKEND=s3`
   - Set S3 connection variables: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION=auto`, `AWS_S3_BUCKET`, and the `AWS_S3_ENDPOINT` (formatted as https://<account_id>.r2.cloudflarestorage.com).
   - Set `AWS_S3_FORCE_PATH_STYLE=true`.
   - Set `TUS_URL_PATH: '/storage/v1/upload/resumable'`.

2. Fix the volume mount to avoid the macOS bind-mount xattr limitation:
   - Change the volume mapping for the `storage` service from a bind mount (e.g. `./volumes/storage:/var/lib/storage`) to a named Docker volume (e.g., `supabase_storage_cache`), and declare it in the top-level `volumes` block.

Please provide the exact configurations needed for our environment.
```
