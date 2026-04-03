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

function SnapshotToolbar({ onToggleIconLookup }: { 
	onToggleIconLookup: () => void
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
				gap: '12px',
				alignItems: 'center',
				backgroundColor: 'rgba(255, 255, 255, 0.7)',
				backdropFilter: 'blur(12px)',
				WebkitBackdropFilter: 'blur(12px)',
				borderRadius: '12px',
				boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
				padding: '12px',
				border: '1px solid rgba(255, 255, 255, 0.4)'
			}}>
				<button 
					onClick={copyToClipboard}
					style={{
						padding: '10px 14px',
						backgroundColor: '#6366f1',
						backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
						color: 'white',
						border: 'none',
						borderRadius: '8px',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						fontWeight: '500',
						transition: 'transform 0.2s, box-shadow 0.2s',
						boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)'
					}}
					title="Copy to Clipboard"
					onMouseEnter={(e) => {
						e.currentTarget.style.transform = 'translateY(-1px)'
						e.currentTarget.style.boxShadow = '0 4px 8px rgba(79, 70, 229, 0.3)'
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.transform = 'translateY(0)'
						e.currentTarget.style.boxShadow = '0 2px 4px rgba(79, 70, 229, 0.2)'
					}}
				>
					<Clipboard size={18} />
				</button>
				<button 
					onClick={onToggleIconLookup}
					style={{
						padding: '10px 14px',
						backgroundColor: '#06b6d4',
						backgroundImage: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
						color: 'white',
						border: 'none',
						borderRadius: '8px',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						fontWeight: '500',
						transition: 'transform 0.2s, box-shadow 0.2s',
						boxShadow: '0 2px 4px rgba(8, 145, 178, 0.2)'
					}}
					title="Icon Lookup"
					onMouseEnter={(e) => {
						e.currentTarget.style.transform = 'translateY(-1px)'
						e.currentTarget.style.boxShadow = '0 4px 8px rgba(8, 145, 178, 0.3)'
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.transform = 'translateY(0)'
						e.currentTarget.style.boxShadow = '0 2px 4px rgba(8, 145, 178, 0.2)'
					}}
				>
					<Shapes size={18} />
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
					SharePanel: () => (
						<SnapshotToolbar 
							onToggleIconLookup={() => setShowIconLookup(!showIconLookup)}
						/>
					),
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