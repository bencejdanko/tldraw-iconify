import { useCallback, useState, useRef, useEffect, useMemo } from 'react'
import { Tldraw, getSnapshot, useEditor, TLRecord, TLAssetId, createTLStore, defaultShapeUtils } from 'tldraw'
import 'tldraw/tldraw.css'
import { Clipboard, Upload, Check, X } from 'lucide-react'
import { toast, Toaster } from 'sonner'
import { IconLookup } from './components/IconLookup'
import { getBookmarkPreview } from './components/getBookmarkPreview'
import Draggable from 'react-draggable'


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

	const [isInputVisible, setIsInputVisible] = useState(false)
	const [snapshotText, setSnapshotText] = useState('')

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

	const loadSnapshot = useCallback(() => {
		if (!snapshotText.trim()) return

		try {
			const snapshotData = JSON.parse(snapshotText)
			editor.loadSnapshot(snapshotData)
			toast.success('Loaded snapshot successfully!')
			setIsInputVisible(false)
			setSnapshotText('')
		} catch (error) {
			toast.error('Failed to load snapshot: Invalid JSON')
			console.error('Failed to load snapshot:', error)
		}
	}, [editor, snapshotText])

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
					onClick={() => setIsInputVisible(!isInputVisible)}
					style={{
						padding: '10px 14px',
						backgroundColor: isInputVisible ? '#ef4444' : '#10b981',
						backgroundImage: isInputVisible 
							? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
							: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
						color: 'white',
						border: 'none',
						borderRadius: '8px',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						fontWeight: '500',
						transition: 'transform 0.2s, box-shadow 0.2s',
						boxShadow: isInputVisible 
							? '0 2px 4px rgba(239, 68, 68, 0.2)' 
							: '0 2px 4px rgba(16, 185, 129, 0.2)'
					}}
					title={isInputVisible ? "Cancel" : "Load from Snapshot"}
					onMouseEnter={(e) => {
						e.currentTarget.style.transform = 'translateY(-1px)'
						e.currentTarget.style.boxShadow = isInputVisible 
							? '0 4px 8px rgba(239, 68, 68, 0.3)' 
							: '0 4px 8px rgba(16, 185, 129, 0.3)'
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.transform = 'translateY(0)'
						e.currentTarget.style.boxShadow = isInputVisible 
							? '0 2px 4px rgba(239, 68, 68, 0.2)' 
							: '0 2px 4px rgba(16, 185, 129, 0.2)'
					}}
				>
					{isInputVisible ? <X size={18} /> : <Upload size={18} />}
				</button>
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
					<img src={(window as any).__PUBLIC_PATH__ ? `${(window as any).__PUBLIC_PATH__}/iconify.png` : "/iconify.png"} alt="Iconify" style={{ width: '18px', height: '18px', display: 'block' }} />
				</button>
			</div>
			{isInputVisible && (
				<div style={{
					display: 'flex', 
					flexDirection: 'column',
					gap: '8px',
					backgroundColor: 'rgba(255, 255, 255, 0.8)',
					backdropFilter: 'blur(12px)',
					WebkitBackdropFilter: 'blur(12px)',
					borderRadius: '12px',
					boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
					padding: '12px',
					border: '1px solid rgba(255, 255, 255, 0.4)',
					width: '300px',
					marginTop: '4px'
				}}>
					<textarea
						value={snapshotText}
						onChange={(e) => setSnapshotText(e.target.value)}
						placeholder="Paste your snapshot JSON here..."
						style={{
							width: '100%',
							height: '120px',
							padding: '10px',
							borderRadius: '8px',
							border: '1px solid rgba(0, 0, 0, 0.1)',
							backgroundColor: 'rgba(255, 255, 255, 0.5)',
							fontSize: '12px',
							fontFamily: 'monospace',
							resize: 'vertical',
							outline: 'none'
						}}
					/>
					<div style={{ display: 'flex', gap: '8px' }}>
						<button 
							onClick={loadSnapshot}
							disabled={!snapshotText.trim()}
							style={{
								flex: 1,
								padding: '8px 12px',
								backgroundColor: '#10b981',
								backgroundImage: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
								color: 'white',
								border: 'none',
								borderRadius: '8px',
								cursor: snapshotText.trim() ? 'pointer' : 'not-allowed',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: '6px',
								fontWeight: '500',
								opacity: snapshotText.trim() ? 1 : 0.6
							}}
						>
							<Check size={16} />
							<span>Load Snapshot</span>
						</button>
					</div>
				</div>
			)}
		</div>
	)
}


