import { supabase } from '../lib/supabase';

const BUCKET = 'listing-images';

export const storageService = {
  uploadImage: async (file: File, listingId: string) => {
    const fileName = `${listingId}/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from(BUCKET).upload(fileName, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
    return { storagePath: data.path, url: publicUrl };
  },
  deleteImage: async (storagePath: string) => {
    return supabase.storage.from(BUCKET).remove([storagePath]);
  },
};
