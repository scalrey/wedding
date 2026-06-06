/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export interface GalleryImage {
  src: string;
  alt: string;
  caption?: string;
}

export interface RSVPEntry {
  name: string;
  phone: string;
  attending: 'yes' | 'no';
  guests: number;
  message?: string;
  submittedAt?: unknown; // Firebase ServerTimestamp
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}