// Get VS Code API once
declare const vscode: any;
const vscodeApi = typeof vscode !== 'undefined' ? vscode : null;

export default function App() {
	const [showIconLookup, setShowIconLookup] = useState(!vscodeApi) // Hide by default in VS Code
    const [editor, setEditor] = useState<ReturnType<typeof useEditor> | null>(null)
	const draggableRef = useRef(null)

    const lastSentSnapshot = useRef<string>('');
    const isReceivingUpdate = useRef<boolean>(false);

    // Sync with VS Code
    useEffect(() => {
        if (!vscodeApi || !editor) return;

        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            switch (message.type) {
                case 'update':
                    if (message.text) {
                        try {
                            const incomingData = JSON.parse(message.text);
                            const currentData = lastSentSnapshot.current ? JSON.parse(lastSentSnapshot.current) : null;

                            // Only load if the data is actually different (ignoring whitespace)
                            if (JSON.stringify(incomingData) !== JSON.stringify(currentData)) {
                                isReceivingUpdate.current = true;
                                try {
                                    editor.loadSnapshot(incomingData);
                                    // Update lastSentSnapshot to the actual state in the editor (normalized/pruned)
                                    // to avoid triggering a redundant edit event on the next onChange
                                    const cleaned = getCleanedSnapshot(editor);
                                    lastSentSnapshot.current = JSON.stringify(cleaned, null, 2);
                                } finally {
                                    isReceivingUpdate.current = false;
                                }
                            }
                        } catch (e) {
                            console.error('Failed to parse snapshot', e);
                        }
                    }
                    break;
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [editor]);

    // Handle store changes for VS Code
    useEffect(() => {
        if (!vscodeApi || !editor) return;

        let timeout: any;
        const onChange = () => {
            if (isReceivingUpdate.current) return;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                const snapshot = getCleanedSnapshot(editor);
                const snapshotStr = JSON.stringify(snapshot, null, 2);
                
                // Skip if the state is identical to what we already know (e.g. normalization/pruning didn't change it)
                if (snapshotStr === lastSentSnapshot.current) return;

                lastSentSnapshot.current = snapshotStr;
                vscodeApi.postMessage({
                    type: 'edit',
                    text: snapshotStr
                });
            }, 200); // 200ms debounce is more responsive while still avoiding too many writes
        };

        const dispose = editor.store.listen(onChange, { source: 'user', scope: 'document' });
        return () => {
            dispose();
            clearTimeout(timeout);
        };
    }, [editor]);


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
                    setEditor(editor)
					editor.registerExternalAssetHandler('url', getBookmarkPreview)
                    // signal ready to VS Code to get the initial text
                    if (vscodeApi) {
                        vscodeApi.postMessage({ type: 'ready' });
                    }
				}}
			>
				{showIconLookup && (
					<Draggable nodeRef={draggableRef} handle=".drag-handle">
						<div 
							ref={draggableRef}
							style={{
								position: 'fixed',
								left: '20px',
								top: '10vh',
								zIndex: 0,
								pointerEvents: 'all'
							}}
						>
							<IconLookup 
								maxResults={24} 
								onClose={() => setShowIconLookup(false)} 
							/>
						</div>
					</Draggable>
				)}
			</Tldraw>
			<Toaster />
		</div>
	)
}