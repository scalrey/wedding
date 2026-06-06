import { collection, getDocs, orderBy, query, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError } from '../../firebase';
import { OperationType, type RSVPEntry } from '../../types';

export interface RSVPEntryWithId extends RSVPEntry {
  id: string;
}

export async function fetchAllRSVPs(): Promise<RSVPEntryWithId[]> {
  const firestore = db;
  if (!firestore) return [];
  const rsvpsRef = collection(firestore, 'rsvps');
  const q = query(rsvpsRef, orderBy('submittedAt', 'desc'));
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data() as RSVPEntry;
      return {
        ...data,
        id: docSnapshot.id
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'rsvps');
  }
}

export function exportToCSV(entries: RSVPEntryWithId[]): void {
  // UTF-8 BOM so Portuguese accents show up correctly in Excel
  const BOM = '\uFEFF';
  let csvContent = BOM + 'Nome,Telefone,Vai?,Acompanhantes,Mensagem,Data de Submissão\n';
  
  entries.forEach(entry => {
    const name = `"${(entry.name || '').replace(/"/g, '""')}"`;
    const phone = `"${(entry.phone || '').replace(/"/g, '""')}"`;
    const attending = entry.attending === 'yes' ? 'Sim' : 'Não';
    const guests = entry.guests;
    const message = `"${(entry.message || '').replace(/"/g, '""')}"`;
    
    let dateStr = '';
    if (entry.submittedAt) {
      try {
        const t = entry.submittedAt as any;
        const d = typeof t.toDate === 'function' ? t.toDate() : new Date(t);
        dateStr = d.toISOString().replace('T', ' ').substring(0, 19);
      } catch (e) {
        dateStr = String(entry.submittedAt);
      }
    }
    
    csvContent += `${name},${phone},${attending},${guests},${message},${dateStr}\n`;
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateSuffix = new Date().toISOString().slice(0, 10);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `rsvp_viana_iracelma_${dateSuffix}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function deleteRSVP(docId: string): Promise<boolean> {
  const firestore = db;
  if (!firestore) return false;
  if (!confirm('Tem a certeza que deseja remover esta confirmação? Esta ação não pode ser desfeita.')) {
    return false;
  }
  try {
    await deleteDoc(doc(firestore, 'rsvps', docId));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `rsvps/${docId}`);
  }
}
