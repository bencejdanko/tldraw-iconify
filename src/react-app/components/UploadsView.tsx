import { useState, useEffect, useCallback } from 'react'
import { Upload, Trash2, Download, RefreshCw, X } from 'lucide-react'
import { toast } from 'sonner'
import { UploadService, Upload as UploadType } from '../services/uploads'
import { useAuth } from '../hooks/useAuth'

interface SnapshotData {
  document: {
    store: Record<string, unknown>
    schema?: unknown
  }
  session: Record<string, unknown>
}

interface UploadsViewProps {
  onClose: () => void
  onLoadSnapshot: (snapshotData: SnapshotData) => void
}

export function UploadsView({ onClose, onLoadSnapshot }: UploadsViewProps) {
  const [uploads, setUploads] = useState<UploadType[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [loadingSnapshot, setLoadingSnapshot] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchUploads = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      const userUploads = await UploadService.getUserUploads()
      setUploads(userUploads)
    } catch (error) {
      console.error('Failed to fetch uploads:', error)
      toast.error('Failed to load uploads')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchUploads()
  }, [fetchUploads])

  const handleDelete = async (uploadId: string) => {
    if (!confirm('Are you sure you want to delete this upload?')) return

    setDeleting(uploadId)
    try {
      await UploadService.deleteUpload(uploadId)
      setUploads(uploads.filter(upload => upload.id !== uploadId))
      toast.success('Upload deleted successfully')
    } catch (error) {
      console.error('Failed to delete upload:', error)
      toast.error('Failed to delete upload')
    } finally {
      setDeleting(null)
    }
  }

  const handleLoadSnapshot = async (upload: UploadType) => {
    setLoadingSnapshot(upload.id)
    try {
      // Fetch the snapshot data from the S3 URL
      const response = await fetch(upload.file_url)
      if (!response.ok) {
        throw new Error('Failed to fetch snapshot data')
      }
      
      const snapshotData = await response.json()
      onLoadSnapshot(snapshotData)
      toast.success(`Loaded snapshot: ${upload.filename}`)
      onClose()
    } catch (error) {
      console.error('Failed to load snapshot:', error)
      toast.error('Failed to load snapshot')
    } finally {
      setLoadingSnapshot(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return 'Unknown size'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (!user) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        minWidth: '400px',
        maxWidth: '500px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
      }}>
        <p>Please sign in to view your uploads.</p>
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '24px',
      minWidth: '600px',
      maxWidth: '800px',
      maxHeight: '80vh',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <h2 style={{ 
          margin: 0, 
          fontSize: '24px', 
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Upload size={24} />
          My Uploads
        </h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={fetchUploads}
            disabled={loading}
            style={{
              padding: '8px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Refresh"
          >
            <RefreshCw size={16} style={{ 
              animation: loading ? 'spin 1s linear infinite' : 'none' 
            }} />
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        minHeight: '200px'
      }}>
        {loading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '200px',
            color: '#6b7280'
          }}>
            Loading uploads...
          </div>
        ) : uploads.length === 0 ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '200px',
            color: '#6b7280',
            textAlign: 'center'
          }}>
            <Upload size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '16px' }}>No uploads found</p>
            <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
              Create and upload a snapshot to see it here
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {uploads.map((upload) => (
              <div
                key={upload.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#fafafa'
                }}
              >
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    margin: '0 0 4px 0', 
                    fontSize: '16px', 
                    fontWeight: '500',
                    color: '#111827'
                  }}>
                    {upload.filename}
                  </h3>
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#6b7280',
                    display: 'flex',
                    gap: '16px',
                    flexWrap: 'wrap'
                  }}>
                    <span>Created: {formatDate(upload.created_at)}</span>
                    <span>Size: {formatFileSize(upload.file_size)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleLoadSnapshot(upload)}
                    disabled={loadingSnapshot === upload.id}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: loadingSnapshot === upload.id ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '14px',
                      opacity: loadingSnapshot === upload.id ? 0.7 : 1
                    }}
                    title="Load snapshot into editor"
                  >
                    <Download size={14} />
                    {loadingSnapshot === upload.id ? 'Loading...' : 'Load'}
                  </button>
                  <button
                    onClick={() => handleDelete(upload.id)}
                    disabled={deleting === upload.id}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: deleting === upload.id ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '14px',
                      opacity: deleting === upload.id ? 0.7 : 1
                    }}
                    title="Delete upload"
                  >
                    <Trash2 size={14} />
                    {deleting === upload.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Add CSS for spin animation
const style = document.createElement('style')
style.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`
document.head.appendChild(style)
