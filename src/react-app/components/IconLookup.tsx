import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { iconifyService } from '../services/iconify'
import type { IconifyIcon } from '../types/iconify'

interface IconLookupProps {
  maxResults?: number
  defaultQuery?: string
  onClose?: () => void
}

export function IconLookup({ maxResults = 20, defaultQuery = '', onClose }: IconLookupProps) {
  const [query, setQuery] = useState(defaultQuery)
  const [icons, setIcons] = useState<IconifyIcon[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState('#000000')


  const searchIcons = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setIcons([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await iconifyService.searchIcons({
        query: searchQuery,
        limit: maxResults
      })
      
      const convertedIcons = iconifyService.convertSearchResults(response)
      setIcons(convertedIcons)
    } catch (err) {
      setError('Failed to search icons')
      console.error('Icon search error:', err)
    } finally {
      setLoading(false)
    }
  }, [maxResults])

  const copyIconSvg = useCallback(async (icon: IconifyIcon) => {
    try {
      // Use the API to get the colored and sized SVG directly
      // This ensures consistency with the search results and handles complex SVGs correctly
      const svgUrl = iconifyService.getIconSvgUrl(icon.prefix, icon.name, {
        color: selectedColor,
        width: 64,
        height: 64
      })
      
      const response = await fetch(svgUrl)
      if (!response.ok) throw new Error('Failed to fetch SVG from API')
      const svgContent = await response.text()
      
      await navigator.clipboard.writeText(svgContent)
      toast.success(`Copied ${icon.prefix}:${icon.name} with color ${selectedColor} (64px)`)
    } catch (err) {
      toast.error('Failed to copy SVG')
      console.error('Copy error:', err)
    }
  }, [selectedColor])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchIcons(query)
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [query, searchIcons])

  return (
    <div style={{
      width: '320px',
      height: '80vh',
      padding: '20px',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid #e1e5e9'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <div 
          className="drag-handle"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            flex: 1,
            cursor: 'grab'
          }}
        >
          <img src="/iconify.png" alt="Iconify" style={{ width: '24px', height: '24px', pointerEvents: 'none' }} />
          <h3 style={{ 
            margin: 0, 
            fontSize: '18px', 
            fontWeight: '600',
            color: '#333',
            userSelect: 'none',
            pointerEvents: 'none'
          }}>
            Icon Lookup
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px',
              color: '#666',
              borderRadius: '4px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ✕
          </button>
        )}
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for icons..."
          style={{
            width: '100%',
            padding: '12px',
            border: '2px solid #e1e5e9',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s ease',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => e.target.style.borderColor = '#007acc'}
          onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
        />
      </div>

      <div style={{ 
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <label style={{
          fontSize: '14px',
          fontWeight: '500',
          color: '#333',
          minWidth: 'fit-content'
        }}>
          Color:
        </label>
        <input
          type="color"
          value={selectedColor}
          onChange={(e) => setSelectedColor(e.target.value)}
          style={{
            width: '32px',
            height: '32px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            padding: '0'
          }}
          title="Select icon color"
        />
        <span style={{
          fontSize: '12px',
          color: '#666',
          fontFamily: 'monospace',
          backgroundColor: '#f5f5f5',
          padding: '2px 6px',
          borderRadius: '4px'
        }}>
          {selectedColor}
        </span>
        <button
          onClick={() => setSelectedColor('#000000')}
          style={{
            background: 'none',
            border: '1px solid #e1e5e9',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '12px',
            cursor: 'pointer',
            color: '#666'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f0f0f0'
            e.currentTarget.style.borderColor = '#ccc'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.borderColor = '#e1e5e9'
          }}
          title="Reset to black"
        >
          Reset
        </button>
      </div>

      {loading && (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#666',
          fontSize: '14px'
        }}>
          Searching icons...
        </div>
      )}

      {error && (
        <div style={{
          padding: '8px 12px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '6px',
          marginBottom: '16px',
          fontSize: '14px',
          border: '1px solid #f5c6cb'
        }}>
          {error}
        </div>
      )}

      {icons.length > 0 && !loading && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
            gap: '8px',
            overflowY: 'auto',
            padding: '4px',
            flex: 1
          }}>
            {icons.map((icon) => {
              const svgUrl = iconifyService.getIconSvgUrl(icon.prefix, icon.name, { 
                color: selectedColor,
                width: 32, 
                height: 32 
              })
              
              return (
                <div
                  key={`${icon.prefix}:${icon.name}`}
                  onClick={() => copyIconSvg(icon)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '8px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                  title={`Click to copy SVG: ${icon.prefix}:${icon.name}${icon.title ? ` (${icon.title})` : ''} with color ${selectedColor} (64px)`}
                >
                  <div style={{ position: 'relative' }}>
                    <img
                      src={svgUrl}
                      alt={`${icon.prefix}:${icon.name}`}
                      style={{
                        width: '32px',
                        height: '32px',
                        display: 'block'
                      }}
                    />
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: '#666',
                    textAlign: 'center',
                    marginTop: '4px',
                    lineHeight: '1.2',
                    wordBreak: 'break-all',
                    maxWidth: '100%'
                  }}>
                    {icon.name}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {query && !loading && icons.length === 0 && !error && (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#666',
          fontSize: '14px'
        }}>
          No icons found for "{query}"
        </div>
      )}
    </div>
  )
}
