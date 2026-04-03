import { AssetRecordType, type TLAsset, type TLBookmarkAsset, getHashForString } from 'tldraw'

const UNFURLER_URL = 'https://unfurler-worker.bencejdanko.workers.dev'

// How does our server handle bookmark unfurling?
export async function getBookmarkPreview({ url }: { url: string }): Promise<TLAsset> {
	// we start with an empty asset record
	const asset: TLBookmarkAsset = {
		id: AssetRecordType.createId(getHashForString(url)),
		typeName: 'asset',
		type: 'bookmark',
		meta: {},
		props: {
			src: url,
			description: '',
			image: '',
			favicon: '',
			title: '',
		},
	}

	try {
		const fetchUrl = `${UNFURLER_URL}/unfurl?url=${encodeURIComponent(url)}`
		
		// try to fetch the preview data from the server
		const response = await fetch(fetchUrl)
		
		if (!response.ok) {
			console.error(`Unfurler failed with status: ${response.status} ${response.statusText}`)
			return asset
		}

		const contentType = response.headers.get('content-type')
		if (!contentType || !contentType.includes('application/json')) {
			const text = await response.text()
			console.error(`Unfurler returned non-JSON response (${contentType}): ${text.slice(0, 100)}...`)
			return asset
		}

		const data = await response.json()

		// fill in our asset with whatever info we found
		asset.props.description = data?.description ?? ''
		asset.props.image = data?.image ?? ''
		asset.props.favicon = data?.favicon ?? ''
		asset.props.title = data?.title ?? ''
	} catch (e) {
		console.error('Failed to unfurl URL:', e)
	}

	return asset
}