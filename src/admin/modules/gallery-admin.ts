import { collection, addDoc, deleteDoc, doc, getDocs, updateDoc, orderBy, query } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, handleFirestoreError } from '../../firebase';
import { OperationType } from '../../types';

export interface GalleryPhoto {
  id: string;
  url: string;
  storagePath: string;
  caption: string;
  order: number;
}

export async function fetchGalleryPhotos(): Promise<GalleryPhoto[]> {
  const firestore = db;
  if (!firestore) return [];
  const galleryRef = collection(firestore, 'gallery');
  const q = query(galleryRef, orderBy('order', 'asc'));
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        url: data.url || '',
        storagePath: data.storagePath || '',
        caption: data.caption || '',
        order: data.order || 0
      };
    });
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, 'gallery');
  }
}

export async function uploadPhoto(
  file: File,
  caption: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  const firestore = db;
  const firestorage = storage;
  if (!firestore || !firestorage) {
    throw new Error('O Firebase ou Firebase Storage não está disponível.');
  }

  // 1. Validation: jpeg, png, webp, max 5MB
  const allowedMime = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMime.includes(file.type)) {
    throw new Error('Formato inválido. Apenas imagens JPEG, PNG ou WEBP são autorizadas.');
  }

  const maxBytes = 5 * 1024 * 1024; // 5MB
  if (file.size > maxBytes) {
    throw new Error('A imagem excede o tamanho limite de 5MB.');
  }

  // 2. Generate unique name
  const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const storagePath = `gallery/${Date.now()}_${cleanName}`;
  const storageRef = ref(firestorage, storagePath);

  // 3 & 4. Upload with uploadBytesResumable
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(Math.round(progress));
        }
      },
      (error) => {
        console.error('Upload Error:', error);
        reject(new Error('Falha no upload para o Storage: ' + error.message));
      },
      async () => {
        try {
          // 5. Get URL & Save metadata in Firestore
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const currentPhotos = await fetchGalleryPhotos();
          
          await addDoc(collection(firestore, 'gallery'), {
            url: downloadURL,
            storagePath: storagePath,
            caption: caption,
            order: currentPhotos.length + 1,
            uploadedAt: new Date()
          });
          resolve();
        } catch (dbError) {
          reject(dbError);
        }
      }
    );
  });
}

export async function deletePhoto(docId: string, storagePath: string): Promise<void> {
  const firestore = db;
  if (!firestore) return;

  // 1. Try deleting from Firebase Storage
  if (storage && storagePath) {
    try {
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    } catch (e: any) {
      console.warn('Ficheiro já não se encontrava no Storage. Apagando no Firestore...', e.message);
    }
  }

  // 2. Delete document from Firestore
  try {
    await deleteDoc(doc(firestore, 'gallery', docId));
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, `gallery/${docId}`);
  }
}

export async function reorderPhotos(orderedIds: string[]): Promise<void> {
  const firestore = db;
  if (!firestore) return;
  try {
    const batchPromises = orderedIds.map((id, index) => {
      const docRef = doc(firestore, 'gallery', id);
      return updateDoc(docRef, { order: index + 1 });
    });
    await Promise.all(batchPromises);
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, 'gallery/reorder');
  }
}
