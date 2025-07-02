import { useCallback, useState } from 'react'
import { Tldraw, getSnapshot, useEditor, TLRecord, TLAssetId, loadSnapshot, TLStoreSnapshot } from 'tldraw'
import 'tldraw/tldraw.css'
import { Clipboard, Shapes, Upload, User, FolderOpen } from 'lucide-react'
import { toast, Toaster } from 'sonner'
import { IconLookup } from './components/IconLookup'
import { getBookmarkPreview } from './components/getBookmarkPreview'
import { S3UploadDialog } from './components/S3UploadDialog'
import { AuthComponent } from './components/AuthComponent'
import { UploadsView } from './components/UploadsView'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './hooks/useAuth'

// Function to prune unused assets from records, similar to official tldraw implementation
function pruneUnusedAssets(records: TLRecord[]) {
	const usedAssets = new Set<TLAssetId>()
	
	// Find all assets that are actually being used by shapes
	for (const record of records) {
		if (record.typeName === 'shape' && 'assetId' in record.props && record.props.assetId) {
			usedAssets.add(record.props.assetId)
		}
	}
	
	// Filter out assets that are not being used
	return records.filter((r) => r.typeName !== 'asset' || usedAssets.has(r.id))
}

// Function to get a cleaned snapshot with unused records pruned
function getCleanedSnapshot(editor: ReturnType<typeof useEditor>) {
	const { document, session } = getSnapshot(editor.store)
	
	// Prune unused assets from the document records
	const prunedRecords = pruneUnusedAssets(Object.values(document.store))
	const cleanedStore = prunedRecords.reduce((acc, record) => {
		acc[record.id] = record
		return acc
	}, {} as Record<string, TLRecord>)
	
	// Return the snapshot in the correct tldraw format
	return {
		document: {
			...document,
			store: cleanedStore
		},
		session
	}
}

function SnapshotToolbar({ onToggleIconLookup, onShowS3Upload, onToggleAuth, onShowUploads }: { 
	onToggleIconLookup: () => void
	onShowS3Upload: () => void 
	onToggleAuth: () => void
	onShowUploads: () => void
}) {
	const editor = useEditor()

	const copyToClipboard = useCallback(async () => {
		try {
			const snapshotData = getCleanedSnapshot(editor)
			const jsonString = JSON.stringify(snapshotData, null, 2)
			await navigator.clipboard.writeText(jsonString)
			toast.success('Copied cleaned snapshot to clipboard!')
		} catch (error) {
			toast.error('Failed to copy to clipboard')
			console.error('Failed to copy to clipboard:', error)
		}
	}, [editor])

	return (
		<div style={{ 
			padding: 20, 
			pointerEvents: 'all', 
			display: 'flex', 
			flexDirection: 'column',
			gap: '10px',
			alignItems: 'flex-start'
		}}>
			<div style={{
				display: 'flex', 
				gap: '10px',
				alignItems: 'center',
				backgroundColor: 'rgba(255, 255, 255, 0.9)',
				borderRadius: '8px',
				boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
				padding: '20px'
			}}>
				<button 
					onClick={copyToClipboard}
					style={{
						padding: '8px 12px',
						backgroundColor: '#6f42c1',
						color: 'white',
						border: 'none',
						borderRadius: '4px',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						gap: '6px'
					}}
					title="Copy to Clipboard"
				>
					<Clipboard size={16} />
				</button>
				<button 
					onClick={onShowS3Upload}
					style={{
						padding: '8px 12px',
						backgroundColor: '#10b981',
						color: 'white',
						border: 'none',
						borderRadius: '4px',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						gap: '6px'
					}}
					title="Upload to S3"
				>
					<Upload size={16} />
				</button>
				<button 
					onClick={onToggleIconLookup}
					style={{
						padding: '8px 12px',
						backgroundColor: '#17a2b8',
						color: 'white',
						border: 'none',
						borderRadius: '4px',
						cursor: 'pointer'
					}}
				>
					<Shapes size={16} />
				</button>
				<button 
					onClick={onToggleAuth}
					style={{
						padding: '8px 12px',
						backgroundColor: '#f59e0b',
						color: 'white',
						border: 'none',
						borderRadius: '4px',
						cursor: 'pointer'
					}}
					title="Authentication"
				>
					<User size={16} />
				</button>
				<button 
					onClick={onShowUploads}
					style={{
						padding: '8px 12px',
						backgroundColor: '#8b5cf6',
						color: 'white',
						border: 'none',
						borderRadius: '4px',
						cursor: 'pointer'
					}}
					title="My Uploads"
				>
					<FolderOpen size={16} />
				</button>
			</div>
		</div>
	)
}

