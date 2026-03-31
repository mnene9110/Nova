'use server';

/**
 * @fileOverview Deprecated PesaPal integration.
 * Payment logic has been migrated to Paystack.
 */

export async function initializePesaPalTransaction() {
  return { error: 'PesaPal integration is no longer active. Please use Paystack.' };
}

export async function getTransactionStatus() {
  return { error: 'PesaPal integration is no longer active.' };
}
