import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { planName, price, userId, userEmail, cpf } = await request.json();

    const cleanKey = process.env.ASAAS_API_KEY?.trim();
    const ASAAS_API_URL = process.env.ASAAS_API_URL;

    console.log("--- PROCESSANDO CHECKOUT ASAAS ---");
    console.log("Usuário:", userEmail);
    console.log("CPF enviado:", cpf ? "SIM" : "NÃO");

    if (!cleanKey || cleanKey.includes('SUA_CHAVE_AQUI')) {
      throw new Error('Chave de API do Asaas não foi inserida no código.');
    }

    const headers = {
      'Content-Type': 'application/json',
      'access_token': cleanKey
    };

    /* ==============================================
       2. BUSCAR, CRIAR OU ATUALIZAR CLIENTE
    ============================================== */
    const customerSearchResponse = await fetch(
      `${ASAAS_API_URL}/customers?email=${encodeURIComponent(userEmail)}`,
      { headers }
    );
    
    // Se aqui der erro 401 ou "inválida", a chave realmente está errada no painel do Asaas
    const customerSearchData = await customerSearchResponse.json();

    if (customerSearchData.errors) {
      throw new Error(`Asaas Auth: ${customerSearchData.errors[0].description}`);
    }

    let customerId: string;

    if (customerSearchData.data && customerSearchData.data.length > 0) {
      customerId = customerSearchData.data[0].id;
      
      // Atualiza o CPF sempre, para garantir que não falhe na assinatura
      await fetch(`${ASAAS_API_URL}/customers/${customerId}`, {
        method: 'POST', 
        headers,
        body: JSON.stringify({ 
            cpfCnpj: cpf.replace(/\D/g, '') 
        })
      });
      console.log("Cliente localizado e atualizado:", customerId);
    } else {
      const newCustomerResponse = await fetch(`${ASAAS_API_URL}/customers`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: userEmail.split('@')[0],
          email: userEmail,
          cpfCnpj: cpf.replace(/\D/g, ''),
          externalReference: userId,
        }),
      });
      const newCustomerData = await newCustomerResponse.json();
      if (newCustomerData.errors) throw new Error(`Erro Cliente: ${newCustomerData.errors[0].description}`);
      customerId = newCustomerData.id;
    }

    /* ===============================
       3. CRIAR ASSINATURA
    =============================== */
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1);
    const nextDueDate = dueDate.toISOString().split('T')[0];

    const subscriptionResponse = await fetch(
      `${ASAAS_API_URL}/subscriptions`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          customer: customerId,
          billingType: 'UNDEFINED',
          value: Number(price),
          nextDueDate,
          cycle: 'MONTHLY',
          description: `Assinatura MentePsi - Plano ${planName}`,
          externalReference: userId,
        }),
      }
    );

    const subscriptionData = await subscriptionResponse.json();

    if (subscriptionData.errors) {
      throw new Error(`Erro Assinatura: ${subscriptionData.errors[0].description}`);
    }

    /* ===============================
       4. RECUPERAR LINK DA FATURA
    =============================== */
    const paymentsResponse = await fetch(
      `${ASAAS_API_URL}/payments?subscription=${subscriptionData.id}`,
      { headers }
    );
    const paymentsData = await paymentsResponse.json();

    if (paymentsData.data && paymentsData.data.length > 0) {
      console.log("Checkout gerado com sucesso!");
      return NextResponse.json({
        invoiceUrl: paymentsData.data[0].invoiceUrl,
      });
    }

    throw new Error('Fatura não encontrada.');

  } catch (error: any) {
    console.error('ERRO NO CHECKOUT:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}