function TldrawApp() {
	const [showIconLookup, setShowIconLookup] = useState(true)
	const [showS3Upload, setShowS3Upload] = useState(false)
	const [showAuth, setShowAuth] = useState(false)
	const [showUploads, setShowUploads] = useState(false)
	const [isUploading, setIsUploading] = useState(false)
	const [editorRef, setEditorRef] = useState<ReturnType<typeof useEditor> | null>(null)
	const { user, session } = useAuth()

	const handleS3Upload = useCallback(async (fileName: string) => {
		// Check authentication first
		if (!user || !session) {
			toast.error('Please sign in to upload snapshots')
			setShowAuth(true)
			return
		}

		setIsUploading(true)
		try {
			if (!editorRef) {
				toast.error('Editor not available')
				return
			}

			const snapshotData = getCleanedSnapshot(editorRef)

			const response = await fetch('/api/upload', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${session.access_token}`
				},
				body: JSON.stringify({
					fileName,
					data: snapshotData
				})
			})

			const result = await response.json()

			if (!response.ok) {
				if (response.status === 409) {
					// Handle duplicate filename error
					toast.error(`Filename already exists. Please choose a different name.`)
				} else {
					throw new Error(result.error || 'Upload failed')
				}
				return
			}

			toast.success(`Snapshot uploaded successfully as ${result.fileName}`)
			if (result.url) {
				toast.success(`Access your snapshot at: ${result.url}`)
			}
			setShowS3Upload(false)
		} catch (error) {
			console.error('Upload error:', error)
			if (error instanceof Error && error.message.includes('Authentication')) {
				toast.error('Authentication required. Please sign in.')
				setShowAuth(true)
			} else {
				toast.error(error instanceof Error ? error.message : 'Upload failed')
			}
		} finally {
			setIsUploading(false)
		}
	}, [editorRef, user, session])

	const handleShowS3Upload = useCallback(() => {
		if (!user) {
			toast.error('Please sign in to upload snapshots')
			setShowAuth(true)
			return
		}
		setShowS3Upload(true)
	}, [user])

	const handleShowUploads = useCallback(() => {
		if (!user) {
			toast.error('Please sign in to view uploads')
			setShowAuth(true)
			return
		}
		setShowUploads(true)
	}, [user])

	const handleLoadSnapshot = useCallback(async (snapshotData: { document: { store: Record<string, unknown>, schema?: unknown }, session: Record<string, unknown> }) => {
		if (!editorRef) {
			toast.error('Editor not available')
			return
		}

		try {
			// Reset tool state before loading snapshot as recommended in the docs
			editorRef.setCurrentTool('select')
			
			// Load the snapshot into the editor's store
			// Based on the docs, loadSnapshot expects the full snapshot object with document and session
			// Use unknown conversion to work around TypeScript strictness
			loadSnapshot(editorRef.store, snapshotData as unknown as TLStoreSnapshot)
			
			toast.success('Snapshot loaded successfully!')
		} catch (error) {
			console.error('Failed to load snapshot:', error)
			toast.error('Failed to load snapshot')
		}
	}, [editorRef])

	return (
		<div style={{ position: 'fixed', inset: 0 }}>
			<Tldraw
				components={{
					SharePanel: () => (					<SnapshotToolbar 
						onToggleIconLookup={() => setShowIconLookup(!showIconLookup)}
						onShowS3Upload={handleShowS3Upload} 
						onToggleAuth={() => setShowAuth(!showAuth)}
						onShowUploads={handleShowUploads}
					/>
					),
				}}
        onMount={(editor) => {
          editor.registerExternalAssetHandler('url', getBookmarkPreview)
					setEditorRef(editor)
        }}
			/>
			{showIconLookup && (
				<div style={{
					position: 'fixed',
					left: '20px',
					top: '50%',
					transform: 'translateY(-50%)',
					zIndex: 1000,
					pointerEvents: 'all'
				}}>
					<IconLookup 
						maxResults={24} 
						onClose={() => setShowIconLookup(false)} 
					/>
				</div>
			)}
			{showAuth && (
				<div 
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: 'rgba(0, 0, 0, 0.5)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 1000,
						pointerEvents: 'all'
					}}
					onClick={() => setShowAuth(false)}
				>
					<div 
						style={{
							maxHeight: '90vh',
							overflowY: 'auto'
						}}
						onClick={(e) => e.stopPropagation()}
					>
						<AuthComponent onClose={() => setShowAuth(false)} />
					</div>
				</div>
			)}
			{showUploads && (
				<div 
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: 'rgba(0, 0, 0, 0.5)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 1000,
						pointerEvents: 'all'
					}}
					onClick={() => setShowUploads(false)}
				>
					<div 
						style={{
							maxHeight: '90vh',
							overflowY: 'auto'
						}}
						onClick={(e) => e.stopPropagation()}
					>
						<UploadsView 
							onClose={() => setShowUploads(false)} 
							onLoadSnapshot={handleLoadSnapshot}
						/>
					</div>
				</div>
			)}
			<S3UploadDialog
				isOpen={showS3Upload}
				onClose={() => setShowS3Upload(false)}
				onUpload={handleS3Upload}
				isUploading={isUploading}
			/>
			<Toaster />
		</div>
	)
}

export default function App() {
	return (
		<AuthProvider>
			<TldrawApp />
		</AuthProvider>
	)
}