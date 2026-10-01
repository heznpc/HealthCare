import { storage } from './storage';
import { createGuestPolicy } from './guestPolicy.mjs';

export const guestPolicy = createGuestPolicy(storage);
