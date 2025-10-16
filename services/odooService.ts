import type { OdooSale } from '../types.ts';

// These variables are read by Vite and will be available on the client.
const ODOO_URL = (import.meta.env && import.meta.env.VITE_ODOO_URL) || "";

// A generic function to make proxied JSON-RPC calls to our Odoo serverless function.
async function odooRpc(model: string, method: string, args: any[] = [], kwargs: object = {}) {
  // If the VITE_ODOO_URL is not set, we shouldn't even try to make a call.
  if (!ODOO_URL) {
    throw new Error('Odoo integration is not configured. Please set VITE_ODOO_URL in your environment variables.');
  }

  const response = await fetch('/api/odoo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, method, args, kwargs }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Odoo API request failed');
  }

  const result = await response.json();
  if (result.error) {
    // Odoo's error messages can be complex, so we try to extract the useful part.
    throw new Error(result.error.data?.message || JSON.stringify(result.error) || 'Odoo returned an error');
  }
  return result.result;
}

// A specific function to get sales data based on the user's requirements.
export async function getOdooSalesData(dateFrom?: string, dateTo?: string): Promise<OdooSale[]> {
  // Define the domain (filter) for the Odoo search.
  const domain: any[] = [
      ['state', 'in', ['sale', 'done']], // Fetch only confirmed sales orders.
  ];
  if (dateFrom) {
    domain.push(['date_order', '>=', dateFrom]);
  }
  if (dateTo) {
    domain.push(['date_order', '<=', dateTo]);
  }

  // Define the fields to be read from the 'sale.order' model.
  // These are based on the user's request and assumptions about custom field names.
  const fields = [
    'name', // Order Reference
    'date_order',
    'partner_id', // Customer (relational field)
    'amount_total', // Amount Paid
    'x_studio_vehicle_no', // Custom field for Vehicle No
    'x_studio_driver', // Custom field for Driver Name
    'x_studio_commission', // Custom field for Our Commission
    'x_studio_from', // Custom field for From location
    'x_studio_to', // Custom field for To location
  ];

  const sales = await odooRpc('sale.order', 'search_read', [domain], { fields });

  // The Odoo API returns relational fields as an array [id, "Display Name"].
  // We need to process this into a more usable format.
  return sales.map((sale: any) => ({
    id: sale.id,
    customerName: sale.partner_id ? sale.partner_id[1] : 'N/A',
    phone: 'N/A', // Phone number requires another call, so we'll omit for now for simplicity.
    amountPaid: sale.amount_total,
    vehicleNo: sale.x_studio_vehicle_no || 'N/A',
    driverName: sale.x_studio_driver || 'N/A',
    commission: sale.x_studio_commission || 0,
    amountPayable: sale.amount_total - (sale.x_studio_commission || 0),
    from: sale.x_studio_from || 'N/A',
    to: sale.x_studio_to || 'N/A',
    date: sale.date_order,
  }));
}