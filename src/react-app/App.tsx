import { useCallback, useState } from 'react'
import { Tldraw, getSnapshot, useEditor, TLRecord, TLAssetId } from 'tldraw'
import 'tldraw/tldraw.css'
import { Clipboard, Shapes } from 'lucide-react'
import { toast, Toaster } from 'sonner'
import { IconLookup } from './components/IconLookup'
import { getBookmarkPreview } from './components/getBookmarkPreview'

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
	const cleanedDocument = {
		...document,
		store: pruneUnusedAssets(Object.values(document.store))
			.reduce((acc, record) => {
				acc[record.id] = record
				return acc
			}, {} as Record<string, TLRecord>)
	}
	
	return { document: cleanedDocument, session }
}

function SnapshotToolbar({ onToggleIconLookup }: { onToggleIconLookup: () => void }) {
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
			</div>
		</div>
	)
}

export default function App() {
	const [showIconLookup, setShowIconLookup] = useState(true)

	return (
		<div style={{ position: 'fixed', inset: 0 }}>
			<Tldraw
				components={{
					SharePanel: () => <SnapshotToolbar onToggleIconLookup={() => setShowIconLookup(!showIconLookup)} />,
				}}
        onMount={(editor) => {
          editor.registerExternalAssetHandler('url', getBookmarkPreview)
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
			<Toaster />
		</div>
	)
}