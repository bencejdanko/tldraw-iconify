import { useState, useEffect, useCallback } from 'react'
import { Upload, X, User, AlertCircle, Check } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { UploadService } from '../services/uploads'

interface S3UploadDialogProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (fileName: string) => Promise<void>
  isUploading: boolean
}

export function S3UploadDialog({ isOpen, onClose, onUpload, isUploading }: S3UploadDialogProps) {
  const [fileName, setFileName] = useState('')
  const [isCheckingFilename, setIsCheckingFilename] = useState(false)
  const [filenameStatus, setFilenameStatus] = useState<'available' | 'taken' | 'error' | null>(null)
  const { user } = useAuth()

  // Debounced filename availability check
  const checkFilenameAvailability = useCallback(async (filename: string) => {
    if (!filename.trim() || !user) {
      setFilenameStatus(null)
      return
    }

    setIsCheckingFilename(true)
    try {
      const isAvailable = await UploadService.isFilenameAvailable(filename)
      setFilenameStatus(isAvailable ? 'available' : 'taken')
    } catch (error) {
      console.error('Error checking filename availability:', error)
      setFilenameStatus('error')
    } finally {
      setIsCheckingFilename(false)
    }
  }, [user])

  // Debounce the filename check
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkFilenameAvailability(fileName)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [fileName, checkFilenameAvailability])

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setFileName('')
      setFilenameStatus(null)
      setIsCheckingFilename(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fileName.trim() || filenameStatus === 'taken') {
      return
    }
    await onUpload(fileName.trim())
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      pointerEvents: 'all'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        minWidth: '400px',
        maxWidth: '500px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
        position: 'relative'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '600',
            color: '#1a1a1a'
          }}>
            Upload Snapshot to Cloud
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            disabled={isUploading}
          >
            <X size={20} color="#666" />
          </button>
        </div>

        <div style={{
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: user ? '#f0f9f5' : '#fef2f2',
          borderRadius: '8px',
          fontSize: '14px',
          color: user ? '#065f46' : '#991b1b',
          border: `1px solid ${user ? '#10b981' : '#ef4444'}`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <User size={16} />
            <strong>{user ? 'Authenticated' : 'Authentication Required'}</strong>
          </div>
          {user ? (
            <div>
              Signed in as {user.email}. Your uploaded snapshots will be saved to your account.
            </div>
          ) : (
            <div>
              You must be signed in to upload snapshots. Please authenticate first.
            </div>
          )}
        </div>

        <div style={{
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#6b7280'
        }}>
          Your snapshot will be uploaded to your configured Cloudflare R2 storage and accessible via your CDN.
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151'
              }}>
                File Name *
              </label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${
                    filenameStatus === 'taken' ? '#ef4444' :
                    filenameStatus === 'available' ? '#10b981' :
                    '#d1d5db'
                  }`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                placeholder="my-awesome-drawing"
                required
                disabled={isUploading}
              />
              <div style={{
                fontSize: '12px',
                marginTop: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: '#6b7280' }}>
                  The .json extension will be added automatically
                </span>
                {fileName.trim() && user && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px'
                  }}>
                    {isCheckingFilename ? (
                      <span style={{ color: '#6b7280' }}>Checking...</span>
                    ) : filenameStatus === 'available' ? (
                      <>
                        <Check size={12} style={{ color: '#10b981' }} />
                        <span style={{ color: '#10b981' }}>Available</span>
                      </>
                    ) : filenameStatus === 'taken' ? (
                      <>
                        <AlertCircle size={12} style={{ color: '#ef4444' }} />
                        <span style={{ color: '#ef4444' }}>Already exists</span>
                      </>
                    ) : filenameStatus === 'error' ? (
                      <>
                        <AlertCircle size={12} style={{ color: '#f59e0b' }} />
                        <span style={{ color: '#f59e0b' }}>Check failed</span>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            marginTop: '24px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                backgroundColor: (isUploading || !fileName.trim() || !user || filenameStatus === 'taken') ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: (isUploading || !fileName.trim() || !user || filenameStatus === 'taken') ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              disabled={isUploading || !fileName.trim() || !user || filenameStatus === 'taken'}
            >
              <Upload size={16} />
              {isUploading ? 'Uploading...' : !user ? 'Sign In Required' : filenameStatus === 'taken' ? 'Filename Taken' : 'Upload Snapshot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
