const crypto = require('crypto');

class PayFastService {
  constructor() {
    this.merchantId = process.env.PAYFAST_MERCHANT_ID;
    this.merchantKey = process.env.PAYFAST_MERCHANT_KEY;
    this.passphrase = process.env.PAYFAST_PASSPHRASE;
    this.sandbox = process.env.NODE_ENV !== 'production';
    this.baseUrl = this.sandbox ? 'https://sandbox.payfast.co.za' : 'https://www.payfast.co.za';
  }

  generatePaymentData(userId, userEmail, amount = 99.00) {
    const data = {
      merchant_id: this.merchantId,
      merchant_key: this.merchantKey,
      return_url: `${process.env.NEXT_PUBLIC_API_URL}/payment/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_API_URL}/payment/cancel`,
      notify_url: `${process.env.NEXT_PUBLIC_API_URL}/api/payment/notify`,
      name_first: 'CV',
      name_last: 'Rewriter',
      email_address: userEmail,
      m_payment_id: userId,
      amount: amount.toFixed(2),
      item_name: 'CV Rewriter Premium Access',
      item_description: 'Lifetime access to AI-powered CV rewriting'
    };

    // Generate signature
    const signature = this.generateSignature(data);
    data.signature = signature;

    return data;
  }

  generateSignature(data) {
    // Create parameter string
    let paramString = '';
    for (const key in data) {
      if (data[key] !== '' && data[key] !== null && data[key] !== undefined) {
        paramString += `${key}=${encodeURIComponent(data[key])}&`;
      }
    }
    
    // Remove last ampersand
    paramString = paramString.slice(0, -1);
    
    // Add passphrase if provided
    if (this.passphrase) {
      paramString += `&passphrase=${encodeURIComponent(this.passphrase)}`;
    }

    return crypto.createHash('md5').update(paramString).digest('hex');
  }

  verifyPayment(postData) {
    const signature = postData.signature;
    delete postData.signature;

    const generatedSignature = this.generateSignature(postData);
    return signature === generatedSignature;
  }

  getPaymentUrl() {
    return `${this.baseUrl}/eng/process`;
  }
}

module.exports = PayFastService;