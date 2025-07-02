import { supabase } from '../lib/supabase'
import { Json } from '../types/database'

export interface Upload {
  id: string
  user_id: string
  filename: string
  file_url: string
  file_size?: number | null
  metadata?: Json | null
  created_at: string
  updated_at: string
}

export interface CreateUploadData {
  filename: string
  file_url: string
  file_size?: number | null
  metadata?: Json | null
}

export class UploadService {
  static async createUpload(data: CreateUploadData): Promise<Upload | null> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User must be authenticated to create uploads')
    }

    const { data: upload, error } = await supabase
      .from('uploads')
      .insert({
        user_id: user.id,
        filename: data.filename,
        file_url: data.file_url,
        file_size: data.file_size,
        metadata: data.metadata,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create upload: ${error.message}`)
    }

    return upload
  }

  static async getUserUploads(userId?: string): Promise<Upload[]> {
    const { data: { user } } = await supabase.auth.getUser()
    const targetUserId = userId || user?.id
    
    if (!targetUserId) {
      throw new Error('User ID is required')
    }

    const { data: uploads, error } = await supabase
      .from('uploads')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch uploads: ${error.message}`)
    }

    return uploads || []
  }

  static async getUploadById(id: string): Promise<Upload | null> {
    const { data: upload, error } = await supabase
      .from('uploads')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Failed to fetch upload: ${error.message}`)
    }

    return upload
  }

  static async deleteUpload(id: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User must be authenticated to delete uploads')
    }

    const { error } = await supabase
      .from('uploads')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Only allow users to delete their own uploads

    if (error) {
      throw new Error(`Failed to delete upload: ${error.message}`)
    }

    return true
  }

  static async isFilenameAvailable(filename: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User must be authenticated to check filename availability')
    }

    // Ensure filename ends with .json for consistency
    const finalFileName = filename.endsWith('.json') ? filename : `${filename}.json`

    const { data: existingUpload, error } = await supabase
      .from('uploads')
      .select('id')
      .eq('user_id', user.id)
      .eq('filename', finalFileName)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw new Error(`Failed to check filename availability: ${error.message}`)
    }

    return !existingUpload // Return true if no existing upload found
  }
}
