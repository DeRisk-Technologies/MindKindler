export interface InvoiceTemplateData {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  billTo: {
    name: string;
    address: string;
    email: string;
  };
  from: {
    name: string;
    address: string;
    email: string;
  };
  lineItems: {
    description: string;
    amount: number;
  }[];
  currency: string;
  totalAmount: number;
}

export function generateInvoiceHtml(data: InvoiceTemplateData): string {
  const linesHtml = data.lineItems.map(item => `
    <tr class="item">
      <td>${item.description}</td>
      <td>${data.currency} ${item.amount.toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Invoice ${data.invoiceNumber}</title>
      <style>
        .invoice-box {
          max-width: 800px;
          margin: auto;
          padding: 30px;
          border: 1px solid #eee;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
          font-size: 16px;
          line-height: 24px;
          font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
          color: #555;
        }
        .invoice-box table {
          width: 100%;
          line-height: inherit;
          text-align: left;
        }
        .invoice-box table td {
          padding: 5px;
          vertical-align: top;
        }
        .invoice-box table tr td:nth-child(2) {
          text-align: right;
        }
        .invoice-box table tr.top table td {
          padding-bottom: 20px;
        }
        .invoice-box table tr.top table td.title {
          font-size: 45px;
          line-height: 45px;
          color: #333;
        }
        .invoice-box table tr.information table td {
          padding-bottom: 40px;
        }
        .invoice-box table tr.heading td {
          background: #eee;
          border-bottom: 1px solid #ddd;
          font-weight: bold;
        }
        .invoice-box table tr.details td {
          padding-bottom: 20px;
        }
        .invoice-box table tr.item td {
          border-bottom: 1px solid #eee;
        }
        .invoice-box table tr.item.last td {
          border-bottom: none;
        }
        .invoice-box table tr.total td:nth-child(2) {
          border-top: 2px solid #eee;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="invoice-box">
        <table cellpadding="0" cellspacing="0">
          <tr class="top">
            <td colspan="2">
              <table>
                <tr>
                  <td class="title">
                    MindKindler
                  </td>
                  <td>
                    Invoice #: ${data.invoiceNumber}<br />
                    Created: ${data.issueDate}<br />
                    Due: ${data.dueDate}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr class="information">
            <td colspan="2">
              <table>
                <tr>
                  <td>
                    ${data.from.name}<br />
                    ${data.from.address}<br />
                    ${data.from.email}
                  </td>
                  <td>
                    ${data.billTo.name}<br />
                    ${data.billTo.address}<br />
                    ${data.billTo.email}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr class="heading">
            <td>Item</td>
            <td>Price</td>
          </tr>
          ${linesHtml}
          <tr class="total">
            <td></td>
            <td>Total: ${data.currency} ${data.totalAmount.toFixed(2)}</td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;
}
